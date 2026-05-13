/**
 * tryon_hf.js
 * Step 1: IDM-VTON  — virtual try-on (tries multiple spaces in order)
 * Step 2: CodeFormer — face restore + background enhance + 2x upscale
 */

const HF_TOKEN = import.meta.env.VITE_HF_TOKEN || '';

// Original yisol/IDM-VTON has a ZeroGPU config error — use working duplicates
const TRYON_SPACES = [
  'kadirnar/IDM-VTON',
  'pngwn/IDM-VTON',
  'jjlealse/IDM-VTON',
  'John6666/IDM-VTON',
];

async function getClient(space) {
  const { Client } = await import('@gradio/client');
  return Client.connect(space, {
    hf_token: HF_TOKEN,
    headers: { Authorization: `Bearer ${HF_TOKEN}` },
  });
}

// ── Convert any URL (including data:) to a Blob ───────────────────────────────
async function urlToBlob(url) {
  if (url.startsWith('data:')) {
    const [meta, b64] = url.split(',');
    const mime = meta.split(':')[1].split(';')[0];
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    return new Blob([bytes], { type: mime });
  }
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Garment fetch failed (${resp.status})`);
  return resp.blob();
}

// ── Step 1: Virtual try-on ────────────────────────────────────────────────────
async function runTryOn(client, personFile, garmentUrl, onStatus) {
  onStatus?.('Uploading garment...');
  const garmentBlob = await urlToBlob(garmentUrl);

  onStatus?.('Running AI try-on (30–60 sec)...');
  const result = await client.predict('/tryon', {
    dict: { background: personFile, layers: [], composite: null },
    garm_img: garmentBlob,
    garment_des: 'clothing garment',
    is_checked: true,
    is_checked_crop: true,
    denoise_steps: 40,
    seed: 42,
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
      image: { url: imageUrl, orig_name: 'tryon.png', meta: { _type: 'gradio.FileData' } },
      face_align: true,
      background_enhance: true,
      face_upsample: true,
      upscale: 2,
      codeformer_fidelity: 0.7,
    });

    const out = result.data?.[0];
    return out?.url ?? imageUrl;
  } catch (err) {
    console.warn('[CodeFormer] enhance failed, using original:', err.message);
    return imageUrl;
  }
}

// ── Convert any URL to a local blob URL (avoids CORS in Three.js / canvas) ───
async function toBlobUrl(url) {
  try {
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${HF_TOKEN}` },
    });
    if (!resp.ok) throw new Error(`fetch ${resp.status}`);
    const blob = await resp.blob();
    return URL.createObjectURL(blob);
  } catch {
    return url;
  }
}

// ── Unified export: tries Replicate first, falls back to HF spaces ───────────
export async function runVirtualTryOn({ personFile, garmentUrl, onStatus }) {
  let replicateError = null;

  // Try Replicate first — faster and more reliable
  try {
    const { runReplicateTryOn } = await import('./tryon_replicate.js');
    return await runReplicateTryOn({ personFile, garmentUrl, onStatus });
  } catch (err) {
    replicateError = err.message;
    console.warn('[TryOn] Replicate failed:', err.message);
    onStatus?.(`Replicate failed (${err.message}), trying HF…`);
  }

  // Fall back to HF community spaces
  try {
    return await runHFTryOn({ personFile, garmentUrl, onStatus });
  } catch (hfErr) {
    throw new Error(`Replicate: ${replicateError} | HF: ${hfErr.message}`);
  }
}

// ── HF spaces fallback chain ──────────────────────────────────────────────────
async function runHFTryOn({ personFile, garmentUrl, onStatus }) {
  let lastError;

  for (const space of TRYON_SPACES) {
    try {
      onStatus?.(`Connecting to AI model (${space})...`);
      console.log('[TryOn] Trying space:', space);
      const tryOnClient = await getClient(space);

      const tryOnUrl = await runTryOn(tryOnClient, personFile, garmentUrl, onStatus);
      if (!tryOnUrl) throw new Error('Try-on produced no result URL');

      const enhancedUrl = await runEnhance(tryOnUrl, onStatus);

      onStatus?.('Preparing image...');
      const blobUrl = await toBlobUrl(enhancedUrl);

      onStatus?.('Done!');
      console.log('[TryOn] Success with space:', space);
      return blobUrl;
    } catch (err) {
      console.warn(`[TryOn] Space ${space} failed:`, err.message);
      lastError = err;
    }
  }

  throw new Error(`All try-on spaces failed. Last error: ${lastError?.message}`);
}
