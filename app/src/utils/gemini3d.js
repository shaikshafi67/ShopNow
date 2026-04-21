/**
 * gemini3d.js
 * Uses Gemini image generation to produce multi-angle views from a 2D try-on result.
 * Then those 4 images are used as textures in a Three.js 3D viewer.
 */

const GEMINI_KEY   = import.meta.env.VITE_GEMINI_KEY || 'AIzaSyAeDCe0SPS66QiKybNupzRXFZ3IJpjEU2c';
const MODEL        = 'gemini-3.1-flash-image-preview';
const API_BASE     = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`;

const ANGLE_PROMPTS = {
  right: 'Generate a photorealistic image of the same person from the RIGHT SIDE (90 degrees). Keep the exact same clothing, lighting, and background. Only change the camera angle to show the right side profile.',
  back:  'Generate a photorealistic image of the same person from the BACK (180 degrees). Keep the exact same clothing, lighting, and background. Only change the camera angle to show the back view.',
  left:  'Generate a photorealistic image of the same person from the LEFT SIDE (90 degrees). Keep the exact same clothing, lighting, and background. Only change the camera angle to show the left side profile.',
};

/**
 * Convert an image URL to base64
 */
async function urlToBase64(url) {
  const resp = await fetch(url);
  const buf  = await resp.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return {
    data:     btoa(binary),
    mimeType: resp.headers.get('content-type') || 'image/jpeg',
  };
}

/**
 * Convert a File/Blob to base64
 */
async function fileToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload  = (e) => {
      const dataUrl = e.target.result;
      resolve({
        data:     dataUrl.split(',')[1],
        mimeType: file.type || 'image/jpeg',
      });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Call Gemini to generate one angle view
 * @param {string} imageData   - base64 image data
 * @param {string} mimeType    - image mime type
 * @param {string} prompt      - angle prompt
 * @returns {Promise<string>}   - base64 of generated image
 */
async function generateAngle(imageData, mimeType, prompt) {
  const body = {
    contents: [{
      parts: [
        { inlineData: { mimeType, data: imageData } },
        { text: prompt },
      ],
    }],
    generationConfig: {
      responseModalities: ['Image', 'Text'],
    },
  };

  const resp = await fetch(API_BASE, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Gemini error ${resp.status}: ${err.slice(0, 200)}`);
  }

  const data = await resp.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  const imgPart = parts.find(p => p.inlineData?.data);
  if (!imgPart) throw new Error('Gemini returned no image');

  return `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}`;
}

/**
 * Generate all 3 missing angles from the front try-on result.
 * Returns { front, right, back, left } — all as data URLs.
 *
 * @param {string} frontUrl         - URL or data URL of front try-on result
 * @param {function} onStatus       - status callback
 * @param {object} capturedUrls     - { right, back, left } raw captured photos (fallback)
 */
export async function generateAllAngles(frontUrl, onStatus, capturedUrls = {}) {
  // Convert front image to base64
  onStatus?.('Preparing images for 3D generation...');
  let imageData, mimeType;

  if (frontUrl.startsWith('data:')) {
    mimeType  = frontUrl.split(';')[0].split(':')[1];
    imageData = frontUrl.split(',')[1];
  } else {
    const result = await urlToBase64(frontUrl);
    imageData    = result.data;
    mimeType     = result.mimeType;
  }

  const angles = {};
  angles.front = frontUrl;

  // Generate right, back, left with retries
  for (const [angle, prompt] of Object.entries(ANGLE_PROMPTS)) {
    onStatus?.(`Generating ${angle} view with Gemini AI...`);
    try {
      angles[angle] = await generateAngle(imageData, mimeType, prompt);
    } catch (err) {
      console.warn(`[Gemini3D] ${angle} failed:`, err.message);
      // Fallback to raw captured photo for that angle
      angles[angle] = capturedUrls[angle] || frontUrl;
    }
  }

  return angles; // { front, right, back, left }
}
