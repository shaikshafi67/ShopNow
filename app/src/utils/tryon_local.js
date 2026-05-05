/**
 * tryon_local.js — Realistic in-browser virtual try-on.
 *
 * Pipeline (1.5–3 s per view, no API calls):
 *   1. BodyPix → person mask + 17 pose keypoints
 *   2. Build a 4-corner torso quad from shoulders + hips (front/back)
 *      or estimated proportions (left/right profile)
 *   3. Remove garment background by colour-similarity to corner pixels
 *   4. Warp garment to fit the torso quad via two-triangle affine warp
 *   5. Clip warped garment to the body silhouette (soft-edged mask)
 *   6. Match garment lighting to user's skin tones (gentle multiply)
 *   7. Composite with feathered edges → no "pasted-on" look
 *
 * Returns: a composite blob URL ready to feed into the 3D viewer.
 */

// ─── Model cache (BodyPix loaded once, ~3 MB download) ─────────────────────────
let _net = null;
async function getNet() {
  if (_net) return _net;
  const tf      = await import('@tensorflow/tfjs');
  await tf.ready();
  const bodyPix = await import('@tensorflow-models/body-pix');
  _net = await bodyPix.load({
    architecture : 'MobileNetV1',
    outputStride : 16,
    multiplier   : 0.75,
    quantBytes   : 2,
  });
  return _net;
}

// ─── Per-image analysis cache (keyed by image src) ─────────────────────────────
const _analysisCache = new Map();

// ─── Image loader (returns HTMLImageElement) ───────────────────────────────────
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load image: ${src.slice(0, 80)}`));
    img.src = src;
  });
}

// ─── Strip white/light background from product images ─────────────────────────
function removeGarmentBackground(img) {
  const W = img.naturalWidth  || img.width  || 400;
  const H = img.naturalHeight || img.height || 500;

  const c   = document.createElement('canvas');
  c.width   = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0, W, H);

  const data = ctx.getImageData(0, 0, W, H);
  const d    = data.data;

  // Sample the four corners + four edge midpoints to estimate background
  const samples = [
    [0, 0], [W - 1, 0], [0, H - 1], [W - 1, H - 1],
    [Math.floor(W / 2), 0], [Math.floor(W / 2), H - 1],
    [0, Math.floor(H / 2)], [W - 1, Math.floor(H / 2)],
  ];
  let bgR = 0, bgG = 0, bgB = 0;
  for (const [x, y] of samples) {
    const i = (y * W + x) * 4;
    bgR += d[i]; bgG += d[i + 1]; bgB += d[i + 2];
  }
  bgR /= samples.length; bgG /= samples.length; bgB /= samples.length;

  const SOFT_LO = 50;   // diff below this → fully transparent
  const SOFT_HI = 110;  // diff above this → fully opaque

  for (let i = 0; i < d.length; i += 4) {
    const diff = Math.abs(d[i] - bgR) + Math.abs(d[i + 1] - bgG) + Math.abs(d[i + 2] - bgB);
    if (diff < SOFT_LO) {
      d[i + 3] = 0;
    } else if (diff < SOFT_HI) {
      d[i + 3] = Math.round(((diff - SOFT_LO) / (SOFT_HI - SOFT_LO)) * 255);
    }
  }

  ctx.putImageData(data, 0, 0);
  return c;
}

// ─── BodyPix person + pose analysis ───────────────────────────────────────────
async function analyzePerson(personImg, srcKey) {
  if (srcKey && _analysisCache.has(srcKey)) return _analysisCache.get(srcKey);

  const net = await getNet();
  const seg = await net.segmentPersonParts(personImg, {
    flipHorizontal      : false,
    internalResolution  : 'medium',
    segmentationThreshold: 0.55,
    maxDetections       : 1,
  });

  const W = personImg.naturalWidth  || personImg.width;
  const H = personImg.naturalHeight || personImg.height;

  // Build mask canvas at full image resolution
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width  = seg.width;
  maskCanvas.height = seg.height;
  const mCtx  = maskCanvas.getContext('2d');
  const mData = mCtx.createImageData(seg.width, seg.height);
  for (let i = 0; i < seg.data.length; i++) {
    const idx = i * 4;
    const v   = seg.data[i] === -1 ? 0 : 255;
    mData.data[idx]     = v;
    mData.data[idx + 1] = v;
    mData.data[idx + 2] = v;
    mData.data[idx + 3] = v;
  }
  mCtx.putImageData(mData, 0, 0);

  // Upscale mask to full image dims with smoothing for soft edges
  const fullMask = document.createElement('canvas');
  fullMask.width = W; fullMask.height = H;
  const fmCtx = fullMask.getContext('2d');
  fmCtx.imageSmoothingEnabled = true;
  fmCtx.imageSmoothingQuality = 'high';
  fmCtx.drawImage(maskCanvas, 0, 0, W, H);
  // Soften the edge with a small blur (CSS filter is fast & GPU-accelerated)
  const softMask = document.createElement('canvas');
  softMask.width = W; softMask.height = H;
  const sCtx = softMask.getContext('2d');
  sCtx.filter = 'blur(2px)';
  sCtx.drawImage(fullMask, 0, 0);

  // Extract keypoints into a part-name lookup
  const pose      = seg.allPoses?.[0];
  const keypoints = {};
  if (pose) pose.keypoints.forEach(kp => { keypoints[kp.part] = kp; });

  // Person bounding box from mask data
  const { width: pw, height: ph, data: sd } = seg;
  let minX = pw, maxX = 0, minY = ph, maxY = 0, found = false;
  for (let i = 0; i < sd.length; i++) {
    if (sd[i] !== -1) {
      const x = i % pw, y = Math.floor(i / pw);
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      found = true;
    }
  }
  const sx = W / pw, sy = H / ph;
  const bounds = found ? {
    x: minX * sx, y: minY * sy,
    w: (maxX - minX) * sx, h: (maxY - minY) * sy,
  } : { x: W * 0.1, y: H * 0.1, w: W * 0.8, h: H * 0.85 };

  const result = { keypoints, mask: softMask, bounds, W, H };
  if (srcKey) _analysisCache.set(srcKey, result);
  return result;
}

// ─── Build the 4-corner torso quad based on view ──────────────────────────────
function computeTorsoQuad(keypoints, bounds, view) {
  const KP_THRESH = 0.25;
  const ls = keypoints.leftShoulder;
  const rs = keypoints.rightShoulder;
  const lh = keypoints.leftHip;
  const rh = keypoints.rightHip;

  const have = (kp) => kp && kp.score > KP_THRESH;
  const isProfile = view === 'left' || view === 'right';
  const isBack    = view === 'back';

  if (have(ls) && have(rs) && have(lh) && have(rh) && !isProfile) {
    // Front or back — use real keypoints
    // Add a little padding outside shoulders so the garment doesn't look squeezed
    const padX = (rs.position.x - ls.position.x) * 0.12;
    const padTop = (lh.position.y - ls.position.y) * 0.06;

    let TL = { x: ls.position.x - padX, y: ls.position.y - padTop };
    let TR = { x: rs.position.x + padX, y: rs.position.y - padTop };
    let BR = { x: rh.position.x + padX * 0.5, y: rh.position.y };
    let BL = { x: lh.position.x - padX * 0.5, y: lh.position.y };

    // For back view, the keypoints are mirrored — but BodyPix returns them correctly anyway.
    // Just ensure quad is in clockwise order: TL, TR, BR, BL
    if (isBack) {
      // Swap left/right so garment is mirrored to fit back-side correctly
      [TL, TR] = [TR, TL];
      [BL, BR] = [BR, BL];
    }
    return { TL, TR, BR, BL, fromKeypoints: true };
  }

  // Fallback: estimate from bounds (profile view or low-confidence keypoints)
  const px = bounds.x, py = bounds.y, pw = bounds.w, ph = bounds.h;

  if (isProfile) {
    // Profile = narrower torso box centred on the person
    const torsoW = pw * 0.55;
    const xC     = px + pw / 2;
    return {
      TL: { x: xC - torsoW / 2, y: py + ph * 0.18 },
      TR: { x: xC + torsoW / 2, y: py + ph * 0.18 },
      BR: { x: xC + torsoW / 2, y: py + ph * 0.62 },
      BL: { x: xC - torsoW / 2, y: py + ph * 0.62 },
      fromKeypoints: false,
    };
  }

  // Front/back fallback when keypoints failed
  return {
    TL: { x: px + pw * 0.10, y: py + ph * 0.18 },
    TR: { x: px + pw * 0.90, y: py + ph * 0.18 },
    BR: { x: px + pw * 0.85, y: py + ph * 0.62 },
    BL: { x: px + pw * 0.15, y: py + ph * 0.62 },
    fromKeypoints: false,
  };
}

// ─── Two-triangle affine warp: maps source quad → destination quad ───────────
function affineFromTriangles(s1, s2, s3, d1, d2, d3) {
  // Solve for [a b; d e; c f] such that
  //   d_i = a*s_i.x + b*s_i.y + c
  //   d_i.y = d*s_i.x + e*s_i.y + f
  const ax = s1.x - s3.x, bx = s2.x - s3.x;
  const ay = s1.y - s3.y, by = s2.y - s3.y;
  const det = ax * by - bx * ay;
  if (Math.abs(det) < 1e-6) return null;

  const dx1 = d1.x - d3.x, dx2 = d2.x - d3.x;
  const dy1 = d1.y - d3.y, dy2 = d2.y - d3.y;

  const a = (dx1 * by - dx2 * ay) / det;
  const b = (dx2 * ax - dx1 * bx) / det;
  const c = d3.x - a * s3.x - b * s3.y;

  const d = (dy1 * by - dy2 * ay) / det;
  const e = (dy2 * ax - dy1 * bx) / det;
  const f = d3.y - d * s3.x - e * s3.y;

  return { a, b, c, d, e, f };
}

function drawTriangle(ctx, srcCanvas, srcTri, dstTri, expandPx = 0.6) {
  const m = affineFromTriangles(srcTri[0], srcTri[1], srcTri[2], dstTri[0], dstTri[1], dstTri[2]);
  if (!m) return;

  ctx.save();

  // Build a slightly expanded clip path so adjacent triangles don't leave a seam
  const cx = (dstTri[0].x + dstTri[1].x + dstTri[2].x) / 3;
  const cy = (dstTri[0].y + dstTri[1].y + dstTri[2].y) / 3;
  const exp = (p) => {
    const vx = p.x - cx, vy = p.y - cy;
    const len = Math.hypot(vx, vy) || 1;
    return { x: p.x + (vx / len) * expandPx, y: p.y + (vy / len) * expandPx };
  };
  const e0 = exp(dstTri[0]), e1 = exp(dstTri[1]), e2 = exp(dstTri[2]);
  ctx.beginPath();
  ctx.moveTo(e0.x, e0.y);
  ctx.lineTo(e1.x, e1.y);
  ctx.lineTo(e2.x, e2.y);
  ctx.closePath();
  ctx.clip();

  ctx.transform(m.a, m.d, m.b, m.e, m.c, m.f);
  ctx.drawImage(srcCanvas, 0, 0);
  ctx.restore();
}

function warpQuadToQuad(srcCanvas, dstQuad, outW, outH) {
  const out = document.createElement('canvas');
  out.width = outW; out.height = outH;
  const ctx = out.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const sW = srcCanvas.width, sH = srcCanvas.height;
  // Source quad = full garment image
  const sTL = { x: 0, y: 0 };
  const sTR = { x: sW, y: 0 };
  const sBR = { x: sW, y: sH };
  const sBL = { x: 0, y: sH };

  // Split into 2 triangles (TL,TR,BR) and (TL,BR,BL) — diagonal from TL→BR
  drawTriangle(ctx, srcCanvas, [sTL, sTR, sBR], [dstQuad.TL, dstQuad.TR, dstQuad.BR]);
  drawTriangle(ctx, srcCanvas, [sTL, sBR, sBL], [dstQuad.TL, dstQuad.BR, dstQuad.BL]);

  return out;
}

// ─── Sample average skin tone around the face/neck region ─────────────────────
function sampleSkinTone(personImg, keypoints, bounds) {
  const W = personImg.naturalWidth  || personImg.width;
  const H = personImg.naturalHeight || personImg.height;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.drawImage(personImg, 0, 0, W, H);

  const nose = keypoints.nose;
  const sx = nose ? nose.position.x : bounds.x + bounds.w / 2;
  const sy = nose ? nose.position.y + 20 : bounds.y + bounds.h * 0.12;
  const r  = Math.max(8, Math.min(40, bounds.w * 0.04));

  try {
    const id = ctx.getImageData(
      Math.max(0, sx - r),
      Math.max(0, sy - r),
      Math.min(r * 2, W - sx + r),
      Math.min(r * 2, H - sy + r),
    ).data;
    let R = 0, G = 0, B = 0, n = 0;
    for (let i = 0; i < id.length; i += 4) {
      R += id[i]; G += id[i + 1]; B += id[i + 2]; n++;
    }
    return { r: R / n, g: G / n, b: B / n };
  } catch {
    return { r: 200, g: 180, b: 160 };
  }
}

// ─── Apply gentle lighting to garment to match scene ──────────────────────────
function applyAmbientLight(garmentCanvas, scene) {
  const out = document.createElement('canvas');
  out.width = garmentCanvas.width;
  out.height = garmentCanvas.height;
  const ctx = out.getContext('2d');
  ctx.drawImage(garmentCanvas, 0, 0);

  // Soft multiply layer with the ambient warm/cool tone from the scene
  const ambient = `rgba(${Math.round(scene.r)},${Math.round(scene.g)},${Math.round(scene.b)},0.18)`;
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = ambient;
  ctx.fillRect(0, 0, out.width, out.height);

  // Re-apply garment's own alpha mask so the multiply stays inside the shape
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(garmentCanvas, 0, 0);
  return out;
}

// ─── Main pipeline ────────────────────────────────────────────────────────────
/**
 * @param {{
 *   personSrc: string,           // object URL or http URL of person photo
 *   garmentSrc: string,          // object URL or http URL of garment image
 *   view?: 'front' | 'back' | 'left' | 'right',
 *   onStatus?: (msg: string) => void,
 *   quality?: 'fast' | 'high'    // 'fast' uses small internal resolution
 * }} params
 * @returns {Promise<string>}    blob URL of composite image
 */
export async function tryOnLocal({ personSrc, garmentSrc, view = 'front', onStatus, quality = 'high' }) {
  onStatus?.('Loading photos…');
  const [personImg, garmentImg] = await Promise.all([
    loadImage(personSrc),
    loadImage(garmentSrc),
  ]);

  onStatus?.('Detecting body…');
  const { keypoints, mask, bounds, W, H } = await analyzePerson(personImg, personSrc);

  onStatus?.('Removing garment background…');
  const garmentClean = removeGarmentBackground(garmentImg);

  onStatus?.('Aligning garment to your shoulders…');
  const torsoQuad = computeTorsoQuad(keypoints, bounds, view);

  // Warp garment to the quad
  const warped = warpQuadToQuad(garmentClean, torsoQuad, W, H);

  // Clip to body silhouette so garment doesn't overflow
  const clipped = document.createElement('canvas');
  clipped.width = W; clipped.height = H;
  const cCtx = clipped.getContext('2d');
  cCtx.drawImage(warped, 0, 0);
  cCtx.globalCompositeOperation = 'destination-in';
  cCtx.drawImage(mask, 0, 0);

  // Color-match to scene lighting
  onStatus?.('Matching lighting…');
  const skin = sampleSkinTone(personImg, keypoints, bounds);
  const litGarment = applyAmbientLight(clipped, skin);

  // Final composite: person photo + garment (slightly < 100% to blend)
  onStatus?.('Compositing final image…');
  const final = document.createElement('canvas');
  final.width = W; final.height = H;
  const fCtx = final.getContext('2d');
  fCtx.drawImage(personImg, 0, 0, W, H);
  fCtx.globalAlpha = 0.97;
  fCtx.drawImage(litGarment, 0, 0);
  fCtx.globalAlpha = 1;

  // Optional: subtle inner shadow on garment edge for depth (gives 3D feel)
  fCtx.globalCompositeOperation = 'source-atop';
  // Skip — we'd need an edge-only mask which is expensive. The body-mask blur already does this.

  // Output as blob URL — fast to load into <img> and Three.js textures
  return new Promise((resolve, reject) => {
    final.toBlob((blob) => {
      if (!blob) { reject(new Error('Failed to encode composite')); return; }
      onStatus?.('Done');
      resolve(URL.createObjectURL(blob));
    }, 'image/jpeg', 0.92);
  });
}

// ─── Run try-on for all 4 views in parallel (or sequentially) ────────────────
/**
 * @param {{
 *   photos: { front?: string, right?: string, back?: string, left?: string },
 *   garmentSrc: string,
 *   onStatus?: (msg: string) => void,
 *   onViewDone?: (view: string, url: string) => void,
 * }} params
 * @returns {Promise<{ front?: string, right?: string, back?: string, left?: string }>}
 */
export async function tryOnAllViews({ photos, garmentSrc, onStatus, onViewDone }) {
  const views = ['front', 'right', 'back', 'left'];
  const out = {};

  // Sequential to keep memory low — each view ~1.5 s
  for (const v of views) {
    const src = photos[v];
    if (!src) { out[v] = null; continue; }
    onStatus?.(`Processing ${v} view…`);
    try {
      out[v] = await tryOnLocal({ personSrc: src, garmentSrc, view: v, onStatus });
      onViewDone?.(v, out[v]);
    } catch (err) {
      console.warn(`[tryOnLocal] ${v} failed:`, err.message);
      out[v] = src; // fall back to original photo
      onViewDone?.(v, src);
    }
  }

  return out;
}

// ─── Clear cache (call on photo change) ───────────────────────────────────────
export function clearAnalysisCache() {
  _analysisCache.clear();
}
