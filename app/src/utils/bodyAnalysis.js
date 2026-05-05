/**
 * bodyAnalysis.js  —  Body Measurement Extraction
 *
 * Uses @tensorflow-models/body-pix (already installed, ESM-safe in Vite)
 * instead of @mediapipe/pose, which breaks under esbuild's CJS→ESM conversion.
 *
 * BodyPix runs PoseNet internally and returns 17 COCO keypoints + segmentation.
 * All we need are the keypoints to derive body measurements.
 *
 * Pipeline:
 *   imgSrc  →  BodyPix segmentPersonParts  →  17 keypoints
 *           →  extractMeasurements          →  3D avatar scales
 */

// ─── COCO 17-point keypoint names (BodyPix / PoseNet) ────────────────────────
// Returned as kp.part strings — no numeric indices needed.
const REQ_KEYPOINTS = ['leftShoulder', 'rightShoulder', 'leftHip', 'rightHip'];

// ─── Cached model ─────────────────────────────────────────────────────────────
let _net = null;

async function getNet() {
  if (_net) return _net;

  // Ensure TF.js WebGL backend is ready before loading BodyPix
  const tf      = await import('@tensorflow/tfjs');
  const bodyPix = await import('@tensorflow-models/body-pix');

  await tf.ready();

  _net = await bodyPix.load({
    architecture:  'MobileNetV1',
    outputStride:  16,
    multiplier:    0.75,   // speed / accuracy trade-off
    quantBytes:    2,      // smaller model download
  });
  return _net;
}

// ─── Geometry helpers ─────────────────────────────────────────────────────────
// BodyPix keypoints use  { part, position: {x,y}, score }
// (pixel coordinates, NOT normalised)
const px = kp => kp.position;
const d  = (a, b) => Math.hypot(px(a).x - px(b).x, px(a).y - px(b).y);
const mp = (a, b) => ({ position: { x: (px(a).x + px(b).x) / 2, y: (px(a).y + px(b).y) / 2 }, score: Math.min(a.score, b.score), part: 'mid' });

// ─── Measurement extraction ───────────────────────────────────────────────────
function extractMeasurements(keypoints, imgW, imgH) {
  // Build lookup by part name
  const lm = {};
  keypoints.forEach(kp => { lm[kp.part] = kp; });

  // Require core keypoints
  for (const name of REQ_KEYPOINTS) {
    if (!lm[name] || lm[name].score < 0.15) {
      throw new Error(
        `Could not detect your ${name.replace(/([A-Z])/g, ' $1').toLowerCase()}. ` +
        'Please upload a clear, well-lit full-body photo.'
      );
    }
  }

  const LS = lm.leftShoulder,  RS = lm.rightShoulder;
  const LH = lm.leftHip,       RH = lm.rightHip;
  const LK = lm.leftKnee,      RK = lm.rightKnee;
  const LA = lm.leftAnkle,     RA = lm.rightAnkle;
  const LE = lm.leftElbow,     RE = lm.rightElbow;
  const LW = lm.leftWrist,     RW = lm.rightWrist;
  const NOSE = lm.nose;

  // Raw pixel distances
  const shoulderRaw  = d(LS, RS);
  const hipRaw       = d(LH, RH);
  const torsoRaw     = d(mp(LS, RS), mp(LH, RH));
  const upperArmRaw  = (LE && RE)         ? (d(LS, LE) + d(RS, RE)) / 2 : shoulderRaw * 0.55;
  const forearmRaw   = (LE && LW && RE && RW) ? (d(LE, LW) + d(RE, RW)) / 2 : shoulderRaw * 0.50;
  const upperLegRaw  = (LK && RK)         ? (d(LH, LK) + d(RH, RK)) / 2 : torsoRaw * 0.78;
  const lowerLegRaw  = (LK && LA && RK && RA) ? (d(LK, LA) + d(RK, RA)) / 2 : torsoRaw * 0.74;

  // Body height in pixel space — nose to ankle midpoint
  const ankleM = (LA && RA) ? mp(LA, RA) : null;
  const bodyH  = (NOSE && ankleM) ? d(NOSE, ankleM) : torsoRaw * 3.1;

  // Normalise everything against body height (scale-invariant ratios)
  const norm = v => v / Math.max(bodyH, 1);
  const nShoulder = norm(shoulderRaw);
  const nHip      = norm(hipRaw);
  const nTorso    = norm(torsoRaw);
  const nUpperArm = norm(upperArmRaw);
  const nForearm  = norm(forearmRaw);
  const nUpperLeg = norm(upperLegRaw);
  const nLowerLeg = norm(lowerLegRaw);
  const nWaist    = nShoulder * 0.64 + nHip * 0.36;

  // ── Size recommendation ───────────────────────────────────────────────────
  // Typical normalised shoulder widths in a full-body photo: 0.22 – 0.38
  let recommendedSize;
  if      (nShoulder < 0.24) recommendedSize = 'XS';
  else if (nShoulder < 0.28) recommendedSize = 'S';
  else if (nShoulder < 0.32) recommendedSize = 'M';
  else if (nShoulder < 0.36) recommendedSize = 'L';
  else if (nShoulder < 0.40) recommendedSize = 'XL';
  else                        recommendedSize = 'XXL';

  // ── Body shape ────────────────────────────────────────────────────────────
  const shRatio = nShoulder / Math.max(nHip, 0.001);
  const bodyType = shRatio > 1.12 ? 'Athletic' : shRatio < 0.90 ? 'Pear' : 'Rectangle';

  // ── Avatar deformation scales (1.0 = average body) ───────────────────────
  // Baseline averages from ANSUR-II normalised anthropometric data:
  const AVG = { shoulder: 0.31, hip: 0.29, arm: 0.35, leg: 0.54 };

  const H_CM = 170; // height baseline for cm estimates
  return {
    // Normalised ratios
    shoulderWidth:  nShoulder,
    hipWidth:       nHip,
    waistWidth:     nWaist,
    torsoLength:    nTorso,
    upperArmLength: nUpperArm,
    forearmLength:  nForearm,
    upperLegLength: nUpperLeg,
    lowerLegLength: nLowerLeg,
    // 3D avatar scales
    shoulderScale: nShoulder / AVG.shoulder,
    hipScale:      nHip      / AVG.hip,
    armScale:      (nUpperArm + nForearm)  / AVG.arm,
    legScale:      (nUpperLeg + nLowerLeg) / AVG.leg,
    // Classification
    recommendedSize,
    bodyType,
    shoulderHipRatio: shRatio,
    // Estimated cm values (displayed in UI)
    estShoulderCm: Math.round(nShoulder * H_CM),
    estHipCm:      Math.round(nHip      * H_CM),
    estWaistCm:    Math.round(nWaist    * H_CM),
    estChestCm:    Math.round(nShoulder * H_CM * 0.88),
    estHeightCm:   H_CM,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Analyse a full-body photo and return keypoints + body measurements.
 * @param  {string} imgSrc  — object URL or data URL from file upload
 * @returns {Promise<{ landmarks: Keypoint[], measurements: Object }>}
 */
export async function analyzeBodyFromImage(imgSrc) {
  return new Promise(async (resolve, reject) => {
    let done = false;
    const finish = (val, err) => {
      if (done) return;
      done = true;
      err ? reject(err) : resolve(val);
    };

    // Hard timeout
    setTimeout(() => finish(null, new Error(
      'Body analysis timed out. Please try with a clearer, well-lit photo.'
    )), 90_000);

    try {
      // 1. Load image into an HTMLImageElement so TF.js can read pixels
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((res, rej) => {
        img.onload  = res;
        img.onerror = () => rej(new Error('Failed to load the uploaded image.'));
        img.src = imgSrc;
      });

      // 2. Load BodyPix model (cached after first call — ~3 MB download once)
      const net = await getNet();

      // 3. Run person segmentation — also returns pose keypoints via PoseNet
      const seg = await net.segmentPersonParts(img, {
        flipHorizontal:       false,
        internalResolution:   'medium',  // balance of speed and accuracy
        segmentationThreshold: 0.55,
        maxDetections:         1,
      });

      if (!seg.allPoses?.length) {
        finish(null, new Error(
          'No person detected in the photo. ' +
          'Please upload a clear, full-body photo with your entire body visible.'
        ));
        return;
      }

      const pose         = seg.allPoses[0];
      const measurements = extractMeasurements(pose.keypoints, img.naturalWidth, img.naturalHeight);

      finish({ landmarks: pose.keypoints, measurements });

    } catch (err) {
      finish(null, err);
    }
  });
}

/**
 * Sensible default measurements used when the user skips body analysis.
 */
export function defaultMeasurements() {
  return {
    shoulderWidth: 0.31, hipWidth: 0.29, waistWidth: 0.27, torsoLength: 0.30,
    upperArmLength: 0.18, forearmLength: 0.17,
    upperLegLength: 0.28, lowerLegLength: 0.26,
    shoulderScale: 1.0, hipScale: 1.0, armScale: 1.0, legScale: 1.0,
    recommendedSize: 'M', bodyType: 'Rectangle', shoulderHipRatio: 1.07,
    estShoulderCm: 44, estHipCm: 94, estWaistCm: 74,
    estChestCm: 90, estHeightCm: 170,
  };
}

/**
 * Score how well a garment size fits the detected body (0 – 100).
 */
export function calcFitScore(measurements, _garmentSizes = [], selectedSize) {
  const ORDER    = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const bodyIdx  = ORDER.indexOf(measurements.recommendedSize);
  const pickIdx  = ORDER.indexOf(selectedSize || measurements.recommendedSize);
  const diff     = Math.abs(bodyIdx - pickIdx);
  if (diff === 0) return { score: 96, label: 'Perfect Fit', color: '#00c864' };
  if (diff === 1) return { score: 78, label: 'Good Fit',    color: '#7ec8e3' };
  if (diff === 2) return { score: 54, label: 'Loose Fit',   color: '#f5a623' };
  return             { score: 30, label: 'Wrong Size',  color: '#ff4646' };
}
