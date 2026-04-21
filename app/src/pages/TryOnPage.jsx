import { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Float, useGLTF } from '@react-three/drei';
import { Sparkles as SparklesIcon, Upload, CheckCircle, ChevronLeft, ChevronRight, RotateCcw, ZoomIn, Layers, Camera, X, Wifi, WifiOff } from 'lucide-react';
import { menProducts, womenProducts } from '../data/products';
import { submitTryOn, checkHealth } from '../utils/tryon_client';

const CLOTHING_CAROUSEL = [
  ...menProducts.tshirts.slice(0, 3),
  ...menProducts.shirts.slice(0, 2),
  ...womenProducts.tops.slice(0, 3),
  ...womenProducts.dresses.slice(0, 2),
];

const UPLOAD_ZONES = [
  { id: 'front', label: 'Front View', icon: '↑', desc: 'Face the camera directly' },
  { id: 'back', label: 'Back View', icon: '↓', desc: 'Turn your back to camera' },
  { id: 'left', label: 'Left Side', icon: '←', desc: 'Show your left profile' },
  { id: 'right', label: 'Right Side', icon: '→', desc: 'Show your right profile' },
];

// ─── 3D Scene Components ───────────────────────────────────────────────
function AvatarMesh({ hasUploads }) {
  const meshRef = useRef();
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.3;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Body */}
      <mesh position={[0, 0, 0]}>
        <capsuleGeometry args={[0.35, 1.4, 8, 16]} />
        <meshStandardMaterial
          color={hasUploads ? '#7c6aff' : '#2a2a3e'}
          roughness={0.3}
          metalness={0.1}
          emissive={hasUploads ? '#2a1f66' : '#0a0a14'}
        />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.28, 32, 32]} />
        <meshStandardMaterial color={hasUploads ? '#9d8fff' : '#2a2a3e'} roughness={0.4} metalness={0.05} />
      </mesh>
      {/* Arms */}
      {[-0.5, 0.5].map((x, i) => (
        <mesh key={i} position={[x * 0.9, 0.1, 0]} rotation={[0, 0, x > 0 ? -0.3 : 0.3]}>
          <capsuleGeometry args={[0.12, 0.8, 6, 12]} />
          <meshStandardMaterial color={hasUploads ? '#7c6aff' : '#252535'} roughness={0.3} />
        </mesh>
      ))}
      {/* Legs */}
      {[-0.18, 0.18].map((x, i) => (
        <mesh key={i} position={[x, -1.1, 0]}>
          <capsuleGeometry args={[0.13, 0.8, 6, 12]} />
          <meshStandardMaterial color={hasUploads ? '#5a4fcc' : '#1e1e2e'} roughness={0.5} />
        </mesh>
      ))}
      {/* Glow ring */}
      {hasUploads && (
        <mesh position={[0, -1.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.5, 0.02, 8, 64]} />
          <meshStandardMaterial color="#7c6aff" emissive="#7c6aff" emissiveIntensity={2} />
        </mesh>
      )}
    </group>
  );
}

function FloatingParticles() {
  const count = 40;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 6;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
  }
  const geo = useRef();
  useFrame(({ clock }) => {
    if (geo.current) {
      geo.current.rotation.y = clock.elapsedTime * 0.04;
    }
  });

  return (
    <points ref={geo}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.025} color="#7c6aff" transparent opacity={0.6} />
    </points>
  );
}

function GridFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
      <planeGeometry args={[10, 10, 20, 20]} />
      <meshStandardMaterial color="#0a0a14" wireframe opacity={0.3} transparent />
    </mesh>
  );
}

// Render a real GLB mesh from the API when available
function GLTFAvatar({ url }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} dispose={null} />;
}

function Scene3D({ hasUploads, selectedClothing, meshUrl }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 5, 3]} intensity={1.2} color="#ffffff" castShadow />
      <pointLight position={[-3, 3, -3]} intensity={0.8} color="#7c6aff" />
      <pointLight position={[3, -1, 3]} intensity={0.5} color="#ff6a9a" />
      <spotLight position={[0, 8, 0]} intensity={1} angle={0.4} penumbra={0.5} color="white" />

      <FloatingParticles />
      <GridFloor />

      {meshUrl ? (
        /* Real GLB from the Python API */
        <Suspense fallback={
          <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
            <AvatarMesh hasUploads={hasUploads} />
          </Float>
        }>
          <GLTFAvatar url={meshUrl} />
        </Suspense>
      ) : (
        /* Procedural placeholder avatar */
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
          <AvatarMesh hasUploads={hasUploads} />
        </Float>
      )}

      <OrbitControls
        enablePan={false}
        minDistance={2.5}
        maxDistance={8}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.5}
        autoRotate={!hasUploads}
        autoRotateSpeed={0.8}
      />
      <Environment preset="night" />
    </>
  );
}

// ─── Upload Zone Component ─────────────────────────────────────────────
function UploadZone({ zone, file, onUpload, onRemove }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef();

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) onUpload(zone.id, f);
  }, [zone.id, onUpload]);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f) onUpload(zone.id, f);
  };

  const preview = file ? URL.createObjectURL(file) : null;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !file && inputRef.current?.click()}
      style={{
        borderRadius: 20,
        border: '2px dashed',
        borderColor: file ? 'var(--accent)' : isDragging ? '#ff6a9a' : 'var(--border-glass)',
        background: file
          ? 'rgba(124,106,255,0.06)'
          : isDragging
          ? 'rgba(255,106,154,0.06)'
          : 'var(--bg-glass)',
        padding: 0,
        cursor: file ? 'default' : 'pointer',
        position: 'relative',
        overflow: 'hidden',
        aspectRatio: '3/4',
        transition: 'all var(--transition)',
        boxShadow: file ? '0 0 24px rgba(124,106,255,0.2)' : isDragging ? '0 0 24px rgba(255,106,154,0.2)' : 'none',
      }}
    >
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />

      <AnimatePresence mode="wait">
        {file ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ width: '100%', height: '100%', position: 'relative' }}
          >
            <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(5,5,8,0.8) 0%, transparent 60%)',
            }} />
            <div style={{ position: 'absolute', top: 10, right: 10 }}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); onRemove(zone.id); }}
                style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'rgba(255,50,50,0.8)', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'white',
                }}
              >
                <X size={14} />
              </motion.button>
            </div>
            <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle size={16} color="#00c864" />
                <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>{zone.label}</span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: '100%', gap: 12, padding: 20,
              textAlign: 'center',
            }}
          >
            {/* Direction icon */}
            <motion.div
              animate={{ y: isDragging ? [0, -6, 0] : 0 }}
              transition={{ duration: 0.6, repeat: isDragging ? Infinity : 0 }}
              style={{
                width: 56, height: 56, borderRadius: '50%',
                background: isDragging ? 'rgba(255,106,154,0.12)' : 'rgba(124,106,255,0.1)',
                border: '1px solid',
                borderColor: isDragging ? 'rgba(255,106,154,0.3)' : 'rgba(124,106,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 700,
                color: isDragging ? '#ff6a9a' : 'var(--accent)',
              }}
            >
              {zone.icon}
            </motion.div>

            <div>
              <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>{zone.label}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{zone.desc}</p>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: isDragging ? 'rgba(255,106,154,0.1)' : 'rgba(124,106,255,0.08)',
              border: '1px solid',
              borderColor: isDragging ? 'rgba(255,106,154,0.3)' : 'rgba(124,106,255,0.2)',
              borderRadius: 8, padding: '6px 12px',
            }}>
              <Upload size={13} color={isDragging ? '#ff6a9a' : 'var(--accent)'} />
              <span style={{ fontSize: 12, color: isDragging ? '#ff6a9a' : 'var(--accent)', fontWeight: 600 }}>
                {isDragging ? 'Drop here!' : 'Click or drag'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── PROGRESS BAR ──────────────────────────────────────────────────────
function ProcessingBar({ progress }) {
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
        <span style={{ color: 'var(--text-secondary)' }}>Generating 3D model...</span>
        <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{progress}%</span>
      </div>
      <div style={{ height: 4, background: 'var(--bg-card)', borderRadius: 2, overflow: 'hidden' }}>
        <motion.div
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
          style={{ height: '100%', background: 'var(--gradient-1)', borderRadius: 2 }}
        />
      </div>
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────
export default function TryOnPage() {
  const location = useLocation();
  const preSelectedProduct = location.state?.product;

  const [uploads, setUploads] = useState({});
  const [selectedClothing, setSelectedClothing] = useState(
    preSelectedProduct ? CLOTHING_CAROUSEL.find(p => p.id === preSelectedProduct.id) || CLOTHING_CAROUSEL[0] : CLOTHING_CAROUSEL[0]
  );
  const [carouselOffset, setCarouselOffset] = useState(0);
  const [stage, setStage] = useState('upload'); // upload | processing | result
  const [progress, setProgress] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [meshUrl, setMeshUrl] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [apiOnline, setApiOnline] = useState(null); // null=unknown, true, false

  // Check if the Python API is reachable
  useEffect(() => {
    checkHealth()
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false));
  }, []);

  const uploadCount = Object.keys(uploads).length;
  const allUploaded = uploadCount === 4;

  const handleUpload = useCallback((id, file) => {
    setUploads(prev => ({ ...prev, [id]: file }));
  }, []);

  const handleRemove = useCallback((id) => {
    setUploads(prev => { const n = { ...prev }; delete n[id]; return n; });
  }, []);

  const handleGenerate = async () => {
    if (!allUploaded) return;
    setStage('processing');
    setProgress(0);
    setApiError(null);
    setMeshUrl(null);

    // Get the clothing File from the selected product's first image URL
    // In a real integration the user uploads a clothing file directly;
    // here we fetch it from our public/ folder as a blob.
    let clothingFile;
    try {
      const resp = await fetch(selectedClothing.images[0]);
      const blob = await resp.blob();
      clothingFile = new File([blob], 'clothing.jpg', { type: 'image/jpeg' });
    } catch {
      clothingFile = new File([new Blob()], 'clothing.jpg', { type: 'image/jpeg' });
    }

    try {
      const result = await submitTryOn({
        front:    uploads.front,
        back:     uploads.back,
        left:     uploads.left,
        right:    uploads.right,
        clothing: clothingFile,
        meshFormat: 'glb',
        onProgress: (pct) => setProgress(pct),
      });

      setMeshUrl(result.meshUrl);
      setProgress(100);
      setStage('result');
    } catch (err) {
      // If the API is not running, fall back to the mock 3D demo
      console.warn('[TryOn] API error — using mock 3D demo:', err.message);
      setApiError(err.message);

      // Simulate progress for the demo experience
      let p = progress;
      const interval = setInterval(() => {
        p += Math.random() * 12 + 3;
        if (p >= 100) {
          p = 100;
          clearInterval(interval);
          setTimeout(() => setStage('result'), 400);
        }
        setProgress(Math.floor(p));
      }, 180);
    }
  };

  const visibleCarousel = CLOTHING_CAROUSEL.slice(carouselOffset, carouselOffset + 4);

  return (
    <div style={{ paddingTop: 'var(--nav-height)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid var(--border-glass)',
        padding: '28px 0',
        background: 'linear-gradient(135deg, rgba(124,106,255,0.08) 0%, rgba(255,106,154,0.04) 100%)',
      }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                >
                  <SparklesIcon size={22} color="var(--accent)" />
                </motion.div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 3vw, 36px)', fontWeight: 800, margin: 0 }}>
                  3D Virtual Try-On
                </h1>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                Upload 4 photos • Select outfit • See it in stunning 3D
              </p>
            </div>

            {/* Step indicators */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {['Upload Photos', 'Select Outfit', 'View in 3D'].map((step, i) => {
                const isActive = (stage === 'upload' && i === 0) || (stage === 'processing' && i === 1) || (stage === 'result' && i === 2);
                const isDone = (stage === 'processing' && i === 0) || (stage === 'result' && i <= 1);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: isDone ? '#00c864' : isActive ? 'var(--gradient-1)' : 'var(--bg-card)',
                        border: '1px solid',
                        borderColor: isDone ? '#00c864' : isActive ? 'transparent' : 'var(--border-glass)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: 'white',
                        flexShrink: 0,
                        boxShadow: isActive ? '0 0 12px var(--accent-glow)' : 'none',
                        transition: 'all 0.4s ease',
                      }}>
                        {isDone ? '✓' : i + 1}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 400, color: isActive ? 'var(--text-primary)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {step}
                      </span>
                    </div>
                    {i < 2 && <div style={{ width: 24, height: 1, background: 'var(--border-glass)' }} />}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container" style={{ padding: '40px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start' }}>

          {/* LEFT PANEL */}
          <div>
            <AnimatePresence mode="wait">
              {stage === 'upload' && (
                <motion.div key="upload" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div style={{ marginBottom: 24 }}>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
                      Upload Your Photos
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                      We need 4 angles for accurate 3D reconstruction. Use good lighting!
                    </p>

                    {/* Upload progress indicator */}
                    <div style={{ display: 'flex', gap: 6, marginTop: 16, alignItems: 'center' }}>
                      {UPLOAD_ZONES.map(z => (
                        <div key={z.id} style={{ flex: 1 }}>
                          <div style={{
                            height: 3, borderRadius: 2,
                            background: uploads[z.id] ? 'var(--gradient-1)' : 'var(--bg-card)',
                            transition: 'all 0.4s ease',
                          }} />
                        </div>
                      ))}
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: 8 }}>
                        {uploadCount}/4
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
                    {UPLOAD_ZONES.map(zone => (
                      <UploadZone
                        key={zone.id}
                        zone={zone}
                        file={uploads[zone.id]}
                        onUpload={handleUpload}
                        onRemove={handleRemove}
                      />
                    ))}
                  </div>

                  {/* Tips */}
                  <div style={{
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: 16, padding: '16px 20px',
                    marginBottom: 28,
                  }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginBottom: 10 }}>Photo Tips for Best Results</p>
                    {['Stand in front of a plain background', 'Wear form-fitting clothes for accuracy', 'Good natural lighting recommended', 'Keep a neutral pose, feet together'].map((tip, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                        <span style={{ color: '#00c864', fontSize: 14, flexShrink: 0 }}>✓</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{tip}</span>
                      </div>
                    ))}
                  </div>

                  <motion.button
                    whileHover={{ scale: allUploaded ? 1.02 : 1, y: allUploaded ? -2 : 0 }}
                    whileTap={{ scale: allUploaded ? 0.97 : 1 }}
                    onClick={handleGenerate}
                    disabled={!allUploaded}
                    style={{
                      width: '100%', padding: '16px',
                      background: allUploaded ? 'var(--gradient-1)' : 'var(--bg-card)',
                      border: allUploaded ? 'none' : '1px solid var(--border-glass)',
                      borderRadius: 14, fontSize: 16, fontWeight: 700,
                      color: allUploaded ? 'white' : 'var(--text-muted)',
                      cursor: allUploaded ? 'pointer' : 'not-allowed',
                      fontFamily: 'var(--font-body)',
                      boxShadow: allUploaded ? '0 6px 24px var(--accent-glow)' : 'none',
                      transition: 'all 0.4s ease',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    }}
                  >
                    <SparklesIcon size={18} />
                    {allUploaded ? 'Generate My 3D Avatar' : `Upload ${4 - uploadCount} More Photo${4 - uploadCount !== 1 ? 's' : ''}`}
                  </motion.button>
                </motion.div>
              )}

              {stage === 'processing' && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    textAlign: 'center',
                    padding: '60px 40px',
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: 24,
                  }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'inline-block', marginBottom: 24 }}
                  >
                    <div style={{
                      width: 80, height: 80, borderRadius: '50%',
                      background: 'var(--gradient-1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 0 40px var(--accent-glow)',
                    }}>
                      <SparklesIcon size={36} color="white" />
                    </div>
                  </motion.div>

                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
                    Building Your 3D Avatar
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32, lineHeight: 1.7 }}>
                    Our AI is analyzing your photos and constructing a personalized 3D model. This takes just a moment...
                  </p>

                  <ProcessingBar progress={progress} />

                  <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 32, flexWrap: 'wrap' }}>
                    {['Analyzing poses', 'Building mesh', 'Applying texture', 'Finalizing'].map((step, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: progress > (i + 1) * 25 ? '#00c864' : progress > i * 25 ? 'var(--accent)' : 'var(--bg-card)',
                          transition: 'all 0.4s ease',
                          boxShadow: progress > i * 25 && progress <= (i + 1) * 25 ? '0 0 8px var(--accent)' : 'none',
                        }} />
                        <span style={{ fontSize: 13, color: progress > i * 25 ? 'var(--text-primary)' : 'var(--text-muted)' }}>{step}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {stage === 'result' && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div style={{
                    background: 'rgba(0,200,100,0.08)',
                    border: '1px solid rgba(0,200,100,0.2)',
                    borderRadius: 16, padding: '16px 20px',
                    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24,
                  }}>
                    <CheckCircle size={22} color="#00c864" />
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 700, color: '#00c864', marginBottom: 2 }}>3D Avatar Generated!</p>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Rotate and zoom in the 3D stage to see your avatar.</p>
                    </div>
                  </div>

                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
                    Select Clothing to Try On
                  </h2>

                  {/* Clothing Carousel */}
                  <div style={{ position: 'relative', marginBottom: 24 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                      {CLOTHING_CAROUSEL.slice(carouselOffset, carouselOffset + 4).map((item) => (
                        <motion.div
                          key={item.id}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setSelectedClothing(item)}
                          style={{
                            borderRadius: 14, overflow: 'hidden',
                            border: '2px solid',
                            borderColor: selectedClothing?.id === item.id ? 'var(--accent)' : 'var(--border-glass)',
                            cursor: 'pointer',
                            aspectRatio: '2/3',
                            background: 'var(--bg-card)',
                            position: 'relative',
                            boxShadow: selectedClothing?.id === item.id ? '0 0 20px var(--accent-glow)' : 'none',
                            transition: 'all var(--transition)',
                          }}
                        >
                          <img
                            src={item.images[0]}
                            alt={item.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={e => e.target.style.display = 'none'}
                          />
                          <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(to top, rgba(5,5,8,0.9) 0%, transparent 60%)',
                          }} />
                          <div style={{ position: 'absolute', bottom: 6, left: 6, right: 6 }}>
                            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: 600, lineHeight: 1.3 }}>
                              {item.name.split(' ').slice(0, 3).join(' ')}
                            </p>
                          </div>
                          {selectedClothing?.id === item.id && (
                            <div style={{
                              position: 'absolute', top: 6, right: 6,
                              width: 20, height: 20, borderRadius: '50%',
                              background: 'var(--accent)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 11, color: 'white', fontWeight: 700,
                            }}>✓</div>
                          )}
                        </motion.div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
                      <button
                        onClick={() => setCarouselOffset(o => Math.max(0, o - 4))}
                        disabled={carouselOffset === 0}
                        style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                          color: carouselOffset === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                          cursor: carouselOffset === 0 ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={() => setCarouselOffset(o => Math.min(CLOTHING_CAROUSEL.length - 4, o + 4))}
                        disabled={carouselOffset + 4 >= CLOTHING_CAROUSEL.length}
                        style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                          color: carouselOffset + 4 >= CLOTHING_CAROUSEL.length ? 'var(--text-muted)' : 'var(--text-primary)',
                          cursor: carouselOffset + 4 >= CLOTHING_CAROUSEL.length ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>

                  {selectedClothing && (
                    <div style={{
                      background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                      borderRadius: 14, padding: '16px', marginBottom: 20,
                      display: 'flex', alignItems: 'center', gap: 14,
                    }}>
                      <img src={selectedClothing.images[0]} alt="" style={{ width: 56, height: 70, objectFit: 'cover', borderRadius: 10 }} onError={e => e.target.style.display = 'none'} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedClothing.name}</p>
                        <p style={{ color: 'var(--accent)', fontWeight: 800, fontSize: 16 }}>₹{selectedClothing.price.toLocaleString()}</p>
                      </div>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '10px 18px', fontSize: 13, flexShrink: 0 }}
                        onClick={() => setModalOpen(true)}
                      >
                        Buy Now
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => { setStage('upload'); setProgress(0); setUploads({}); }}
                    className="btn btn-ghost"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <RotateCcw size={16} /> Start Over
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT PANEL: 3D Stage */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ position: 'sticky', top: 'calc(var(--nav-height) + 20px)' }}
          >
            <div style={{
              borderRadius: 24,
              overflow: 'hidden',
              border: '1px solid var(--border-glass)',
              background: 'var(--bg-card)',
              aspectRatio: '1 / 1.1',
              position: 'relative',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}>
              {/* Stage Header */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
                padding: '16px 20px',
                background: 'linear-gradient(to bottom, rgba(5,5,8,0.9) 0%, transparent 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: stage === 'result' ? '#00c864' : 'var(--accent)',
                    boxShadow: `0 0 8px ${stage === 'result' ? '#00c864' : 'var(--accent)'}`,
                    animation: 'pulse 2s infinite',
                  }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {stage === 'result' ? 'LIVE 3D Preview' : '3D Stage'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {/* API status indicator */}
                  {apiOnline !== null && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      background: apiOnline ? 'rgba(0,200,100,0.1)' : 'rgba(255,70,70,0.1)',
                      border: `1px solid ${apiOnline ? 'rgba(0,200,100,0.3)' : 'rgba(255,70,70,0.3)'}`,
                      borderRadius: 20, padding: '3px 8px', fontSize: 11, fontWeight: 600,
                      color: apiOnline ? '#00c864' : '#ff4646',
                    }}>
                      {apiOnline ? <Wifi size={11}/> : <WifiOff size={11}/>}
                      {apiOnline ? 'API' : 'Demo'}
                    </div>
                  )}
                  {[Layers, ZoomIn, Camera].map((Icon, i) => (
                    <motion.button key={i} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} style={{
                      width: 30, height: 30, borderRadius: 8,
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: 'var(--text-secondary)',
                    }}>
                      <Icon size={14} />
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Canvas */}
              <Canvas
                camera={{ position: [0, 1, 5], fov: 45 }}
                style={{ width: '100%', height: '100%', background: '#07071a' }}
              >
                <Scene3D hasUploads={stage === 'result'} selectedClothing={selectedClothing} meshUrl={meshUrl} />
              </Canvas>

              {/* Overlay when not yet generated */}
              {stage !== 'result' && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'flex-end',
                  padding: '20px',
                  background: 'linear-gradient(to top, rgba(5,5,8,0.8) 0%, transparent 60%)',
                  pointerEvents: 'none',
                }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
                    {stage === 'upload'
                      ? `Upload all 4 photos to generate your 3D avatar`
                      : 'Processing...'}
                  </p>
                </div>
              )}

              {/* Controls hint */}
              <div style={{
                position: 'absolute', bottom: 16, left: 0, right: 0,
                display: 'flex', justifyContent: 'center',
              }}>
                <div style={{
                  background: 'rgba(5,5,8,0.8)', backdropFilter: 'blur(8px)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 50, padding: '6px 14px',
                  fontSize: 11, color: 'var(--text-muted)',
                  display: 'flex', gap: 16,
                }}>
                  <span>🖱 Drag to rotate</span>
                  <span>🔍 Scroll to zoom</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Buy Modal */}
      <AnimatePresence>
        {modalOpen && selectedClothing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModalOpen(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(10px)', zIndex: 3000,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
                borderRadius: 24, padding: 32, maxWidth: 420, width: '100%',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>Add to Cart</h3>
                <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={20} />
                </button>
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                <img src={selectedClothing.images[0]} alt="" style={{ width: 80, height: 100, objectFit: 'cover', borderRadius: 12 }} />
                <div>
                  <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{selectedClothing.name}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>{selectedClothing.category}</p>
                  <p style={{ color: 'var(--accent)', fontWeight: 800, fontSize: 22 }}>₹{selectedClothing.price.toLocaleString()}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setModalOpen(false)}>
                  Add to Cart
                </button>
                <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @media (max-width: 768px) {
          .tryon-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
