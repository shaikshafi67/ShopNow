/**
 * tryon_replicate.js  —  Virtual Try-On via Replicate (IDM-VTON)
 *
 * Replicate hosts IDM-VTON — same model as HuggingFace but more reliable.
 * Free tier: ~$0.00115 per run, new accounts get $5 free credit (~4000 try-ons).
 *
 * Setup:
 *  1. Sign up free at https://replicate.com
 *  2. Go to https://replicate.com/account/api-tokens
 *  3. Create token → copy it
 *  4. Add to .env:  VITE_REPLICATE_TOKEN=r8_xxxxxxxxxxxx
 */

const REPLICATE_TOKEN = import.meta.env.VITE_REPLICATE_TOKEN || '';
// Use Vite proxy (/replicate → https://api.replicate.com/v1) to avoid CORS
const API = '/replicate';

async function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

async function urlToBase64(url) {
  const abs  = url.startsWith('http') ? url : `${location.origin}${url}`;
  const blob = await fetch(abs).then(r => r.blob());
  return fileToBase64(blob);
}

export async function runReplicateTryOn({ personFile, garmentUrl, onStatus }) {
  if (!REPLICATE_TOKEN) {
    throw new Error(
      'Replicate token not set. Add VITE_REPLICATE_TOKEN=r8_xxx to your .env file.\n' +
      'Free signup at https://replicate.com → Account → API Tokens'
    );
  }

  onStatus?.('Preparing images for Replicate…');

  const [humanB64, garmentB64] = await Promise.all([
    fileToBase64(personFile),
    urlToBase64(garmentUrl),
  ]);

  onStatus?.('Submitting to Replicate IDM-VTON…');

  // ── Create prediction ─────────────────────────────────────────────────────
  const createResp = await fetch(`${API}/models/yisol/idm-vton/predictions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${REPLICATE_TOKEN}`,
      'Content-Type': 'application/json',
      'Prefer': 'wait=30',
    },
    body: JSON.stringify({
      input: {
        human_img:     humanB64,
        garm_img:      garmentB64,
        garment_des:   'clothing',
        is_checked:    true,
        is_checked_crop: true,
        denoise_steps: 30,
        seed:          42,
      },
    }),
  });

  if (!createResp.ok) {
    const err = await createResp.json().catch(() => ({}));
    throw new Error(`Replicate error: ${err.detail || createResp.statusText}`);
  }

  let prediction = await createResp.json();
  if (prediction.error) throw new Error(`Replicate: ${prediction.error}`);

  onStatus?.('AI generating try-on (20–40 sec)…');

  // ── Poll until done ───────────────────────────────────────────────────────
  const MAX = 60;
  for (let i = 0; prediction.status !== 'succeeded' && i < MAX; i++) {
    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      throw new Error(`Replicate prediction ${prediction.status}: ${prediction.error || ''}`);
    }
    await new Promise(r => setTimeout(r, 2500));

    const pollResp = await fetch(`${API}/predictions/${prediction.id}`, {
      headers: { 'Authorization': `Bearer ${REPLICATE_TOKEN}` },
    });
    prediction = await pollResp.json();
    onStatus?.(`AI generating… (${(i + 1) * 2.5 | 0}s)`);
  }

  if (prediction.status !== 'succeeded') throw new Error('Replicate timed out. Try again.');

  const output = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
  if (!output) throw new Error('Replicate returned no output image.');

  onStatus?.('Done!');
  return output;
}
