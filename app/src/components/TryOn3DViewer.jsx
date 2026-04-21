/**
 * TryOn3DViewer.jsx
 * Displays 4 angle try-on images as a 3D 360° viewer using Three.js.
 * User can drag to rotate and see the outfit from all angles.
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';

const ANGLE_ORDER = ['front', 'right', 'back', 'left'];

export default function TryOn3DViewer({ images, isLoading, statusMsg, clothingName }) {
  const mountRef    = useRef(null);
  const sceneRef    = useRef(null);
  const rendererRef = useRef(null);
  const meshRef     = useRef(null);
  const isDragging  = useRef(false);
  const lastX       = useRef(0);
  const rotY        = useRef(0);
  const rafRef      = useRef(null);
  const [activeAngle, setActiveAngle] = useState('front');

  // ── Build Three.js scene ──────────────────────────────────────────────────
  useEffect(() => {
    if (!mountRef.current) return;
    const W = mountRef.current.clientWidth;
    const H = mountRef.current.clientHeight;

    // Scene
    const scene    = new THREE.Scene();
    scene.background = new THREE.Color(0x07071a);
    sceneRef.current = scene;

    // Particles
    const partGeo  = new THREE.BufferGeometry();
    const partCount = 300;
    const partPos  = new Float32Array(partCount * 3);
    for (let i = 0; i < partCount * 3; i++) partPos[i] = (Math.random() - 0.5) * 10;
    partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3));
    scene.add(new THREE.Points(partGeo, new THREE.PointsMaterial({ color: 0x7c6aff, size: 0.03, transparent: true, opacity: 0.5 })));

    // Grid floor
    const gridHelper = new THREE.GridHelper(10, 20, 0x1a1a2e, 0x1a1a2e);
    gridHelper.position.y = -2.2;
    scene.add(gridHelper);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(0, 0.3, 3.5);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(2, 4, 3);
    scene.add(dirLight);
    const accentLight = new THREE.PointLight(0x7c6aff, 1.5, 8);
    accentLight.position.set(-2, 2, 2);
    scene.add(accentLight);
    const fillLight = new THREE.PointLight(0xff6a9a, 0.8, 8);
    fillLight.position.set(2, -1, 2);
    scene.add(fillLight);

    // Create 4 photo planes arranged in a cylinder
    // Each plane is at 90° intervals around Y axis, radius = 0
    // We rotate the GROUP to simulate 360° viewing
    const group = new THREE.Group();
    scene.add(group);
    meshRef.current = group;

    const loader = new THREE.TextureLoader();
    const planeH = 3.0;
    const planeW = planeH * (3 / 4); // portrait aspect

    ANGLE_ORDER.forEach((angle, i) => {
      const angleDeg = i * 90;
      const angleRad = (angleDeg * Math.PI) / 180;

      // Each plane faces outward from center
      const geo      = new THREE.PlaneGeometry(planeW, planeH);
      const mat      = new THREE.MeshStandardMaterial({
        color:       0xffffff,
        roughness:   0.4,
        metalness:   0.1,
        transparent: true,
        opacity:     i === 0 ? 1.0 : 0.0, // only front visible initially
      });
      const mesh = new THREE.Mesh(geo, mat);

      // Position around a cylinder of radius 0 — we just stack them and rotate
      mesh.userData.angle     = angle;
      mesh.userData.angleIdx  = i;
      mesh.userData.targetRot = angleRad;
      mesh.rotation.y         = angleRad;
      mesh.position.set(
        Math.sin(angleRad) * 0.01,
        0,
        Math.cos(angleRad) * 0.01,
      );
      group.add(mesh);

      // Load texture if available
      if (images?.[angle]) {
        loader.load(images[angle], (tex) => {
          tex.colorSpace    = THREE.SRGBColorSpace;
          mat.map           = tex;
          mat.needsUpdate   = true;
        });
      }
    });

    // Edge glow ring
    const ringGeo  = new THREE.TorusGeometry(0.7, 0.015, 8, 64);
    const ringMat  = new THREE.MeshStandardMaterial({ color: 0x7c6aff, emissive: 0x7c6aff, emissiveIntensity: 2 });
    const ring     = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -1.55;
    group.add(ring);

    // Animation loop
    let autoRotating = true;
    let autoRotY     = 0;

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);

      if (autoRotating && !isDragging.current) {
        autoRotY += 0.004;
        group.rotation.y = autoRotY + rotY.current;
      } else {
        group.rotation.y = rotY.current;
      }

      // Update which angle label is active based on rotation
      const normalised = ((group.rotation.y % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const idx        = Math.round(normalised / (Math.PI / 2)) % 4;
      const angleNames = ['front', 'left', 'back', 'right']; // reversed because rotating right shows left
      setActiveAngle(angleNames[idx] || 'front');

      // Show all planes as semi-transparent, front-facing one at full opacity
      group.children.forEach((child) => {
        if (!child.userData.angle) return;
        const childAngleRad  = child.userData.angleIdx * Math.PI / 2;
        const relativeAngle  = ((childAngleRad - group.rotation.y) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        // Front-facing = relativeAngle near 0 or 2π
        const isFront        = relativeAngle < 0.8 || relativeAngle > Math.PI * 2 - 0.8;
        if (child.material) {
          child.material.opacity = isFront ? 1.0 : 0.0;
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    // Drag to rotate
    const el = renderer.domElement;

    const onDown = (e) => {
      isDragging.current = true;
      autoRotating       = false;
      lastX.current      = e.touches ? e.touches[0].clientX : e.clientX;
    };
    const onMove = (e) => {
      if (!isDragging.current) return;
      const x    = e.touches ? e.touches[0].clientX : e.clientX;
      const dx   = x - lastX.current;
      rotY.current += dx * 0.01;
      lastX.current = x;
    };
    const onUp   = () => { isDragging.current = false; };

    el.addEventListener('mousedown',  onDown);
    el.addEventListener('mousemove',  onMove);
    el.addEventListener('mouseup',    onUp);
    el.addEventListener('touchstart', onDown, { passive: true });
    el.addEventListener('touchmove',  onMove, { passive: true });
    el.addEventListener('touchend',   onUp);

    // Resize
    const onResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      el.removeEventListener('mousedown',  onDown);
      el.removeEventListener('mousemove',  onMove);
      el.removeEventListener('mouseup',    onUp);
      el.removeEventListener('touchstart', onDown);
      el.removeEventListener('touchmove',  onMove);
      el.removeEventListener('touchend',   onUp);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // ── Update textures when images change ───────────────────────────────────
  useEffect(() => {
    if (!meshRef.current || !images) return;
    const loader = new THREE.TextureLoader();

    meshRef.current.children.forEach((child) => {
      const angle = child.userData?.angle;
      if (!angle || !images[angle] || !child.material) return;
      loader.load(images[angle], (tex) => {
        tex.colorSpace      = THREE.SRGBColorSpace;
        child.material.map  = tex;
        child.material.needsUpdate = true;
      });
    });
  }, [images]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 24, overflow: 'hidden' }}>
      {/* Three.js mount */}
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        padding: '16px 20px',
        background: 'linear-gradient(to bottom, rgba(5,5,8,0.95) 0%, transparent 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: isLoading ? 'var(--accent)' : '#00c864',
            boxShadow: `0 0 8px ${isLoading ? 'var(--accent)' : '#00c864'}`,
            animation: 'pulse 2s infinite',
          }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {isLoading ? 'Generating 3D...' : 'LIVE 3D Preview'}
          </span>
        </div>
        <div style={{
          fontSize: 11, color: 'var(--accent)', fontWeight: 600,
          background: 'rgba(124,106,255,0.12)', border: '1px solid rgba(124,106,255,0.25)',
          borderRadius: 20, padding: '3px 10px',
        }}>
          {activeAngle.charAt(0).toUpperCase() + activeAngle.slice(1)} View
        </div>
      </div>

      {/* Loading overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute', inset: 0, zIndex: 20,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(5,5,8,0.85)', gap: 20,
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              style={{
                width: 64, height: 64, borderRadius: '50%',
                border: '3px solid rgba(124,106,255,0.15)',
                borderTopColor: 'var(--accent)',
              }}
            />
            <div style={{ textAlign: 'center', padding: '0 32px' }}>
              <p style={{ color: 'white', fontWeight: 800, fontSize: 18, marginBottom: 8 }}>
                Building Your 3D Avatar
              </p>
              <p style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                {statusMsg || 'Processing...'}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                Gemini AI is generating all angles
              </p>
            </div>
            {/* Step indicators */}
            <div style={{ display: 'flex', gap: 8 }}>
              {['Try-On', 'Right view', 'Back view', 'Left view'].map((s, i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
                  style={{
                    fontSize: 10, color: 'var(--text-muted)',
                    background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                    borderRadius: 20, padding: '4px 10px', fontWeight: 600,
                  }}
                >
                  {s}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom info */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
        padding: '24px 20px 16px',
        background: 'linear-gradient(to top, rgba(5,5,8,0.95) 0%, transparent 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>Wearing</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{clothingName}</p>
        </div>
        <div style={{
          background: 'rgba(5,5,8,0.8)', border: '1px solid var(--border-glass)',
          borderRadius: 50, padding: '6px 14px', fontSize: 11, color: 'var(--text-muted)',
          display: 'flex', gap: 12,
        }}>
          <span>Drag to rotate</span>
        </div>
      </div>
    </div>
  );
}
