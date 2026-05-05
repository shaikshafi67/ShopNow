/**
 * Avatar3D.jsx — Smooth Human-Like Parametric Avatar + Garment System
 *
 * Key improvements over the previous wooden-mannequin version:
 *  - Sphere joints fill every gap (shoulder, elbow, wrist, hip, knee, ankle)
 *  - MeshPhysicalMaterial with clearcoat for realistic skin
 *  - Continuous curved torso via 14-point LatheGeometry
 *  - Hair dome + face indication on head
 *  - Garment shown as a flat image-plane draped on the body (clear product view)
 *  - HDRI city environment + 5-light rig for depth
 */

import { useMemo, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Grid } from '@react-three/drei';
import * as THREE from 'three';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function detectGarmentType(product) {
  if (!product) return 'top';
  const t = ((product.category || '') + ' ' + (product.name || '')).toLowerCase();
  if (t.includes('dress'))                          return 'dress';
  if (t.includes('pant') || t.includes('jean'))    return 'pants';
  if (t.includes('saree') || t.includes('sari'))   return 'saree';
  if (t.includes('kurti') || t.includes('kurta'))  return 'kurta';
  if (t.includes('co-ord') || t.includes('coord')) return 'coords';
  return 'top';
}

const FIT_SCALE = { tight: 1.022, perfect: 1.075, loose: 1.16, 'very-loose': 1.28 };

// ─── Reusable sphere joint ────────────────────────────────────────────────────
function Joint({ pos, r = 0.055, mat }) {
  return (
    <mesh position={pos}>
      <sphereGeometry args={[r, 14, 14]} />
      {mat}
    </mesh>
  );
}

// ─── Torso (LatheGeometry, 14-point organic curve) ───────────────────────────
function TorsoMesh({ SW, HW, TH, mat }) {
  const geo = useMemo(() => {
    const W = SW, H = HW;
    const waist = W * 0.67 + H * 0.33;
    const chest = W * 0.88;
    const h = TH;
    // 14-point profile: bottom (hip) → top (neck base)
    const pts = [
      new THREE.Vector2(H * 0.94,        0),
      new THREE.Vector2(H,               h * 0.04),
      new THREE.Vector2(H * 0.97,        h * 0.11),
      new THREE.Vector2(H * 0.90,        h * 0.20),
      new THREE.Vector2(waist * 1.01,    h * 0.28),
      new THREE.Vector2(waist,           h * 0.38),
      new THREE.Vector2(waist * 1.03,    h * 0.48),
      new THREE.Vector2(chest * 0.90,    h * 0.57),
      new THREE.Vector2(chest,           h * 0.67),
      new THREE.Vector2(chest * 1.02,    h * 0.76),
      new THREE.Vector2(W * 0.90,        h * 0.84),
      new THREE.Vector2(W * 0.80,        h * 0.90),
      new THREE.Vector2(W * 0.65,        h * 0.96),
      new THREE.Vector2(W * 0.52,        h),
    ];
    return new THREE.LatheGeometry(pts, 48);
  }, [SW, HW, TH]);
  return <mesh geometry={geo}>{mat}</mesh>;
}

// ─── Full human body ──────────────────────────────────────────────────────────
export function AvatarBody({ measurements, skinColor = '#c8956c' }) {
  const sS = measurements?.shoulderScale ?? 1;
  const hS = measurements?.hipScale      ?? 1;
  const aS = measurements?.armScale      ?? 1;
  const lS = measurements?.legScale      ?? 1;

  // ── Core dimensions ───────────────────────────────────────────────────────
  const SW   = 0.285 * sS;   // half-shoulder width
  const HW   = 0.250 * hS;   // half-hip width
  const TH   = 0.575;         // torso height
  const UAL  = 0.320 * aS;   // upper-arm length
  const FAL  = 0.295 * aS;   // forearm length
  const ULL  = 0.400 * lS;   // upper-leg length
  const LLL  = 0.380 * lS;   // lower-leg length

  // ── Material — MeshPhysicalMaterial looks like skin, not plastic ──────────
  const skinMat = (
    <meshPhysicalMaterial
      color={skinColor}
      roughness={0.82}
      metalness={0.0}
      clearcoat={0.08}
      clearcoatRoughness={0.55}
    />
  );

  // Hair slightly darker than skin
  const hairColor = new THREE.Color(skinColor).multiplyScalar(0.38).getStyle();
  const hairMat   = <meshPhysicalMaterial color={hairColor} roughness={0.9} />;

  // ── Arm positioning ───────────────────────────────────────────────────────
  const shoulderY  = TH - 0.02;           // shoulder joint Y (local to group)
  const elbowY     = shoulderY - UAL - 0.02;
  const wristY     = elbowY    - FAL - 0.015;

  const armTiltZ   = 0.22;                // natural arm hang angle
  const armTiltX   = 0.08;

  // ── Leg positioning ───────────────────────────────────────────────────────
  const hipJointX  = HW * 0.52;
  const hipJointY  = 0.0;
  const kneeY      = hipJointY - ULL - 0.015;
  const ankleY     = kneeY     - LLL - 0.010;

  return (
    // Group centred at hip mid — avatar spans from ~-1 (feet) to ~+1 (top of head)
    <group position={[0, -TH * 0.5, 0]}>

      {/* ──────── HEAD ──────── */}
      {/* Skull */}
      <mesh position={[0, TH + 0.205, 0]}>
        <sphereGeometry args={[0.145, 28, 28]} />
        {skinMat}
      </mesh>
      {/* Hair dome (slightly flattened hemisphere on top) */}
      <mesh position={[0, TH + 0.295, 0]} scale={[1, 0.65, 1]}>
        <sphereGeometry args={[0.148, 22, 22, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        {hairMat}
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.048, TH + 0.230, 0.128]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshPhysicalMaterial color="#1a1a1a" roughness={0.2} />
      </mesh>
      <mesh position={[0.048, TH + 0.230, 0.128]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshPhysicalMaterial color="#1a1a1a" roughness={0.2} />
      </mesh>

      {/* ──────── NECK ──────── */}
      <mesh position={[0, TH + 0.065, 0]}>
        <cylinderGeometry args={[0.058, 0.070, 0.120, 16]} />
        {skinMat}
      </mesh>

      {/* ──────── TORSO ──────── */}
      <TorsoMesh SW={SW} HW={HW} TH={TH} mat={skinMat} />

      {/* ──────── SHOULDER JOINTS ──────── */}
      <Joint pos={[-SW - 0.015, shoulderY, 0]}  r={0.072} mat={skinMat} />
      <Joint pos={[ SW + 0.015, shoulderY, 0]}  r={0.072} mat={skinMat} />

      {/* ──────── UPPER ARMS ──────── */}
      <mesh
        position={[-(SW + 0.055), shoulderY - UAL * 0.5, 0.018]}
        rotation={[armTiltX, 0, armTiltZ]}
      >
        <cylinderGeometry args={[0.068, 0.058, UAL, 16]} />
        {skinMat}
      </mesh>
      <mesh
        position={[ SW + 0.055,  shoulderY - UAL * 0.5, 0.018]}
        rotation={[armTiltX, 0, -armTiltZ]}
      >
        <cylinderGeometry args={[0.068, 0.058, UAL, 16]} />
        {skinMat}
      </mesh>

      {/* ──────── ELBOW JOINTS ──────── */}
      <Joint pos={[-(SW + 0.075), elbowY, 0.040]} r={0.056} mat={skinMat} />
      <Joint pos={[ SW + 0.075,  elbowY, 0.040]} r={0.056} mat={skinMat} />

      {/* ──────── FOREARMS ──────── */}
      <mesh
        position={[-(SW + 0.090), elbowY - FAL * 0.5, 0.065]}
        rotation={[0.22, 0, 0.12]}
      >
        <cylinderGeometry args={[0.052, 0.040, FAL, 16]} />
        {skinMat}
      </mesh>
      <mesh
        position={[ SW + 0.090,  elbowY - FAL * 0.5, 0.065]}
        rotation={[0.22, 0, -0.12]}
      >
        <cylinderGeometry args={[0.052, 0.040, FAL, 16]} />
        {skinMat}
      </mesh>

      {/* ──────── WRIST JOINTS ──────── */}
      <Joint pos={[-(SW + 0.100), wristY, 0.088]} r={0.040} mat={skinMat} />
      <Joint pos={[ SW + 0.100,  wristY, 0.088]} r={0.040} mat={skinMat} />

      {/* ──────── HANDS ──────── */}
      <mesh position={[-(SW + 0.102), wristY - 0.055, 0.096]}>
        <boxGeometry args={[0.068, 0.080, 0.035]} />
        {skinMat}
      </mesh>
      <mesh position={[ SW + 0.102,  wristY - 0.055, 0.096]}>
        <boxGeometry args={[0.068, 0.080, 0.035]} />
        {skinMat}
      </mesh>

      {/* ──────── HIP JOINTS ──────── */}
      <Joint pos={[-hipJointX, hipJointY, 0]} r={0.090} mat={skinMat} />
      <Joint pos={[ hipJointX, hipJointY, 0]} r={0.090} mat={skinMat} />

      {/* ──────── UPPER LEGS ──────── */}
      <mesh position={[-hipJointX, hipJointY - ULL * 0.5, 0]}>
        <cylinderGeometry args={[0.112, 0.094, ULL, 18]} />
        {skinMat}
      </mesh>
      <mesh position={[ hipJointX, hipJointY - ULL * 0.5, 0]}>
        <cylinderGeometry args={[0.112, 0.094, ULL, 18]} />
        {skinMat}
      </mesh>

      {/* ──────── KNEE JOINTS ──────── */}
      <Joint pos={[-hipJointX, kneeY, 0]} r={0.082} mat={skinMat} />
      <Joint pos={[ hipJointX, kneeY, 0]} r={0.082} mat={skinMat} />

      {/* ──────── LOWER LEGS ──────── */}
      <mesh position={[-hipJointX, kneeY - LLL * 0.5, 0]}>
        <cylinderGeometry args={[0.082, 0.062, LLL, 16]} />
        {skinMat}
      </mesh>
      <mesh position={[ hipJointX, kneeY - LLL * 0.5, 0]}>
        <cylinderGeometry args={[0.082, 0.062, LLL, 16]} />
        {skinMat}
      </mesh>

      {/* ──────── ANKLE JOINTS ──────── */}
      <Joint pos={[-hipJointX, ankleY, 0]} r={0.052} mat={skinMat} />
      <Joint pos={[ hipJointX, ankleY, 0]} r={0.052} mat={skinMat} />

      {/* ──────── FEET ──────── */}
      <mesh position={[-hipJointX, ankleY - 0.038, 0.055]}>
        <boxGeometry args={[0.115, 0.062, 0.235]} />
        {skinMat}
      </mesh>
      <mesh position={[ hipJointX, ankleY - 0.038, 0.055]}>
        <boxGeometry args={[0.115, 0.062, 0.235]} />
        {skinMat}
      </mesh>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  GARMENT — product image shown as fabric panels on the body
// ═══════════════════════════════════════════════════════════════════════════════

function GarmentInner({ product, measurements, fitType }) {
  const sS = measurements?.shoulderScale ?? 1;
  const hS = measurements?.hipScale      ?? 1;
  const lS = measurements?.legScale      ?? 1;
  const fs  = FIT_SCALE[fitType] || FIT_SCALE.perfect;

  const SW   = 0.285 * sS * fs;
  const HW   = 0.250 * hS * fs;
  const TH   = 0.575;
  const type = detectGarmentType(product);
  const src  = product?.images?.[0] || '';

  const texture = useMemo(() => {
    if (!src) return null;
    const loader = new THREE.TextureLoader();
    const tex = loader.load(src);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    // Show centre portion of the image (front of garment)
    tex.repeat.set(0.55, 0.85);
    tex.offset.set(0.22, 0.08);
    return tex;
  }, [src]);

  // Fabric material — slightly transparent at edges by using alphaTest
  const fabricMat = (
    <meshPhysicalMaterial
      map={texture}
      color={texture ? '#f5f5f5' : '#c0c0e0'}
      roughness={0.82}
      metalness={0.0}
      side={THREE.FrontSide}
      transparent={false}
    />
  );

  const fabricMatDouble = (
    <meshPhysicalMaterial
      map={texture}
      color={texture ? '#f5f5f5' : '#c0c0e0'}
      roughness={0.82}
      metalness={0.0}
      side={THREE.DoubleSide}
    />
  );

  // Sleeve cylinder material (plain, slightly off-white)
  const sleeveMat = (
    <meshPhysicalMaterial
      color={texture ? '#efefef' : '#b0b0d0'}
      roughness={0.80}
      side={THREE.DoubleSide}
    />
  );

  // ── garment geometry positioned at same origin as body ────────────────────
  const groupY = -TH * 0.5;

  return (
    <group position={[0, groupY, 0]}>

      {/* ─── TOP / SHIRT ─────────────────────────────────────────────────── */}
      {(type === 'top' || type === 'shirt') && (
        <>
          {/* Front panel — flat plane sits ~0.01 in front of torso */}
          <mesh position={[0, TH * 0.50, SW * 0.18]}>
            <planeGeometry args={[SW * 2.22, TH * 0.92, 8, 8]} />
            {fabricMat}
          </mesh>
          {/* Back panel */}
          <mesh position={[0, TH * 0.50, -SW * 0.18]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[SW * 2.22, TH * 0.92, 8, 8]} />
            {fabricMat}
          </mesh>
          {/* Side fill strips so garment wraps */}
          <mesh position={[-SW * 1.10, TH * 0.50, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[SW * 0.38, TH * 0.92]} />
            {fabricMatDouble}
          </mesh>
          <mesh position={[ SW * 1.10, TH * 0.50, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[SW * 0.38, TH * 0.92]} />
            {fabricMatDouble}
          </mesh>
          {/* Sleeves */}
          <mesh position={[-(SW + 0.056), TH - 0.10, 0.020]} rotation={[0.10, 0, 0.25]}>
            <cylinderGeometry args={[0.082, 0.072, 0.300, 16]} />
            {sleeveMat}
          </mesh>
          <mesh position={[ SW + 0.056,  TH - 0.10, 0.020]} rotation={[0.10, 0, -0.25]}>
            <cylinderGeometry args={[0.082, 0.072, 0.300, 16]} />
            {sleeveMat}
          </mesh>
          {/* Collar ring */}
          <mesh position={[0, TH - 0.005, 0]}>
            <torusGeometry args={[SW * 0.48, 0.016, 10, 36]} />
            {sleeveMat}
          </mesh>
        </>
      )}

      {/* ─── DRESS ───────────────────────────────────────────────────────── */}
      {type === 'dress' && (
        <>
          {/* Bodice front */}
          <mesh position={[0, TH * 0.65, SW * 0.18]}>
            <planeGeometry args={[SW * 2.15, TH * 0.65, 8, 8]} />
            {fabricMat}
          </mesh>
          {/* Bodice back */}
          <mesh position={[0, TH * 0.65, -SW * 0.18]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[SW * 2.15, TH * 0.65, 8, 8]} />
            {fabricMat}
          </mesh>
          {/* Skirt — flared cone */}
          <mesh position={[0, TH * 0.33 - 0.28 * lS, 0]}>
            <cylinderGeometry args={[HW * 1.02, HW * 1.92, 0.56 * lS, 36, 1, true]} />
            {fabricMatDouble}
          </mesh>
          {/* Shoulder straps / cap sleeves */}
          <mesh position={[-(SW + 0.018), TH * 0.96, 0.010]} rotation={[0.05, 0, 0.18]}>
            <cylinderGeometry args={[0.068, 0.062, 0.125, 12]} />
            {sleeveMat}
          </mesh>
          <mesh position={[ SW + 0.018,  TH * 0.96, 0.010]} rotation={[0.05, 0, -0.18]}>
            <cylinderGeometry args={[0.068, 0.062, 0.125, 12]} />
            {sleeveMat}
          </mesh>
        </>
      )}

      {/* ─── PANTS / JEANS ────────────────────────────────────────────────── */}
      {type === 'pants' && (() => {
        const lx = HW * 0.52;
        const ULL = 0.400 * lS;
        const LLL = 0.380 * lS;
        return (
          <>
            {/* Waistband */}
            <mesh position={[0, 0.045, 0]}>
              <cylinderGeometry args={[HW * 1.06, HW * 1.04, 0.09, 24]} />
              {fabricMatDouble}
            </mesh>
            {/* Left upper leg */}
            <mesh position={[-lx, -ULL * 0.5, 0]}>
              <cylinderGeometry args={[HW * 0.60, HW * 0.52, ULL, 16]} />
              {fabricMat}
            </mesh>
            {/* Right upper leg */}
            <mesh position={[ lx, -ULL * 0.5, 0]}>
              <cylinderGeometry args={[HW * 0.60, HW * 0.52, ULL, 16]} />
              {fabricMat}
            </mesh>
            {/* Left lower leg */}
            <mesh position={[-lx, -ULL - LLL * 0.5 - 0.015, 0]}>
              <cylinderGeometry args={[HW * 0.50, HW * 0.42, LLL, 16]} />
              {fabricMat}
            </mesh>
            {/* Right lower leg */}
            <mesh position={[ lx, -ULL - LLL * 0.5 - 0.015, 0]}>
              <cylinderGeometry args={[HW * 0.50, HW * 0.42, LLL, 16]} />
              {fabricMat}
            </mesh>
          </>
        );
      })()}

      {/* ─── KURTA ────────────────────────────────────────────────────────── */}
      {type === 'kurta' && (
        <>
          <mesh position={[0, TH * 0.46, SW * 0.18]}>
            <planeGeometry args={[SW * 2.18, TH * 1.26, 8, 10]} />
            {fabricMat}
          </mesh>
          <mesh position={[0, TH * 0.46, -SW * 0.18]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[SW * 2.18, TH * 1.26, 8, 10]} />
            {fabricMat}
          </mesh>
          {/* 3/4 sleeves */}
          <mesh position={[-(SW + 0.054), TH - 0.10, 0.020]} rotation={[0.10, 0, 0.25]}>
            <cylinderGeometry args={[0.080, 0.068, 0.390, 16]} />
            {sleeveMat}
          </mesh>
          <mesh position={[ SW + 0.054,  TH - 0.10, 0.020]} rotation={[0.10, 0, -0.25]}>
            <cylinderGeometry args={[0.080, 0.068, 0.390, 16]} />
            {sleeveMat}
          </mesh>
        </>
      )}

      {/* ─── SAREE / CO-ORDS ──────────────────────────────────────────────── */}
      {(type === 'saree' || type === 'coords') && (
        <>
          {/* Bodice */}
          <mesh position={[0, TH * 0.74, SW * 0.18]}>
            <planeGeometry args={[SW * 2.08, TH * 0.48, 8, 8]} />
            {fabricMat}
          </mesh>
          {/* Drape / pallu — diagonal sash */}
          <mesh position={[SW * 0.45, TH * 0.60, 0.090]} rotation={[0.12, 0.08, 0.55]}>
            <planeGeometry args={[0.30, 0.82]} />
            {fabricMatDouble}
          </mesh>
          {/* Skirt */}
          <mesh position={[0, TH * 0.49 - 0.44 * lS, 0]}>
            <cylinderGeometry args={[HW * 1.10, HW * 1.30, 0.88 * lS, 36, 1, true]} />
            {fabricMatDouble}
          </mesh>
        </>
      )}
    </group>
  );
}

export function AvatarGarment(props) {
  return (
    <Suspense fallback={null}>
      <GarmentInner {...props} />
    </Suspense>
  );
}

// ─── Fit ring ─────────────────────────────────────────────────────────────────
function FitRing({ fitColor }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current)
      ref.current.material.emissiveIntensity = 1.3 + Math.sin(clock.getElapsedTime() * 3) * 0.7;
  });
  return (
    <mesh ref={ref} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.30, 0.007, 8, 72]} />
      <meshStandardMaterial color={fitColor} emissive={fitColor} emissiveIntensity={2} />
    </mesh>
  );
}

// ─── Full Canvas scene ────────────────────────────────────────────────────────
export function Avatar3DScene({
  product,
  measurements,
  fitType    = 'perfect',
  skinColor  = '#c8956c',
  fitColor   = '#00c864',
  showGrid   = true,
  autoRotate = false,
}) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, outputColorSpace: THREE.SRGBColorSpace, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      camera={{ position: [0, 0.22, 3.1], fov: 40 }}
      style={{ background: '#08080f' }}
    >
      {/* ── Lighting ── */}
      <ambientLight intensity={0.50} />
      <directionalLight position={[3, 6, 4]}   intensity={1.40} castShadow shadow-mapSize={1024} />
      <directionalLight position={[-4, 3, -2]} intensity={0.38} color="#b0c8ff" />
      <pointLight      position={[-2, 2, 2.5]} intensity={0.65} color="#7c6aff" />
      <pointLight      position={[ 2,-1, 2.5]} intensity={0.40} color="#ff6a9a" />
      <pointLight      position={[ 0, 4, 1]}   intensity={0.30} color="#fff5e0" />

      {/* ── Floor grid ── */}
      {showGrid && (
        <Grid
          position={[0, -1.08, 0]}
          args={[10, 10]}
          cellSize={0.4}
          cellThickness={0.4}
          cellColor="#1c1c2e"
          sectionSize={2}
          sectionThickness={0.8}
          sectionColor="#2e2e4e"
          fadeDistance={7}
          infiniteGrid
        />
      )}

      {/* ── Avatar ── */}
      <AvatarBody measurements={measurements} skinColor={skinColor} />

      {/* ── Garment ── */}
      {product && (
        <AvatarGarment product={product} measurements={measurements} fitType={fitType} />
      )}

      {/* ── Fit ring ── */}
      {product && <FitRing fitColor={fitColor} />}

      {/* ── Controls ── */}
      <OrbitControls
        enablePan={false}
        minDistance={1.5}
        maxDistance={5.5}
        minPolarAngle={Math.PI * 0.06}
        maxPolarAngle={Math.PI * 0.88}
        enableDamping
        dampingFactor={0.07}
        autoRotate={autoRotate}
        autoRotateSpeed={0.9}
      />

      <Environment preset="city" />
    </Canvas>
  );
}
