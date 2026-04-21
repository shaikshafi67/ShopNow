/**
 * bodySegment.js — Smart clothing compositor
 *
 * Uses a combination of:
 * 1. BodyPix for coarse segmentation (person vs background)
 * 2. Smart torso estimation based on image proportions
 * 3. Aggressive background removal on clothing product images
 * 4. Source-over compositing to preserve true clothing colours
 */

let modelPromise = null;

async function getModel() {
  if (!modelPromise) {
    const tf      = await import('@tensorflow/tfjs');
    await tf.ready();
    const bodyPix = await import('@tensorflow-models/body-pix');
    modelPromise  = bodyPix.load({
      architecture : 'MobileNetV1',
      outputStride : 16,
      multiplier   : 0.75,
      quantBytes   : 2,
    });
  }
  return modelPromise;
}

// ── Strip white/light background from product images ──────────────────────────
function removeClothingBackground(img) {
  const W = img.naturalWidth  || img.width  || 400;
  const H = img.naturalHeight || img.height || 500;

  const c   = document.createElement('canvas');
  c.width   = W;
  c.height  = H;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0, W, H);

  const imgData = ctx.getImageData(0, 0, W, H);
  const d       = imgData.data;

  // Sample corner pixels to get background colour (usually white/grey)
  const corners = [
    [d[0], d[1], d[2]],
    [d[(W - 1) * 4], d[(W - 1) * 4 + 1], d[(W - 1) * 4 + 2]],
    [d[(H - 1) * W * 4], d[(H - 1) * W * 4 + 1], d[(H - 1) * W * 4 + 2]],
    [d[((H - 1) * W + W - 1) * 4], d[((H - 1) * W + W - 1) * 4 + 1], d[((H - 1) * W + W - 1) * 4 + 2]],
  ];
  const bgR = corners.reduce((s, c) => s + c[0], 0) / 4;
  const bgG = corners.reduce((s, c) => s + c[1], 0) / 4;
  const bgB = corners.reduce((s, c) => s + c[2], 0) / 4;

  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const diffR = Math.abs(r - bgR);
    const diffG = Math.abs(g - bgG);
    const diffB = Math.abs(b - bgB);
    const diff  = diffR + diffG + diffB;

    if (diff < 60) {
      // Very close to background → fully transparent
      d[i + 3] = 0;
    } else if (diff < 120) {
      // Soft edge → partial transparency
      d[i + 3] = Math.round((diff - 60) / 60 * 255);
    }
    // else: keep as-is
  }

  ctx.putImageData(imgData, 0, 0);
  return c;
}

// ── Get person bounding box from segmentation ─────────────────────────────────
function getPersonBounds(segmentation, W, H) {
  const { data, width: pw, height: ph } = segmentation;
  const sx = W / pw;
  const sy = H / ph;

  let minX = pw, maxX = 0, minY = ph, maxY = 0, found = false;
  for (let i = 0; i < data.length; i++) {
    if (data[i] !== -1) { // -1 = background
      const x = i % pw;
      const y = Math.floor(i / pw);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      found = true;
    }
  }

  if (!found) return null;
  return {
    x: minX * sx,
    y: minY * sy,
    w: (maxX - minX) * sx,
    h: (maxY - minY) * sy,
    x2: maxX * sx,
    y2: maxY * sy,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

export async function compositeClothingOnBody(bodyImg, clothImg, view) {
  const model = await getModel();

  const W = bodyImg.naturalWidth  || bodyImg.width  || 640;
  const H = bodyImg.naturalHeight || bodyImg.height || 853;

  // ── 1. Draw body to canvas ────────────────────────────────────────────────
  const bodyCanvas    = document.createElement('canvas');
  bodyCanvas.width    = W;
  bodyCanvas.height   = H;
  bodyCanvas.getContext('2d').drawImage(bodyImg, 0, 0, W, H);

  // ── 2. Run BodyPix — whole-person segmentation (more reliable than parts) ──
  const segmentation = await model.segmentPerson(bodyCanvas, {
    internalResolution   : 'medium',
    segmentationThreshold: 0.5,
    maxDetections        : 1,
  });

  // ── 3. Estimate person bounding box ──────────────────────────────────────
  const bounds = getPersonBounds(segmentation, W, H);

  // If BodyPix found the person, derive torso from person bounds
  // Otherwise fall back to sensible defaults
  let torsoX, torsoY, torsoW, torsoH;

  const isProfile = view === 'left' || view === 'right';
  const isBack    = view === 'back';

  if (bounds) {
    const pW = bounds.w;
    const pH = bounds.h;
    const pX = bounds.x;
    const pY = bounds.y;

    // Torso = middle horizontal band of person bounding box
    // Approximately: from 20% of person height (shoulders) to 65% (waist)
    torsoX = pX + pW * (isProfile ? 0.05 : 0.02);
    torsoY = pY + pH * 0.18;
    torsoW = pW * (isProfile ? 0.90 : 0.96);
    torsoH = pH * 0.50;
  } else {
    // Fallback: assume person fills most of the frame
    torsoX = W * (isProfile ? 0.10 : 0.08);
    torsoY = H * 0.18;
    torsoW = W * (isProfile ? 0.80 : 0.84);
    torsoH = H * 0.48;
  }

  // ── 4. Build full-person mask for edge softening ──────────────────────────
  const maskTmp    = document.createElement('canvas');
  maskTmp.width    = segmentation.width;
  maskTmp.height   = segmentation.height;
  const mCtx       = maskTmp.getContext('2d');
  const mData      = mCtx.createImageData(segmentation.width, segmentation.height);

  for (let i = 0; i < segmentation.data.length; i++) {
    const idx = i * 4;
    const val = segmentation.data[i] === 1 ? 255 : 0;
    mData.data[idx]     = val;
    mData.data[idx + 1] = val;
    mData.data[idx + 2] = val;
    mData.data[idx + 3] = val;
  }
  mCtx.putImageData(mData, 0, 0);

  // Scale mask to body resolution
  const maskFull    = document.createElement('canvas');
  maskFull.width    = W;
  maskFull.height   = H;
  maskFull.getContext('2d').drawImage(maskTmp, 0, 0, W, H);

  // ── 5. Remove background from clothing ────────────────────────────────────
  const clothNoBg = removeClothingBackground(clothImg);

  // ── 6. Scale clothing to torso box (cover mode — fill width) ─────────────
  const cAspect   = (clothImg.naturalWidth || clothImg.width) / (clothImg.naturalHeight || clothImg.height);
  let   dw        = torsoW;
  let   dh        = torsoW / cAspect;

  // If clothing height shorter than torso, scale up to fill height
  if (dh < torsoH) { dh = torsoH; dw = torsoH * cAspect; }

  // Centre horizontally over torso box
  const dx = torsoX + (torsoW - dw) / 2;
  const dy = torsoY;

  // ── 7. Composite clothing masked to person silhouette ─────────────────────
  const clothLayer    = document.createElement('canvas');
  clothLayer.width    = W;
  clothLayer.height   = H;
  const clCtx         = clothLayer.getContext('2d');

  // Draw de-backgrounded clothing at torso position
  clCtx.drawImage(clothNoBg, dx, dy, dw, dh);

  // Clip to person silhouette so clothing doesn't spill onto background
  clCtx.globalCompositeOperation = 'destination-in';
  clCtx.drawImage(maskFull, 0, 0);

  // ── 8. Final output ───────────────────────────────────────────────────────
  const out    = document.createElement('canvas');
  out.width    = W;
  out.height   = H;
  const outCtx = out.getContext('2d');

  // Layer 0: original body photo
  outCtx.drawImage(bodyImg, 0, 0, W, H);

  // Layer 1: clothing at full colour (source-over preserves true colours)
  outCtx.globalCompositeOperation = 'source-over';
  outCtx.globalAlpha = 0.94;
  outCtx.drawImage(clothLayer, 0, 0);

  return out;
}
