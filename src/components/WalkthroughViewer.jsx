import React, { useRef, useState, useEffect, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import { useDesignStore } from '../store/designStore';

const SC      = 0.01;
const WALL_H  = 2.8;
const WALL_T  = 0.14;
const EYE_H   = 1.65;
const SPEED   = 3.8;
const CAM_DIST = 2.6;   // third-person camera distance behind character
const CAM_H   = 1.6;    // camera height above character feet

const FLOOR_COLS = {
  living: '#c8a87a', kitchen: '#d4c0a0', bedroom: '#c0a890',
  bathroom: '#9ec4d8', hallway: '#c4bc9e', dining: '#c0a070', default: '#c4a882',
};

// ── Walking character (simple low-poly humanoid) ─────────────
function WalkingCharacter({ posRef, yawRef, isMovingRef }) {
  const groupRef  = useRef();
  const legLRef   = useRef();
  const legRRef   = useRef();
  const armLRef   = useRef();
  const armRRef   = useRef();
  const bobRef    = useRef();
  const timeRef   = useRef(0);

  useFrame((_, dt) => {
    const moving = isMovingRef.current;
    if (moving) timeRef.current += dt * 5;
    const swing = Math.sin(timeRef.current) * (moving ? 0.45 : 0);
    const bob   = Math.abs(Math.sin(timeRef.current)) * (moving ? 0.04 : 0);

    // Update group position & yaw from refs
    if (groupRef.current) {
      groupRef.current.position.set(posRef.current.x, 0, posRef.current.z);
      groupRef.current.rotation.y = yawRef.current;
    }
    // Bob body up/down
    if (bobRef.current)  bobRef.current.position.y  = bob;
    // Swing legs
    if (legLRef.current) legLRef.current.rotation.x = swing;
    if (legRRef.current) legRRef.current.rotation.x = -swing;
    // Swing arms opposite
    if (armLRef.current) armLRef.current.rotation.x = -swing * 0.6;
    if (armRRef.current) armRRef.current.rotation.x =  swing * 0.6;
  });

  // Skin / clothing colors
  const skin  = '#f4c8a0';
  const shirt = '#3a6ab0';
  const pants = '#2a3860';
  const shoe  = '#201810';
  const hair  = '#3a2010';

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <group ref={bobRef}>
        {/* ── Head ── */}
        <mesh position={[0, 1.75, 0]} castShadow>
          <sphereGeometry args={[0.145, 9, 7]} />
          <meshStandardMaterial color={skin} roughness={0.65} />
        </mesh>
        {/* Hair */}
        <mesh position={[0, 1.87, 0]} castShadow>
          <sphereGeometry args={[0.15, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshStandardMaterial color={hair} roughness={0.9} />
        </mesh>
        {/* Eyes */}
        <mesh position={[-0.055, 1.76, 0.13]} castShadow>
          <sphereGeometry args={[0.022, 5, 4]} />
          <meshStandardMaterial color="#1a1a2a" />
        </mesh>
        <mesh position={[0.055, 1.76, 0.13]} castShadow>
          <sphereGeometry args={[0.022, 5, 4]} />
          <meshStandardMaterial color="#1a1a2a" />
        </mesh>
        {/* Neck */}
        <mesh position={[0, 1.57, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.065, 0.14, 7]} />
          <meshStandardMaterial color={skin} roughness={0.65} />
        </mesh>

        {/* ── Torso ── */}
        <mesh position={[0, 1.24, 0]} castShadow>
          <boxGeometry args={[0.34, 0.52, 0.2]} />
          <meshStandardMaterial color={shirt} roughness={0.75} />
        </mesh>
        {/* Belt */}
        <mesh position={[0, 0.96, 0]} castShadow>
          <boxGeometry args={[0.34, 0.06, 0.2]} />
          <meshStandardMaterial color="#1a1210" roughness={0.6} metalness={0.3} />
        </mesh>

        {/* ── Left Arm ── */}
        <group position={[-0.22, 1.3, 0]} ref={armLRef}>
          <mesh position={[0, -0.14, 0]} castShadow>
            <capsuleGeometry args={[0.055, 0.28, 4, 6]} />
            <meshStandardMaterial color={shirt} roughness={0.75} />
          </mesh>
          {/* Hand */}
          <mesh position={[0, -0.33, 0]} castShadow>
            <sphereGeometry args={[0.055, 6, 5]} />
            <meshStandardMaterial color={skin} roughness={0.65} />
          </mesh>
        </group>

        {/* ── Right Arm ── */}
        <group position={[0.22, 1.3, 0]} ref={armRRef}>
          <mesh position={[0, -0.14, 0]} castShadow>
            <capsuleGeometry args={[0.055, 0.28, 4, 6]} />
            <meshStandardMaterial color={shirt} roughness={0.75} />
          </mesh>
          <mesh position={[0, -0.33, 0]} castShadow>
            <sphereGeometry args={[0.055, 6, 5]} />
            <meshStandardMaterial color={skin} roughness={0.65} />
          </mesh>
        </group>

        {/* ── Left Leg ── */}
        <group position={[-0.1, 0.92, 0]} ref={legLRef}>
          <mesh position={[0, -0.24, 0]} castShadow>
            <capsuleGeometry args={[0.068, 0.44, 4, 6]} />
            <meshStandardMaterial color={pants} roughness={0.8} />
          </mesh>
          {/* Left Shoe */}
          <mesh position={[0, -0.52, 0.06]} castShadow>
            <boxGeometry args={[0.14, 0.09, 0.24]} />
            <meshStandardMaterial color={shoe} roughness={0.6} />
          </mesh>
        </group>

        {/* ── Right Leg ── */}
        <group position={[0.1, 0.92, 0]} ref={legRRef}>
          <mesh position={[0, -0.24, 0]} castShadow>
            <capsuleGeometry args={[0.068, 0.44, 4, 6]} />
            <meshStandardMaterial color={pants} roughness={0.8} />
          </mesh>
          {/* Right Shoe */}
          <mesh position={[0, -0.52, 0.06]} castShadow>
            <boxGeometry args={[0.14, 0.09, 0.24]} />
            <meshStandardMaterial color={shoe} roughness={0.6} />
          </mesh>
        </group>

        {/* Shadow blob under feet */}
        <mesh position={[0, 0.01, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.25, 12]} />
          <meshStandardMaterial color="#000000" transparent opacity={0.15} />
        </mesh>
      </group>
    </group>
  );
}

// ── Third-person camera controller ───────────────────────────
function ThirdPersonCamera({ posRef, yawRef }) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3());
  const camPos    = useRef(new THREE.Vector3());

  useFrame(() => {
    const px = posRef.current.x;
    const pz = posRef.current.z;
    const yaw = yawRef.current;

    // Camera position: behind and above the character
    const behindX = px - Math.sin(yaw) * CAM_DIST;
    const behindZ = pz - Math.cos(yaw) * CAM_DIST;

    camPos.current.set(behindX, CAM_H + 0.4, behindZ);
    camera.position.lerp(camPos.current, 0.12);

    // Look at character chest level
    targetPos.current.set(px, 1.1, pz);
    camera.lookAt(targetPos.current);
  });

  return null;
}

// ── Player physics / input ────────────────────────────────────
function PlayerController({ posRef, yawRef, isMovingRef, rooms, onRoomChange }) {
  const { camera } = useThree();
  const keys = useRef({});
  const mouseXRef = useRef(0);
  const isPointerLocked = useRef(false);

  const activeFloor = useDesignStore.getState().activeFloor;
  const vis = rooms.filter(r => r.floor === activeFloor);

  // Initial position — center of first room
  useEffect(() => {
    if (vis.length) {
      const r = vis[0];
      posRef.current = {
        x: (r.x + r.width  * 0.5) * SC,
        z: (r.y + r.height * 0.5) * SC,
      };
    }
  }, []);

  // Keyboard
  useEffect(() => {
    const kd = e => { keys.current[e.code] = true; };
    const ku = e => { keys.current[e.code] = false; };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup',   ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, []);

  // Mouse look (pointer lock)
  useEffect(() => {
    const onMove = e => {
      if (document.pointerLockElement) {
        yawRef.current -= e.movementX * 0.003;
      }
    };
    const onLock = () => { isPointerLocked.current = !!document.pointerLockElement; };
    document.addEventListener('mousemove',       onMove);
    document.addEventListener('pointerlockchange', onLock);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('pointerlockchange', onLock);
    };
  }, []);

  const fwd   = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const move  = useRef(new THREE.Vector3());

  useFrame((_, dt) => {
    const k = keys.current;
    const yaw = yawRef.current;
    const sp  = SPEED * dt;

    fwd.current.set(Math.sin(yaw), 0, Math.cos(yaw));
    right.current.set(Math.cos(yaw), 0, -Math.sin(yaw));
    move.current.set(0, 0, 0);

    const moveF = k['KeyW'] || k['ArrowUp']    ? 1 : k['KeyS'] || k['ArrowDown']  ? -1 : 0;
    const moveR = k['KeyD'] || k['ArrowRight']  ? 1 : k['KeyA'] || k['ArrowLeft'] ? -1 : 0;

    if (moveF !== 0) move.current.addScaledVector(fwd.current,   moveF * sp);
    if (moveR !== 0) move.current.addScaledVector(right.current, moveR * sp * 0.7);

    const isMoving = move.current.lengthSq() > 0.00001;
    isMovingRef.current = isMoving;

    if (isMoving) {
      const candidatePos = {
        x: posRef.current.x + move.current.x,
        z: posRef.current.z + move.current.z,
      };

      // Capsule Wall Collision Prevention (radius: 0.28m)
      let nx = candidatePos.x;
      let nz = candidatePos.z;
      const R = 0.28;

      for (const r of vis) {
        const minX = r.x * SC;
        const maxX = (r.x + r.width) * SC;
        const minZ = r.y * SC;
        const maxZ = (r.y + r.height) * SC;

        if (nx >= minX - R && nx <= maxX + R && nz >= minZ - R && nz <= maxZ + R) {
          const dLeft   = Math.abs(nx - minX);
          const dRight  = Math.abs(nx - maxX);
          const dTop    = Math.abs(nz - minZ);
          const dBottom = Math.abs(nz - maxZ);
          const minD    = Math.min(dLeft, dRight, dTop, dBottom);

          if (minD === dLeft && dLeft < R) nx = minX - R;
          else if (minD === dRight && dRight < R) nx = maxX + R;
          else if (minD === dTop && dTop < R) nz = minZ - R;
          else if (minD === dBottom && dBottom < R) nz = maxZ + R;
        }
      }

      posRef.current = { x: nx, z: nz };
    }

    // Detect current room
    const wx = posRef.current.x / SC;
    const wz = posRef.current.z / SC;
    const inRoom = vis.find(r =>
      wx >= r.x + 8 && wx <= r.x + r.width  - 8 &&
      wz >= r.y + 8 && wz <= r.y + r.height - 8
    );
    if (inRoom) onRoomChange(inRoom.name);
  });

  return null;
}

// ── Room geometry (first-person interior) ────────────────────
function WalkthroughRoom({ room }) {
  const x  = room.x * SC;
  const z  = room.y * SC;
  const rw = room.width  * SC;
  const rd = room.height * SC;
  const cx = x + rw / 2;
  const cz = z + rd / 2;
  const fc = FLOOR_COLS[room.type] || FLOOR_COLS.default;

  return (
    <group>
      {/* Floor */}
      <mesh position={[cx, 0.025, cz]} receiveShadow>
        <boxGeometry args={[rw, 0.05, rd]} />
        <meshStandardMaterial color={fc} roughness={0.28} />
      </mesh>
      {/* Ceiling */}
      <mesh position={[cx, WALL_H, cz]}>
        <boxGeometry args={[rw + 0.02, 0.06, rd + 0.02]} />
        <meshStandardMaterial color="#f8f6f2" roughness={0.98} />
      </mesh>
      {/* Walls */}
      <mesh position={[cx, WALL_H/2, z + WALL_T/2]} receiveShadow castShadow>
        <boxGeometry args={[rw, WALL_H, WALL_T]} />
        <meshStandardMaterial color="#f2ede8" roughness={0.92} />
      </mesh>
      <mesh position={[cx, WALL_H/2, z + rd - WALL_T/2]} receiveShadow castShadow>
        <boxGeometry args={[rw, WALL_H, WALL_T]} />
        <meshStandardMaterial color="#ede9e4" roughness={0.92} />
      </mesh>
      <mesh position={[x + WALL_T/2, WALL_H/2, cz]} receiveShadow castShadow>
        <boxGeometry args={[WALL_T, WALL_H, rd]} />
        <meshStandardMaterial color="#ece8e3" roughness={0.92} />
      </mesh>
      <mesh position={[x + rw - WALL_T/2, WALL_H/2, cz]} receiveShadow castShadow>
        <boxGeometry args={[WALL_T, WALL_H, rd]} />
        <meshStandardMaterial color="#eae6e1" roughness={0.92} />
      </mesh>
      {/* Ceiling light */}
      <mesh position={[cx, WALL_H - 0.01, cz]}>
        <cylinderGeometry args={[0.2, 0.2, 0.04, 10]} />
        <meshStandardMaterial color="#f8f0d8" emissive="#ffe8a0" emissiveIntensity={1.5} />
      </mesh>
      <pointLight position={[cx, WALL_H - 0.3, cz]}
        intensity={1.6} color="#ffe090"
        distance={Math.max(rw, rd) * 2.5} decay={2} castShadow
        shadow-mapSize-width={512} shadow-mapSize-height={512}
      />
    </group>
  );
}

// ── Full scene ────────────────────────────────────────────────
function Scene({ posRef, yawRef, isMovingRef, onRoomChange }) {
  const { rooms, activeFloor } = useDesignStore();
  const vis = rooms.filter(r => r.floor === activeFloor);

  return (
    <>
      <ambientLight intensity={0.2} color="#fff8f0" />
      <directionalLight position={[8, 12, 8]} intensity={0.35} color="#fff5e0" castShadow />

      {vis.map(room => <WalkthroughRoom key={room.id} room={room} />)}

      <WalkingCharacter posRef={posRef} yawRef={yawRef} isMovingRef={isMovingRef} />
      <ThirdPersonCamera posRef={posRef} yawRef={yawRef} />
      <PlayerController
        posRef={posRef} yawRef={yawRef} isMovingRef={isMovingRef}
        rooms={rooms} onRoomChange={onRoomChange}
      />
    </>
  );
}

// ── Mini-map ──────────────────────────────────────────────────
function MiniMap({ rooms, activeFloor, posRef, yawRef }) {
  const [dotPos, setDotPos] = useState({ x: 60, y: 60 });
  const [yawDeg, setYawDeg] = useState(0);
  const rafRef = useRef();

  useEffect(() => {
    const tick = () => {
      const vis = rooms.filter(r => r.floor === activeFloor);
      if (!vis.length) { rafRef.current = requestAnimationFrame(tick); return; }

      const minX = Math.min(...vis.map(r => r.x)) * SC;
      const maxX = Math.max(...vis.map(r => r.x + r.width))  * SC;
      const minZ = Math.min(...vis.map(r => r.y)) * SC;
      const maxZ = Math.max(...vis.map(r => r.y + r.height)) * SC;
      const W = maxX - minX;
      const H = maxZ - minZ;
      const MAP = 108;
      const scX = MAP / W;
      const scZ = MAP / H;
      const sc  = Math.min(scX, scZ);

      const px = posRef.current?.x ?? 0;
      const pz = posRef.current?.z ?? 0;

      const dotX = 6 + (px - minX) * sc;
      const dotY = 6 + (pz - minZ) * sc;
      setDotPos({ x: Math.max(4, Math.min(116, dotX)), y: Math.max(4, Math.min(116, dotY)) });

      if (yawRef?.current !== undefined) {
        const deg = (yawRef.current * 180) / Math.PI;
        setYawDeg(deg);
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [rooms, activeFloor, posRef, yawRef]);

  const vis = rooms.filter(r => r.floor === activeFloor);
  if (!vis.length) return null;

  const minX = Math.min(...vis.map(r => r.x)) * SC;
  const maxX = Math.max(...vis.map(r => r.x + r.width))  * SC;
  const minZ = Math.min(...vis.map(r => r.y)) * SC;
  const maxZ = Math.max(...vis.map(r => r.y + r.height)) * SC;
  const W = maxX - minX; const H = maxZ - minZ;
  const MAP = 108; const sc = Math.min(MAP / W, MAP / H);

  return (
    <div style={{
      position: 'absolute', top: 16, right: 16,
      width: 120, height: 120,
      background: 'rgba(10,14,20,0.88)', backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12,
      overflow: 'hidden',
    }}>
      <svg width="120" height="120">
        {/* Rooms */}
        {vis.map(r => (
          <rect key={r.id}
            x={6 + (r.x * SC - minX) * sc}
            y={6 + (r.y * SC - minZ) * sc}
            width={r.width  * SC * sc}
            height={r.height * SC * sc}
            fill={FLOOR_COLS[r.type] || '#c4a882'}
            fillOpacity="0.65"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.7"
          />
        ))}
        {/* Player direction cone */}
        <polygon
          points={`${dotPos.x},${dotPos.y - 10} ${dotPos.x - 5},${dotPos.y + 3} ${dotPos.x + 5},${dotPos.y + 3}`}
          fill="#4f8ef7" opacity="0.95"
          transform={`rotate(${-yawDeg + 180}, ${dotPos.x}, ${dotPos.y})`}
        />
        {/* Player dot */}
        <circle cx={dotPos.x} cy={dotPos.y} r="4" fill="#4f8ef7" />
        <circle cx={dotPos.x} cy={dotPos.y} r="8" fill="none" stroke="#4f8ef7" strokeWidth="1" opacity="0.5" />
      </svg>
      <div style={{
        position: 'absolute', bottom: 3, width: '100%', textAlign: 'center',
        fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.07em',
      }}>
        MAP
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────
export default function WalkthroughViewer() {
  const [currentRoom, setCurrentRoom] = useState('—');
  const [started,     setStarted]     = useState(false);

  // Shared refs (written by PlayerController, read by ThirdPersonCamera + MiniMap)
  const posRef      = useRef({ x: 0, z: 0 });
  const yawRef      = useRef(Math.PI); // face inward
  const isMovingRef = useRef(false);

  const { rooms, activeFloor } = useDesignStore();

  const vis = rooms.filter(r => r.floor === activeFloor);
  const startPos = vis.length
    ? [(vis[0].x + vis[0].width  / 2) * SC + 1, CAM_H + 0.4, (vis[0].y + vis[0].height / 2) * SC + CAM_DIST]
    : [0, CAM_H, 3];

  const handleStart = () => {
    setStarted(true);
    // Request pointer lock when user clicks
    document.querySelector('canvas')?.requestPointerLock();
  };

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#0d1117' }}>
      <Canvas
        shadows={{ type: 'PCFSoftShadowMap' }}
        gl={{ antialias: true, toneMapping: 3, toneMappingExposure: 1.1 }}
        camera={{ position: startPos, fov: 65, near: 0.05, far: 120 }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <Scene
            posRef={posRef}
            yawRef={yawRef}
            isMovingRef={isMovingRef}
            onRoomChange={setCurrentRoom}
          />
        </Suspense>
      </Canvas>

      {/* Mini-map (reads posRef via RAF) */}
      <MiniMap rooms={rooms} activeFloor={activeFloor} posRef={posRef} />

      {/* Room HUD */}
      <div style={{
        position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(10,14,20,0.82)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16,
        padding: '10px 26px', textAlign: 'center', pointerEvents: 'none',
        minWidth: 260,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#e6edf3', marginBottom: 3 }}>
          📍 {currentRoom !== '—' ? currentRoom : 'Walking through…'}
        </div>
        <div style={{ fontSize: 11, color: '#8b949e' }}>
          <b style={{ color: '#c4a882' }}>W A S D</b> to walk &nbsp;·&nbsp;
          <b style={{ color: '#c4a882' }}>Mouse</b> to turn &nbsp;·&nbsp; Click to lock cursor
        </div>
      </div>

      {/* Crosshair */}
      {started && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }}>
          <svg width="28" height="28" viewBox="0 0 28 28">
            <line x1="14" y1="4"  x2="14" y2="10" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" />
            <line x1="14" y1="18" x2="14" y2="24" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" />
            <line x1="4"  y1="14" x2="10" y2="14" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" />
            <line x1="18" y1="14" x2="24" y2="14" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" />
            <circle cx="14" cy="14" r="1.8" fill="rgba(255,255,255,0.8)" />
          </svg>
        </div>
      )}

      {/* Start overlay */}
      {!started && (
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(10,14,20,0.9)', backdropFilter: 'blur(16px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 18, cursor: 'pointer',
          }}
          onClick={handleStart}
        >
          <div style={{ fontSize: 64, lineHeight: 1 }}>🚶‍♂️</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#e6edf3', letterSpacing: '-0.02em' }}>
            3D House Walkthrough
          </div>
          <div style={{ fontSize: 13, color: '#8b949e', textAlign: 'center', lineHeight: 1.85, maxWidth: 340 }}>
            Walk through your designed house in full 3D.<br />
            You'll see a <span style={{ color: '#c4a882', fontWeight: 600 }}>character walking</span> from a third-person view.<br />
            <span style={{ color: '#6e7681' }}>ESC releases mouse pointer</span>
          </div>
          <div style={{
            display: 'flex', gap: 24, fontSize: 12, color: '#8b949e',
            background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 24px',
          }}>
            <span>⬆⬇⬅➡ Move</span>
            <span>🖱 Mouse — Turn</span>
            <span>🗺 Mini-map — Track</span>
          </div>
          <div
            style={{
              padding: '12px 32px',
              background: 'linear-gradient(135deg, #4f8ef7, #7c5cfc)',
              borderRadius: 99, fontSize: 14, fontWeight: 700, color: '#fff',
              boxShadow: '0 0 32px rgba(79,142,247,0.45)',
              letterSpacing: '-0.01em',
            }}
          >
            ▶ Start Walkthrough
          </div>
        </div>
      )}
    </div>
  );
}
