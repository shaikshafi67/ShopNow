/**
 * tryon_fashn.js  —  Fashn.ai Virtual Try-On Integration
 *
 * Fashn.ai is the closest public equivalent to Google's Virtual Try-On.
 * It uses a proprietary diffusion model trained on fashion data.
 *
 * Pricing: ~$0.05 per image (pay-as-you-go, no subscription needed)
 * Sign up: https://fashn.ai  →  Dashboard  →  API Keys
 *
 * API flow:
 *   1. POST /v1/run  — submit person + garment images → get prediction_id
 *   2. GET  /v1/status/{id} — poll until status = "completed"
 *   3. Return output image URL
 */

// Use Vite proxy (/fashn → https://api.fashn.ai/v1) to avoid CORS
const BASE = '/fashn';

// Set VITE_FASHN_API_KEY in your .env file
const FASHN_KEY = import.meta.env.VITE_FASHN_API_KEY || '';

// ─── Category mapper ──────────────────────────────────────────────────────────
function getFashnCategory(product) {
  if (!product) return 'tops';
  const t = ((product.category || '') + ' ' + (product.name || '')).toLowerCase();
  if (t.includes('pant') || t.includes('jean'))   return 'bottoms';
  if (t.includes('dress') || t.includes('saree') || t.includes('kurti')) return 'one-pieces';
  return 'tops'; // shirt, tshirt, top, etc.
}

// ─── Convert File/blob to base64 data URL ────────────────────────────────────
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result); // "data:image/jpeg;base64,..."
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Fetch image URL → base64 (for garment product images) ───────────────────
async function urlToBase64(url) {
  // If relative URL, make it absolute using current origin
  const absUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
  const resp = await fetch(absUrl);
  const blob = await resp.blob();
  return fileToBase64(blob);
}

// ─── Main export ──────────────────────────────────────────────────────────────
/**
 * Run Google-quality virtual try-on via Fashn.ai.
 *
 * @param {object} opts
 * @param {File}   opts.personFile   — user's full-body photo (File object)
 * @param {string} opts.garmentUrl   — product image URL (relative or absolute)
 * @param {object} [opts.product]    — full product object (used for category)
 * @param {Function} [opts.onStatus] — progress callback (msg: string)
 * @returns {Promise<string>} — URL of the try-on result image
 */
export async function runFashnTryOn({ personFile, garmentUrl, product, onStatus }) {
  if (!FASHN_KEY) {
    throw new Error(
      'Fashn.ai API key not set. Add VITE_FASHN_API_KEY=your_key to your .env file. ' +
      'Get a free key at https://fashn.ai'
    );
  }

  onStatus?.('Preparing images…');

  // Convert both images to base64 (Fashn.ai accepts base64 or URLs)
  const [personB64, garmentB64] = await Promise.all([
    fileToBase64(personFile),
    urlToBase64(garmentUrl),
  ]);

  onStatus?.('Submitting to Fashn.ai…');

  // ── Step 1: Start the prediction ──────────────────────────────────────────
  const runResp = await fetch(`${BASE}/run`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${FASHN_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model_image:   personB64,
      garment_image: garmentB64,
      category:      getFashnCategory(product),
      // Optional quality settings:
      mode:          'balanced',   // "performance" | "balanced" | "quality"
      garment_photo_type: 'auto',  // "auto" | "flat-lay" | "model"
      nsfw_filter:   true,
    }),
  });

  if (!runResp.ok) {
    const err = await runResp.json().catch(() => ({}));
    throw new Error(`Fashn.ai error: ${err.message || runResp.statusText}`);
  }

  const { id: predictionId, error: startErr } = await runResp.json();
  if (startErr) throw new Error(`Fashn.ai: ${startErr}`);
  if (!predictionId) throw new Error('No prediction ID returned from Fashn.ai');

  onStatus?.('AI is generating your try-on (15–30 sec)…');

  // ── Step 2: Poll until done ───────────────────────────────────────────────
  const MAX_POLLS = 60;   // 60 × 2s = 2 minutes max wait
  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise(r => setTimeout(r, 2000));

    const statusResp = await fetch(`${BASE}/status/${predictionId}`, {
      headers: { 'Authorization': `Bearer ${FASHN_KEY}` },
    });

    if (!statusResp.ok) continue; // transient error — keep polling

    const data = await statusResp.json();

    if (data.status === 'completed') {
      const output = Array.isArray(data.output) ? data.output[0] : data.output;
      if (!output) throw new Error('Fashn.ai returned no output image');
      onStatus?.('Done!');
      return output; // URL to the generated image
    }

    if (data.status === 'failed') {
      throw new Error(`Fashn.ai generation failed: ${data.error || 'unknown reason'}`);
    }

    // status = "processing" or "starting" — update message
    const elapsed = (i + 1) * 2;
    onStatus?.(`AI generating… (${elapsed}s)`);
  }

  throw new Error('Fashn.ai timed out. Please try again.');
}

/**
 * Quick health check — returns true if the API key is valid.
 */
export async function checkFashnKey() {
  if (!FASHN_KEY) return false;
  try {
    const resp = await fetch(`${BASE}/account`, {
      headers: { 'Authorization': `Bearer ${FASHN_KEY}` },
    });
    return resp.ok;
  } catch {
    return false;
  }
}
