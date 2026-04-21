/**
 * tryon_hf.js
 * Step 1: IDM-VTON  — virtual try-on
 * Step 2: CodeFormer — face restore + background enhance + 2x upscale
 */

const HF_TOKEN = import.meta.env.VITE_HF_TOKEN || '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';

async function getClient(space) {
  const { Client } = await import('@gradio/client');
  return Client.connect(space, {
    hf_token: HF_TOKEN,
    headers: { Authorization: `Bearer ${HF_TOKEN}` },
  });
}

// ── Step 1: Virtual try-on ────────────────────────────────────────────────────
async function runTryOn(client, personFile, garmentUrl, onStatus) {
  onStatus?.('Uploading garment...');
  const garmentResp = await fetch(garmentUrl);
  const garmentBlob = await garmentResp.blob();

  onStatus?.('Running AI try-on (30–60 sec)...');
  const result = await client.predict('/tryon', {
    dict:            { background: personFile, layers: [], composite: null },
    garm_img:        garmentBlob,
    garment_des:     'clothing garment',
    is_checked:      true,
    is_checked_crop: true,
    denoise_steps:   40,
    seed:            42,
  });

  const out = result.data?.[0];
  if (!out) throw new Error('No output from try-on model');
  return out?.url ?? (typeof out === 'string' ? out : null);
}

// ── Step 2: Enhance with CodeFormer (upscale + face restore + bg enhance) ─────
async function runEnhance(imageUrl, onStatus) {
  onStatus?.('Enhancing image quality...');
  try {
    const client = await getClient('sczhou/CodeFormer');

    const result = await client.predict('/inference', {
      image:               { url: imageUrl, orig_name: 'tryon.png', meta: { _type: 'gradio.FileData' } },
      face_align:          true,
      background_enhance:  true,
      face_upsample:       true,
      upscale:             2,
      codeformer_fidelity: 0.7,   // 0 = max quality, 1 = max identity preservation
    });

    const out = result.data?.[0];
    return out?.url ?? imageUrl; // fallback to original if enhance fails
  } catch (err) {
    console.warn('[CodeFormer] enhance failed, using original:', err.message);
    return imageUrl;
  }
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function runVirtualTryOn({ personFile, garmentUrl, onStatus }) {
  onStatus?.('Connecting to AI model...');
  const tryOnClient = await getClient('yisol/IDM-VTON');

  // Step 1: Try-on
  const tryOnUrl = await runTryOn(tryOnClient, personFile, garmentUrl, onStatus);
  if (!tryOnUrl) throw new Error('Try-on produced no result URL');

  // Step 2: Enhance
  const finalUrl = await runEnhance(tryOnUrl, onStatus);

  onStatus?.('Done!');
  return finalUrl;
}
