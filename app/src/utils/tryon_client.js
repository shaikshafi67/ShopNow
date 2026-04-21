/**
 * DRAPE3D — Frontend API client for the Virtual Try-On endpoint.
 *
 * Usage in TryOnPage.jsx:
 *   import { submitTryOn } from '../utils/tryon_client';
 *
 *   const result = await submitTryOn({
 *     front, back, left, right,   // File objects from <input type="file" />
 *     clothing,                   // File object (selected product image)
 *     meshFormat: 'glb',
 *     onProgress: (pct) => setProgress(pct),
 *   });
 *   // result.meshUrl → load into Three.js GLTFLoader
 */

const API_BASE = import.meta.env.VITE_API_BASE ?? '';  // '' = use Vite proxy

/**
 * @typedef {Object} TryOnResult
 * @property {string}  jobId
 * @property {string}  meshUrl       - relative path, e.g. /outputs/<id>/mesh.glb
 * @property {string}  meshFormat    - "glb" | "obj"
 * @property {number}  processingTimeSec
 * @property {Object|null} intermediates
 */

/**
 * Submit all images to the Python VTON pipeline.
 *
 * @param {{
 *   front: File,
 *   back: File,
 *   left: File,
 *   right: File,
 *   clothing: File,
 *   meshFormat?: 'glb' | 'obj',
 *   includeIntermediates?: boolean,
 *   onProgress?: (percent: number) => void,
 * }} params
 * @returns {Promise<TryOnResult>}
 */
export async function submitTryOn({
  front,
  back,
  left,
  right,
  clothing,
  meshFormat = 'glb',
  includeIntermediates = false,
  onProgress,
}) {
  const form = new FormData();
  form.append('front',    front,    front.name);
  form.append('back',     back,     back.name);
  form.append('left',     left,     left.name);
  form.append('right',    right,    right.name);
  form.append('clothing', clothing, clothing.name);
  form.append('mesh_format',          meshFormat);
  form.append('include_intermediates', String(includeIntermediates));

  // Use XMLHttpRequest so we can track upload progress
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/api/tryon`);

    // Upload progress (0–50% of the UX bar is upload)
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 50));
        }
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        if (onProgress) onProgress(100);
        resolve({
          jobId:              data.job_id,
          meshUrl:            data.mesh_url,
          meshFormat:         data.mesh_format,
          processingTimeSec:  data.processing_time_seconds,
          intermediates:      data.intermediates ?? null,
        });
      } else {
        const err = (() => {
          try { return JSON.parse(xhr.responseText); }
          catch { return { detail: xhr.statusText }; }
        })();
        reject(new Error(err.detail ?? `Server error ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error — is the API server running?'));
    xhr.send(form);
  });
}

/**
 * Load a GLB mesh into an existing Three.js scene via @react-three/drei's useGLTF.
 *
 * Example usage inside a React Three Fiber component:
 *
 *   import { useGLTF } from '@react-three/drei';
 *
 *   function Avatar({ meshUrl }) {
 *     const { scene } = useGLTF(meshUrl);
 *     return <primitive object={scene} />;
 *   }
 */

/**
 * Ping the health endpoint.
 * @returns {Promise<{status: string, cuda_available: boolean, cuda_device: string}>}
 */
export async function checkHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json();
}
