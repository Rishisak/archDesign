/**
 * MiniThreeDPreview.jsx
 *
 * A lightweight, read-only live 3D preview of the current building design.
 * Used in the right panel's 3D view cards.  Shares the same scene-rendering
 * approach as ThreeDViewer but in a small, auto-rotating canvas.
 */

import React, { useMemo, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { useDesignStore } from "../store/designStore";

const SC = 0.01;
const WALL_H = 2.8;
const WALL_T = 0.14;
const FL_T = 0.06;
const STOREY_H = WALL_H + 0.15;

function normalizePoints(ground) {
  if (Array.isArray(ground.points) && ground.points.length >= 3)
    return ground.points;
  const { x = 0, y = 0, width = 0, height = 0 } = ground;
  return [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height },
  ];
}

const FLOOR_COLS = {
  living: "#c8a87a",
  kitchen: "#d4c4a0",
  bedroom: "#c0a890",
  bathroom: "#9ec4d8",
  hallway: "#c4bc9e",
  dining: "#c0a070",
  study: "#b8b090",
  gym: "#b0b8c0",
  cinema: "#3a3a4a",
  default: "#c4a882",
};
const WALL_COL = "#f4f0eb";

function Box({ pos, size, color, roughness = 0.75, metalness = 0.02, opacity = 1 }) {
  return (
    <mesh position={pos} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        roughness={roughness}
        metalness={metalness}
        transparent={opacity < 1}
        opacity={opacity}
      />
    </mesh>
  );
}

function GroundMesh({ points }) {
  const geo = useMemo(() => {
    const shape = new THREE.Shape();
    points.forEach((p, i) => {
      const x = p.x * SC;
      const y = p.y * SC;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    });
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, { depth: 0.03, bevelEnabled: false });
  }, [points]);

  return (
    <mesh geometry={geo} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} receiveShadow>
      <meshStandardMaterial color="#86efac" roughness={0.85} metalness={0.02} />
    </mesh>
  );
}

function buildWalls(cx, cz, rw, rd, side, doors, windows) {
  const h = WALL_H;
  const t = WALL_T;
  const segs = [];
  const wallMap = { north: "top", south: "bottom", west: "left", east: "right" };
  const wallKey = wallMap[side];
  const wallDoors = doors.filter((d) => d.wall === wallKey);
  const wallWindows = windows.filter((w) => w.wall === wallKey);
  const wallLen = side === "north" || side === "south" ? rw : rd;

  const openings = [];
  wallDoors.forEach((d) => {
    const dw = (d.width || 80) * SC;
    const center = d.position * wallLen;
    openings.push({ start: center - dw / 2, end: center + dw / 2, floorY: 0, ceilY: 2.2 });
  });
  wallWindows.forEach((w) => {
    const ww = (w.width || 80) * SC;
    const center = w.position * wallLen;
    openings.push({ start: center - ww / 2, end: center + ww / 2, floorY: 1.1, ceilY: 2.2 });
  });
  openings.sort((a, b) => a.start - b.start);

  if (openings.length === 0) {
    if (side === "north") segs.push({ pos: [cx, h / 2, cz - rd / 2 + t / 2], size: [rw, h, t] });
    if (side === "south") segs.push({ pos: [cx, h / 2, cz + rd / 2 - t / 2], size: [rw, h, t] });
    if (side === "west")  segs.push({ pos: [cx - rw / 2 + t / 2, h / 2, cz], size: [t, h, rd] });
    if (side === "east")  segs.push({ pos: [cx + rw / 2 - t / 2, h / 2, cz], size: [t, h, rd] });
    return segs;
  }

  const addSlab = (ls, le, yBot, yTop) => {
    const sl = le - ls; if (sl <= 0.001) return;
    const sh = yTop - yBot; if (sh <= 0.001) return;
    const mid = (ls + le) / 2;
    const midY = (yBot + yTop) / 2;
    if (side === "north") segs.push({ pos: [cx - wallLen / 2 + mid, midY, cz - rd / 2 + t / 2], size: [sl, sh, t] });
    else if (side === "south") segs.push({ pos: [cx - wallLen / 2 + mid, midY, cz + rd / 2 - t / 2], size: [sl, sh, t] });
    else if (side === "west") segs.push({ pos: [cx - rw / 2 + t / 2, midY, cz - wallLen / 2 + mid], size: [t, sh, sl] });
    else if (side === "east") segs.push({ pos: [cx + rw / 2 - t / 2, midY, cz - wallLen / 2 + mid], size: [t, sh, sl] });
  };

  let cursor = 0;
  openings.forEach((op) => {
    if (op.start > cursor) addSlab(cursor, op.start, 0, h);
    if (op.floorY > 0) addSlab(op.start, op.end, 0, op.floorY);
    if (op.ceilY < h) addSlab(op.start, op.end, op.ceilY, h);
    cursor = op.end;
  });
  if (cursor < wallLen) addSlab(cursor, wallLen, 0, h);
  return segs;
}

function MiniRoom({ room, allDoors, allWindows }) {
  const x = room.x * SC;
  const z = room.y * SC;
  const rw = room.width * SC;
  const rd = room.height * SC;
  const cx = x + rw / 2;
  const cz = z + rd / 2;
  const fc = FLOOR_COLS[room.type] || FLOOR_COLS.default;
  const roomDoors = allDoors.filter((d) => d.roomId === room.id);
  const roomWindows = allWindows.filter((w) => w.roomId === room.id);

  return (
    <group>
      <mesh position={[cx, FL_T / 2, cz]} receiveShadow>
        <boxGeometry args={[rw, FL_T, rd]} />
        <meshStandardMaterial color={fc} roughness={0.28} metalness={0.01} />
      </mesh>
      {["north", "south", "west", "east"].map((side) =>
        buildWalls(cx, cz, rw, rd, side, roomDoors, roomWindows).map((seg, i) => (
          <mesh key={`${side}${i}`} position={seg.pos} castShadow receiveShadow>
            <boxGeometry args={seg.size} />
            <meshStandardMaterial color={WALL_COL} roughness={0.92} />
          </mesh>
        ))
      )}
      {/* Ceiling slab */}
      <mesh position={[cx, WALL_H + 0.04, cz]}>
        <boxGeometry args={[rw, 0.08, rd]} />
        <meshStandardMaterial color="#d8d4cc" roughness={0.85} transparent opacity={0.4} />
      </mesh>
      <pointLight
        position={[cx, WALL_H - 0.5, cz]}
        intensity={0.8}
        color="#ffe8b0"
        distance={Math.max(rw, rd) * 2.5}
        decay={2}
      />
    </group>
  );
}

// Spinning placeholder when no design data is present
function PlaceholderBuilding() {
  const ref = useRef();
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.35; });
  return (
    <group ref={ref}>
      <mesh position={[0, -0.02, 0]} receiveShadow>
        <boxGeometry args={[4.5, 0.04, 4.5]} />
        <meshStandardMaterial color="#86efac" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 2.0, 2.8]} />
        <meshStandardMaterial color="#f4f0eb" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.3, 0]} castShadow>
        <boxGeometry args={[3.4, 0.35, 3.0]} />
        <meshStandardMaterial color="#c0b090" roughness={0.7} />
      </mesh>
      {[[-0.9, 1.2, 1.41], [0.9, 1.2, 1.41], [-0.9, 1.2, -1.41], [0.9, 1.2, -1.41]].map(
        (pos, i) => (
          <mesh key={i} position={pos}>
            <boxGeometry args={[0.55, 0.55, 0.06]} />
            <meshStandardMaterial color="#a8d0e8" roughness={0.05} metalness={0.1} transparent opacity={0.6} />
          </mesh>
        )
      )}
      <mesh position={[0, 0.65, 1.41]}>
        <boxGeometry args={[0.65, 1.3, 0.06]} />
        <meshStandardMaterial color="#8b6040" roughness={0.65} />
      </mesh>
    </group>
  );
}

function MiniScene({ showAllFloors }) {
  const { grounds, rooms, doors, windows, floors, activeFloor } = useDesignStore();
  const visFloorIds = showAllFloors ? floors.map((f) => f.id) : [activeFloor];

  const visGrounds = useMemo(
    () =>
      grounds
        .filter((g) => visFloorIds.includes(g.floor))
        .map((g) => ({ ...g, points: normalizePoints(g) })),
    [grounds, visFloorIds]
  );

  const { center, extent } = useMemo(() => {
    const source = [
      ...visGrounds.flatMap((g) => g.points),
      ...rooms
        .filter((r) => visFloorIds.includes(r.floor))
        .flatMap((r) => [
          { x: r.x, y: r.y },
          { x: r.x + r.width, y: r.y + r.height },
        ]),
    ];
    if (source.length === 0) return { center: [0, 0, 0], extent: 5 };
    const minX = Math.min(...source.map((p) => p.x)) * SC;
    const maxX = Math.max(...source.map((p) => p.x)) * SC;
    const minZ = Math.min(...source.map((p) => p.y)) * SC;
    const maxZ = Math.max(...source.map((p) => p.y)) * SC;
    const totalH = visFloorIds.length * STOREY_H;
    return {
      center: [(minX + maxX) / 2, Math.max(totalH * 0.45, 0.8), (minZ + maxZ) / 2],
      extent: Math.max(maxX - minX, maxZ - minZ, 1),
    };
  }, [visGrounds, rooms, visFloorIds]);

  const dist = extent * (showAllFloors ? 1.35 : 1.15);
  const camPos = [
    center[0] + dist * 0.75,
    center[1] + dist * 0.9,
    center[2] + dist * 0.75,
  ];

  if (visGrounds.length === 0) {
    return (
      <>
        <ambientLight intensity={0.75} color="#fff8f0" />
        <directionalLight position={[5, 8, 5]} intensity={1.4} color="#fff4e0" castShadow />
        <PerspectiveCamera makeDefault position={[3.6, 4.2, 3.6]} fov={38} near={0.1} far={200} />
        <OrbitControls
          target={[0, 1, 0]}
          enableDamping dampingFactor={0.08}
          autoRotate autoRotateSpeed={0.6}
          minDistance={1} maxDistance={20}
          maxPolarAngle={Math.PI / 2.05}
        />
        <PlaceholderBuilding />
      </>
    );
  }

  return (
    <>
      <ambientLight intensity={0.65} color="#fff4e8" />
      <directionalLight
        position={[center[0] + 12, center[1] + 16, center[2] + 8]}
        intensity={1.5}
        color="#fff8f0"
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-camera-near={0.5}
        shadow-camera-far={80}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-bias={-0.001}
      />
      <hemisphereLight skyColor="#fff8f0" groundColor="#806040" intensity={0.35} />

      <PerspectiveCamera makeDefault position={camPos} fov={38} near={0.1} far={200} />
      <OrbitControls
        target={center}
        enableDamping dampingFactor={0.08}
        autoRotate autoRotateSpeed={0.5}
        minDistance={0.5} maxDistance={80}
        maxPolarAngle={Math.PI / 2.05}
        enableZoom={false}
        enablePan={false}
      />

      {visFloorIds.map((floorId, floorIdx) => {
        const yOff = floorIdx * STOREY_H;
        const floorGrounds = visGrounds.filter((g) => g.floor === floorId);
        const floorRooms = rooms.filter((r) => r.floor === floorId);

        return (
          <group key={`mf-${floorId}`} position={[0, yOff, 0]}>
            {floorIdx > 0 &&
              floorGrounds.map((g) => {
                const pts = g.points;
                const minX = Math.min(...pts.map((p) => p.x)) * SC;
                const maxX = Math.max(...pts.map((p) => p.x)) * SC;
                const minZ = Math.min(...pts.map((p) => p.y)) * SC;
                const maxZ = Math.max(...pts.map((p) => p.y)) * SC;
                return (
                  <mesh key={`mslab-${g.id}`} position={[(minX + maxX) / 2, -0.08, (minZ + maxZ) / 2]} receiveShadow>
                    <boxGeometry args={[maxX - minX, 0.16, maxZ - minZ]} />
                    <meshStandardMaterial color="#c8c0b8" roughness={0.9} metalness={0.02} />
                  </mesh>
                );
              })}

            {floorGrounds.map((g) => <GroundMesh key={g.id} points={g.points} />)}

            {floorRooms.map((room) => (
              <MiniRoom key={room.id} room={room} allDoors={doors} allWindows={windows} />
            ))}
          </group>
        );
      })}
    </>
  );
}

export default function MiniThreeDPreview({ showAllFloors = false }) {
  return (
    <div style={{ width: "100%", height: "100%", background: "#151924", borderRadius: "inherit", overflow: "hidden" }}>
      <Canvas
        shadows={{ type: "PCFSoftShadowMap" }}
        gl={{ antialias: true, toneMapping: 3, toneMappingExposure: 1.25 }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <MiniScene showAllFloors={showAllFloors} />
        </Suspense>
      </Canvas>
    </div>
  );
}
