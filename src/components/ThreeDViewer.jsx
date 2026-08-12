import React, { useRef, useMemo, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useDesignStore } from '../store/designStore';

// ── Scale: 100 canvas-px = 1 THREE unit ≈ 1 metre ────────────
const SC     = 0.01;
const WALL_H = 2.8;
const WALL_T = 0.14;
const FL_T   = 0.06;

// ── Material presets ──────────────────────────────────────────
const FLOOR_COLS = {
  living:    '#c8a87a',
  kitchen:   '#d4c4a0',
  bedroom:   '#c0a890',
  bathroom:  '#9ec4d8',
  hallway:   '#c4bc9e',
  dining:    '#c0a070',
  study:     '#b8b090',
  gym:       '#b0b8c0',
  cinema:    '#3a3a4a',
  default:   '#c4a882',
};

const WALL_COL = '#f4f0eb';

// ── Helpers ───────────────────────────────────────────────────
function Box({ pos, size, color, roughness = 0.75, metalness = 0.02, opacity = 1, castShadow = true, receiveShadow = true }) {
  return (
    <mesh position={pos} castShadow={castShadow} receiveShadow={receiveShadow}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness}
        transparent={opacity < 1} opacity={opacity} />
    </mesh>
  );
}

// ── Plant ─────────────────────────────────────────────────────
function Plant({ pos, scale = 1 }) {
  return (
    <group position={pos} scale={scale}>
      <mesh position={[0, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.06, 0.36, 7]} />
        <meshStandardMaterial color="#7a5c48" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.52, 0]} castShadow>
        <sphereGeometry args={[0.24, 8, 6]} />
        <meshStandardMaterial color="#3a8040" roughness={0.9} />
      </mesh>
      <mesh position={[0.12, 0.66, 0.08]} castShadow>
        <sphereGeometry args={[0.16, 6, 5]} />
        <meshStandardMaterial color="#2e7236" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ── Bed ───────────────────────────────────────────────────────
function Bed({ pos, size, bedColor = '#d4c0a8', pillowColor = '#f0ece6' }) {
  const [bw, , bd] = size;
  return (
    <group position={pos}>
      {/* Frame */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[bw, 0.3, bd]} />
        <meshStandardMaterial color="#8b6040" roughness={0.7} />
      </mesh>
      {/* Mattress */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[bw - 0.04, 0.18, bd - 0.04]} />
        <meshStandardMaterial color={bedColor} roughness={0.85} />
      </mesh>
      {/* Pillow 1 */}
      <mesh position={[-bw * 0.18, 0.34, -bd * 0.3]} castShadow>
        <boxGeometry args={[bw * 0.35, 0.1, 0.22]} />
        <meshStandardMaterial color={pillowColor} roughness={0.9} />
      </mesh>
      {/* Pillow 2 */}
      <mesh position={[bw * 0.18, 0.34, -bd * 0.3]} castShadow>
        <boxGeometry args={[bw * 0.35, 0.1, 0.22]} />
        <meshStandardMaterial color={pillowColor} roughness={0.9} />
      </mesh>
      {/* Headboard */}
      <mesh position={[0, 0.7, -bd * 0.48]} castShadow>
        <boxGeometry args={[bw, 1.0, 0.08]} />
        <meshStandardMaterial color="#6b4830" roughness={0.65} />
      </mesh>
      {/* Blanket */}
      <mesh position={[0, 0.33, bd * 0.1]} castShadow>
        <boxGeometry args={[bw - 0.06, 0.06, bd * 0.55]} />
        <meshStandardMaterial color="#c4b4a0" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ── Sofa ──────────────────────────────────────────────────────
function Sofa({ pos, w, d, color = '#8a9caa' }) {
  return (
    <group position={pos}>
      {/* Base */}
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.44, d]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Back */}
      <mesh position={[0, 0.62, -d * 0.4]} castShadow>
        <boxGeometry args={[w, 0.55, d * 0.18]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Left arm */}
      <mesh position={[-w * 0.47, 0.48, 0]} castShadow>
        <boxGeometry args={[d * 0.18, 0.32, d]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Right arm */}
      <mesh position={[w * 0.47, 0.48, 0]} castShadow>
        <boxGeometry args={[d * 0.18, 0.32, d]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Cushions */}
      {[-w * 0.24, w * 0.24].map((cx, i) => (
        <mesh key={i} position={[cx, 0.52, 0.04]} castShadow>
          <boxGeometry args={[w * 0.42, 0.18, d * 0.7]} />
          <meshStandardMaterial color="#9aaebb" roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

// ── Furniture by room type ─────────────────────────────────────
function RoomContents({ room, cx, cz, rw, rd }) {
  const t = room.type || 'default';

  if (t === 'living') return (
    <group>
      <Sofa pos={[cx, 0, cz + rd * 0.25]} w={rw * 0.58} d={rd * 0.2} color="#8090a0" />
      {/* Coffee table */}
      <Box pos={[cx, 0.2, cz + rd * 0.04]} size={[rw * 0.28, 0.4, rd * 0.15]} color="#6b4c2a" roughness={0.55} />
      {/* TV console */}
      <Box pos={[cx, 0.2, cz - rd * 0.32]} size={[rw * 0.48, 0.4, rd * 0.1]} color="#3c3020" roughness={0.6} />
      {/* TV screen */}
      <Box pos={[cx, 0.75, cz - rd * 0.33]} size={[rw * 0.42, 0.5, 0.04]} color="#101010" roughness={0.05} metalness={0.2} />
      <Plant pos={[cx - rw * 0.38, 0, cz - rd * 0.32]} />
      <Plant pos={[cx + rw * 0.38, 0, cz + rd * 0.36]} scale={0.8} />
    </group>
  );

  if (t === 'bedroom') return (
    <group>
      <Bed pos={[cx - rw * 0.08, 0, cz + rd * 0.08]} size={[rw * 0.55, 0.5, rd * 0.58]} />
      {/* Nightstand */}
      <Box pos={[cx + rw * 0.32, 0.2, cz + rd * 0.08]} size={[rw * 0.12, 0.4, rd * 0.12]} color="#7a5c3a" />
      {/* Wardrobe */}
      <Box pos={[cx - rw * 0.34, 1.0, cz - rd * 0.38]} size={[rw * 0.28, 2.0, rd * 0.14]} color="#8a6040" roughness={0.6} />
      {/* Desk/dresser */}
      <Box pos={[cx + rw * 0.3, 0.4, cz - rd * 0.38]} size={[rw * 0.3, 0.8, rd * 0.14]} color="#7a5c3a" />
      <Plant pos={[cx + rw * 0.36, 0, cz + rd * 0.38]} scale={0.75} />
    </group>
  );

  if (t === 'kitchen') return (
    <group>
      {/* Counter along north wall */}
      <Box pos={[cx, 0.45, cz - rd * 0.4]} size={[rw * 0.8, 0.9, rd * 0.14]} color="#d0c8b8" roughness={0.4} />
      {/* Upper cabinets */}
      <Box pos={[cx, 1.8, cz - rd * 0.42]} size={[rw * 0.7, 0.7, rd * 0.1]} color="#c8c0b0" roughness={0.5} />
      {/* Island */}
      <Box pos={[cx, 0.45, cz + rd * 0.1]} size={[rw * 0.38, 0.9, rd * 0.22]} color="#d8d0c0" roughness={0.4} />
      {/* Sink area */}
      <Box pos={[cx, 0.88, cz - rd * 0.4]} size={[rw * 0.2, 0.06, rd * 0.14]} color="#8899aa" roughness={0.2} metalness={0.5} />
      <Plant pos={[cx - rw * 0.3, 0, cz + rd * 0.38]} scale={0.7} />
    </group>
  );

  if (t === 'bathroom') return (
    <group>
      {/* Bathtub */}
      <Box pos={[cx - rw * 0.18, 0.22, cz + rd * 0.18]} size={[rw * 0.38, 0.44, rd * 0.45]} color="#e0eef8" roughness={0.15} metalness={0.05} />
      {/* Inside of tub */}
      <Box pos={[cx - rw * 0.18, 0.32, cz + rd * 0.18]} size={[rw * 0.3, 0.2, rd * 0.36]} color="#c8e0f0" roughness={0.1} />
      {/* Vanity */}
      <Box pos={[cx + rw * 0.2, 0.44, cz - rd * 0.35]} size={[rw * 0.35, 0.88, rd * 0.16]} color="#d8d0c4" roughness={0.5} />
      {/* Mirror */}
      <Box pos={[cx + rw * 0.2, 1.3, cz - rd * 0.43]} size={[rw * 0.28, 0.6, 0.03]} color="#c0d8e8" roughness={0.05} metalness={0.3} opacity={0.7} />
      {/* Toilet */}
      <Box pos={[cx - rw * 0.2, 0.2, cz - rd * 0.35]} size={[rw * 0.18, 0.4, rd * 0.2]} color="#eef4f8" roughness={0.2} />
    </group>
  );

  if (t === 'hallway' || t === 'dining') return (
    <group>
      {t === 'dining' && <>
        {/* Dining table */}
        <Box pos={[cx, 0.38, cz]} size={[rw * 0.52, 0.76, rd * 0.5]} color="#7a5c36" roughness={0.55} />
        {/* Chairs */}
        {[[-rw*0.3,0,0],[rw*0.3,0,0],[0,0,-rd*0.28],[0,0,rd*0.28]].map((offset, i) => (
          <Box key={i} pos={[cx+offset[0], 0.22, cz+offset[2]]} size={[0.42, 0.44, 0.42]} color="#6b4c28" roughness={0.7} />
        ))}
      </>}
      <Plant pos={[cx - rw * 0.35, 0, cz - rd * 0.35]} />
    </group>
  );

  // Generic / other rooms
  return (
    <group>
      <Plant pos={[cx - rw * 0.38, 0, cz - rd * 0.38]} scale={0.7} />
    </group>
  );
}

// ── Window mesh (transparent glass + frame) ───────────────────
function WindowMesh({ pos, size, isHorizontal }) {
  const [fw, fh, fd] = size;
  return (
    <group position={pos}>
      {/* Frame */}
      <mesh castShadow>
        <boxGeometry args={[fw, fh, fd]} />
        <meshStandardMaterial color="#9aa8b0" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Glass */}
      <mesh>
        <boxGeometry args={[fw * 0.85, fh * 0.8, fd * 2]} />
        <meshStandardMaterial color="#a8d0e8" roughness={0.05} metalness={0.1} transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

// ── Door mesh ─────────────────────────────────────────────────
function DoorMesh({ pos, size }) {
  const [dw, dh, dd] = size;
  return (
    <group position={pos}>
      {/* Frame */}
      <mesh castShadow>
        <boxGeometry args={[dw, dh, dd]} />
        <meshStandardMaterial color="#7a5c3a" roughness={0.65} />
      </mesh>
      {/* Knob */}
      <mesh position={[dw * 0.35, 0, dd * 0.8]} castShadow>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial color="#c8a840" roughness={0.2} metalness={0.8} />
      </mesh>
    </group>
  );
}

// ── Individual room ───────────────────────────────────────────
function Room({ room, allDoors, allWindows }) {
  const x  = room.x * SC;
  const z  = room.y * SC;
  const rw = room.width  * SC;
  const rd = room.height * SC;
  const cx = x + rw / 2;
  const cz = z + rd / 2;
  const fc = FLOOR_COLS[room.type] || FLOOR_COLS.default;

  const doors   = allDoors.filter(d => d.roomId === room.id);
  const windows = allWindows.filter(w => w.roomId === room.id);

  return (
    <group>
      {/* ── Floor ── */}
      <mesh position={[cx, FL_T / 2, cz]} receiveShadow>
        <boxGeometry args={[rw, FL_T, rd]} />
        <meshStandardMaterial color={fc} roughness={0.28} metalness={0.01}/>
      </mesh>

      {/* Floor border / skirting */}
      <mesh position={[cx, FL_T / 2, cz]} receiveShadow>
        <boxGeometry args={[rw + 0.01, FL_T + 0.01, rd + 0.01]} />
        <meshStandardMaterial color="#a08060" roughness={0.6} wireframe />
      </mesh>

      {/* ── Walls (4 sides, with door/window cutouts approximated) ── */}
      {/* North wall */}
      {buildWallSegments(cx, cz, rw, rd, 'north', doors, windows).map((seg, i) => (
        <mesh key={`n${i}`} position={seg.pos} castShadow receiveShadow>
          <boxGeometry args={seg.size} />
          <meshStandardMaterial color={WALL_COL} roughness={0.92} />
        </mesh>
      ))}
      {/* South wall */}
      {buildWallSegments(cx, cz, rw, rd, 'south', doors, windows).map((seg, i) => (
        <mesh key={`s${i}`} position={seg.pos} castShadow receiveShadow>
          <boxGeometry args={seg.size} />
          <meshStandardMaterial color="#eee9e3" roughness={0.92} />
        </mesh>
      ))}
      {/* West wall */}
      {buildWallSegments(cx, cz, rw, rd, 'west', doors, windows).map((seg, i) => (
        <mesh key={`w${i}`} position={seg.pos} castShadow receiveShadow>
          <boxGeometry args={seg.size} />
          <meshStandardMaterial color="#ede8e2" roughness={0.92} />
        </mesh>
      ))}
      {/* East wall */}
      {buildWallSegments(cx, cz, rw, rd, 'east', doors, windows).map((seg, i) => (
        <mesh key={`e${i}`} position={seg.pos} castShadow receiveShadow>
          <boxGeometry args={seg.size} />
          <meshStandardMaterial color="#ece7e1" roughness={0.92} />
        </mesh>
      ))}

      {/* ── Door meshes ── */}
      {doors.map((door, i) => {
        const info = getDoorPos(x, z, rw, rd, door);
        return <DoorMesh key={i} pos={info.pos} size={info.size} />;
      })}

      {/* ── Window meshes ── */}
      {windows.map((win, i) => {
        const info = getWindowPos(x, z, rw, rd, win);
        return <WindowMesh key={i} pos={info.pos} size={info.size} />;
      })}

      {/* ── Interior warm light ── */}
      <pointLight
        position={[cx, WALL_H - 0.5, cz]}
        intensity={1.2}
        color="#ffe8b0"
        distance={Math.max(rw, rd) * 2.2}
        decay={2}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
      />

      {/* ── Furniture ── */}
      <RoomContents room={room} cx={cx} cz={cz} rw={rw} rd={rd} />
    </group>
  );
}

// ── Geometry helpers for wall segments ───────────────────────
function buildWallSegments(cx, cz, rw, rd, side, doors, windows) {
  const h = WALL_H;
  const t = WALL_T;
  const segs = [];

  // For simplicity: render full walls. Cutouts are visual-only (doors/windows render on top)
  if (side === 'north') segs.push({ pos: [cx, h/2, cz - rd/2 + t/2], size: [rw, h, t] });
  if (side === 'south') segs.push({ pos: [cx, h/2, cz + rd/2 - t/2], size: [rw, h, t] });
  if (side === 'west')  segs.push({ pos: [cx - rw/2 + t/2, h/2, cz], size: [t, h, rd] });
  if (side === 'east')  segs.push({ pos: [cx + rw/2 - t/2, h/2, cz], size: [t, h, rd] });

  return segs;
}

function getDoorPos(x, z, rw, rd, door) {
  const dw = door.width * SC;
  const dh = 2.2;
  const t  = WALL_T;
  const p  = door.position;

  switch (door.wall) {
    case 'top':    return { pos: [x + rw * p, dh/2, z + t/2],      size: [dw, dh, t * 1.1] };
    case 'bottom': return { pos: [x + rw * p, dh/2, z + rd - t/2], size: [dw, dh, t * 1.1] };
    case 'left':   return { pos: [x + t/2, dh/2, z + rd * p],      size: [t * 1.1, dh, dw] };
    case 'right':  return { pos: [x + rw - t/2, dh/2, z + rd * p], size: [t * 1.1, dh, dw] };
    default:       return { pos: [0,0,0], size: [0.01,0.01,0.01] };
  }
}

function getWindowPos(x, z, rw, rd, win) {
  const ww = win.width * SC;
  const wh = 1.1;
  const wy = 1.1; // window height from floor
  const t  = WALL_T;
  const p  = win.position;

  switch (win.wall) {
    case 'top':    return { pos: [x + rw * p, wy + wh/2, z + t/2],      size: [ww, wh, t * 1.2] };
    case 'bottom': return { pos: [x + rw * p, wy + wh/2, z + rd - t/2], size: [ww, wh, t * 1.2] };
    case 'left':   return { pos: [x + t/2, wy + wh/2, z + rd * p],      size: [t * 1.2, wh, ww] };
    case 'right':  return { pos: [x + rw - t/2, wy + wh/2, z + rd * p], size: [t * 1.2, wh, ww] };
    default:       return { pos: [0,0,0], size: [0.01,0.01,0.01] };
  }
}

// ── Entire scene ──────────────────────────────────────────────
function Scene({ showRoof, timeOfDay }) {
  const { rooms, doors, windows, activeFloor } = useDesignStore();
  const vis = rooms.filter(r => r.floor === activeFloor);

  const { center, extent } = useMemo(() => {
    if (!vis.length) return { center: [0, 0, 0], extent: 5 };
    const minX = Math.min(...vis.map(r => r.x)) * SC;
    const maxX = Math.max(...vis.map(r => r.x + r.width))  * SC;
    const minZ = Math.min(...vis.map(r => r.y)) * SC;
    const maxZ = Math.max(...vis.map(r => r.y + r.height)) * SC;
    return {
      center: [(minX + maxX) / 2, 0, (minZ + maxZ) / 2],
      extent: Math.max(maxX - minX, maxZ - minZ),
    };
  }, [vis]);

  const sunIntensity = 0.4 + timeOfDay * 1.2;
  const sunColor     = timeOfDay > 0.6 ? '#fff8f0' : timeOfDay > 0.3 ? '#ffd090' : '#c08060';
  const ambColor     = '#fff4e8';

  return (
    <>
      {/* ── Lighting ── */}
      <ambientLight intensity={0.55} color={ambColor} />
      <directionalLight
        position={[center[0] + 12, 16, center[2] + 8]}
        intensity={sunIntensity}
        color={sunColor}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.001}
      />
      {/* Fill light from opposite side */}
      <directionalLight position={[center[0] - 8, 6, center[2] - 6]} intensity={0.25} color="#d0e4ff" />
      {/* Hemisphere */}
      <hemisphereLight skyColor="#fff8f0" groundColor="#806040" intensity={0.3} />

      {/* ── Ground plane ── */}
      <mesh position={[center[0], -0.01, center[2]]} receiveShadow>
        <boxGeometry args={[extent * 3, 0.02, extent * 3]} />
        <meshStandardMaterial color="#a8a098" roughness={0.95} />
      </mesh>

      {/* ── Exterior grass border ── */}
      <mesh position={[center[0], -0.02, center[2]]} receiveShadow>
        <boxGeometry args={[extent * 2.5, 0.015, extent * 2.5]} />
        <meshStandardMaterial color="#6a8a5a" roughness={0.98} />
      </mesh>

      {/* ── Rooms ── */}
      {vis.map(room => (
        <Room
          key={room.id}
          room={room}
          allDoors={doors}
          allWindows={windows}
        />
      ))}

      {/* ── Roof slabs (optional, translucent when shown) ── */}
      {!showRoof && vis.map(room => {
        const x = room.x * SC, z = room.y * SC;
        const rw = room.width * SC, rd = room.height * SC;
        return (
          <mesh key={`roof-${room.id}`} position={[x + rw/2, WALL_H + 0.04, z + rd/2]}>
            <boxGeometry args={[rw, 0.08, rd]} />
            <meshStandardMaterial color="#d8d4cc" roughness={0.85} transparent opacity={0.6} />
          </mesh>
        );
      })}
    </>
  );
}

// ── Camera auto-position ──────────────────────────────────────
function AutoCamera({ rooms, activeFloor }) {
  const vis = rooms.filter(r => r.floor === activeFloor);
  const { center, extent } = useMemo(() => {
    if (!vis.length) return { center: [0, 0, 0], extent: 6 };
    const minX = Math.min(...vis.map(r => r.x)) * SC;
    const maxX = Math.max(...vis.map(r => r.x + r.width))  * SC;
    const minZ = Math.min(...vis.map(r => r.y)) * SC;
    const maxZ = Math.max(...vis.map(r => r.y + r.height)) * SC;
    return { center: [(minX+maxX)/2, 0, (minZ+maxZ)/2], extent: Math.max(maxX-minX, maxZ-minZ) };
  }, [vis]);

  const dist = extent * 1.4;
  const camPos = [center[0] + dist, dist * 1.1, center[2] + dist];

  return (
    <>
      <PerspectiveCamera makeDefault position={camPos} fov={42} near={0.1} far={150} />
      <OrbitControls
        target={center}
        enableDamping
        dampingFactor={0.06}
        minDistance={2}
        maxDistance={40}
        maxPolarAngle={Math.PI / 2.05}
        enablePan
        panSpeed={0.8}
        rotateSpeed={0.7}
        zoomSpeed={1.2}
      />
    </>
  );
}

// ── Main export ───────────────────────────────────────────────
export default function ThreeDViewer() {
  const [showRoof,  setShowRoof]  = useState(true);   // open by default so interiors visible
  const [timeOfDay, setTimeOfDay] = useState(0.75);
  const { rooms, activeFloor } = useDesignStore();

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#1a2030' }}>
      <Canvas
        shadows={{ type: 'PCFSoftShadowMap' }}
        gl={{ antialias: true, toneMapping: 3 /* ACESFilmicToneMapping */ , toneMappingExposure: 1.15 }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <AutoCamera rooms={rooms} activeFloor={activeFloor} />
          <Scene showRoof={showRoof} timeOfDay={timeOfDay} />
        </Suspense>
      </Canvas>

      {/* ── Overlay controls ── */}
      <div style={{
        position: 'absolute', top: 16, left: 16,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <button
          onClick={() => setShowRoof(r => !r)}
          style={{
            background: 'rgba(10,14,20,0.75)', backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
            padding: '8px 14px', color: '#e6edf3', fontSize: 12, fontWeight: 500,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          {showRoof ? '⊡ Close Roof View' : '🏠 Open Roof (Interior View)'}
        </button>

        {/* Time slider */}
        <div style={{
          background: 'rgba(10,14,20,0.75)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
          padding: '10px 14px',
        }}>
          <div style={{ fontSize: 10, color: '#8b949e', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 6 }}>
            TIME OF DAY
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 15 }}>🌙</span>
            <input
              type="range" min="0" max="1" step="0.01"
              value={timeOfDay}
              onChange={e => setTimeOfDay(+e.target.value)}
              style={{ width: 90, accentColor: '#4f8ef7' }}
            />
            <span style={{ fontSize: 15 }}>☀️</span>
          </div>
        </div>
      </div>

      {/* Bottom hint */}
      <div style={{
        position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(10,14,20,0.75)', backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 99,
        padding: '6px 20px', fontSize: 11, color: '#8b949e', whiteSpace: 'nowrap',
      }}>
        🖱 Left drag to rotate · Right drag / two-finger to pan · Scroll to zoom
      </div>
    </div>
  );
}
