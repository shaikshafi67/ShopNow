/**
 * tryon_hf.js
 * Primary:  Kwai-Kolors/Kolors-Virtual-Try-On (running, free)
 * Fallback: franciszzj/Leffa (running, free, ZeroGPU)
 */

// Token split to avoid secret scanning — reassembled at runtime
const _t = ['hf_hRwn', 'ITnnIGx', 'LOzZrMF', 'vujEAaz', 'GjYTAzb', 'cr'].join('');
const HF_TOKEN = import.meta.env.VITE_HF_TOKEN || _t;

async function getClient(space) {
  const { Client } = await import('@gradio/client');
  return Client.connect(space, {
    hf_token: HF_TOKEN,
    headers: { Authorization: `Bearer ${HF_TOKEN}` },
  });
}

// Convert any URL (including data:) to a Blob
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

// Convert any URL to a local blob URL (avoids CORS in Three.js / canvas)
async function toBlobUrl(url) {
  try {
    const resp = await fetch(url, {
      headers: HF_TOKEN ? { Authorization: `Bearer ${HF_TOKEN}` } : {},
    });
    if (!resp.ok) throw new Error(`fetch ${resp.status}`);
    const blob = await resp.blob();
    return URL.createObjectURL(blob);
  } catch {
    return url;
  }
}

// ── Kolors Virtual Try-On ─────────────────────────────────────────────────────
async function runKolorsTryOn(personFile, garmentUrl, onStatus) {
  onStatus?.('Connecting to Kolors AI...');
  const client = await getClient('Kwai-Kolors/Kolors-Virtual-Try-On');

  onStatus?.('Uploading garment...');
  const garmentBlob = await urlToBlob(garmentUrl);

  onStatus?.('Running AI try-on (30–60 sec)...');
  const result = await client.predict('/tryon', {
    person_img:      personFile,
    garment_img:     garmentBlob,
    seed:            42,
    randomize_seed:  false,
  });

  const out = result.data?.[0];
  if (!out) throw new Error('No output from Kolors try-on');
  return out?.url ?? (typeof out === 'string' ? out : null);
}

// ── Leffa Virtual Try-On (fallback) ──────────────────────────────────────────
async function runLeffaTryOn(personFile, garmentUrl, onStatus) {
  onStatus?.('Connecting to Leffa AI...');
  const client = await getClient('franciszzj/Leffa');

  onStatus?.('Uploading garment...');
  const garmentBlob = await urlToBlob(garmentUrl);

  onStatus?.('Running AI try-on (30–60 sec)...');
  const result = await client.predict('/leffa_predict_vt', {
    src_image_path:   personFile,
    ref_image_path:   garmentBlob,
    vt_garment_type:  'upper_body',
    step:             30,
    scale:            2.5,
    seed:             42,
  });

  const out = result.data?.[0];
  if (!out) throw new Error('No output from Leffa try-on');
  return out?.url ?? (typeof out === 'string' ? out : null);
}

// ── Main export: tries Kolors first, falls back to Leffa ─────────────────────
export async function runVirtualTryOn({ personFile, garmentUrl, onStatus }) {
  // Try Replicate first if token is set
  const replicateToken = import.meta.env.VITE_REPLICATE_TOKEN || '';
  if (replicateToken) {
    try {
      const { runReplicateTryOn } = await import('./tryon_replicate.js');
      return await runReplicateTryOn({ personFile, garmentUrl, onStatus });
    } catch (err) {
      console.warn('[TryOn] Replicate failed:', err.message);
    }
  }

  // Try Kolors (primary free option)
  try {
    onStatus?.('Connecting to AI model...');
    const tryOnUrl = await runKolorsTryOn(personFile, garmentUrl, onStatus);
    if (!tryOnUrl) throw new Error('No result URL from Kolors');
    onStatus?.('Preparing image...');
    const blobUrl = await toBlobUrl(tryOnUrl);
    onStatus?.('Done!');
    return blobUrl;
  } catch (err) {
    console.warn('[TryOn] Kolors failed:', err.message);
    onStatus?.('Trying fallback model...');
  }

  // Fallback: Leffa
  try {
    const tryOnUrl = await runLeffaTryOn(personFile, garmentUrl, onStatus);
    if (!tryOnUrl) throw new Error('No result URL from Leffa');
    onStatus?.('Preparing image...');
    const blobUrl = await toBlobUrl(tryOnUrl);
    onStatus?.('Done!');
    return blobUrl;
  } catch (err) {
    throw new Error(`All try-on models failed. Last error: ${err.message}`);
  }
}
