import React, { useRef, useState, useCallback, useEffect } from "react";
import { useDesignStore } from "../store/designStore";

const WALL_THICKNESS = 10;

function normalizeGroundPoints(ground) {
  if (Array.isArray(ground.points) && ground.points.length >= 3)
    return ground.points;
  const x = ground.x ?? 0;
  const y = ground.y ?? 0;
  const width = ground.width ?? 0;
  const height = ground.height ?? 0;
  return [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height },
  ];
}

function polygonPath(points) {
  if (!points.length) return "";
  return `M ${points.map((p) => `${p.x} ${p.y}`).join(" L ")} Z`;
}

function polygonCentroid(points) {
  if (!points.length) return { x: 0, y: 0 };
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), {
    x: 0,
    y: 0,
  });
  return { x: sum.x / points.length, y: sum.y / points.length };
}

function segmentLength(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function polygonArea(points) {
  if (points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y - points[j].x * points[i].y;
  }
  return Math.abs(area / 2);
}

function getOpeningTransform(room, side, position, width) {
  const hw = width / 2;
  switch (side) {
    case "top":
      return {
        x: room.x + room.width * position - hw,
        y: room.y - WALL_THICKNESS / 2,
        w: width,
        h: WALL_THICKNESS,
      };
    case "bottom":
      return {
        x: room.x + room.width * position - hw,
        y: room.y + room.height - WALL_THICKNESS / 2,
        w: width,
        h: WALL_THICKNESS,
      };
    case "left":
      return {
        x: room.x - WALL_THICKNESS / 2,
        y: room.y + room.height * position - hw,
        w: WALL_THICKNESS,
        h: width,
      };
    case "right":
      return {
        x: room.x + room.width - WALL_THICKNESS / 2,
        y: room.y + room.height * position - hw,
        w: WALL_THICKNESS,
        h: width,
      };
    default:
      return { x: 0, y: 0, w: 0, h: 0 };
  }
}

export default function Canvas2D() {
  const divRef = useRef(null);

  // Use ref-based pan/zoom to avoid stale closures on hot-path events
  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const isPanRef = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });

  // Sync from store → refs (for initial load)
  const [renderTick, setRenderTick] = useState(0);
  const rerender = useCallback(() => setRenderTick((t) => t + 1), []);

  // Trigger rerender every time pan/zoom refs change
  const [localZoom, setLocalZoom] = useState(1);
  const [localPan, setLocalPan] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [centered, setCentered] = useState(false);

  const dragFurnRef = useRef(null);
  const dragRoomHandleRef = useRef(null);
  const dragGroundVertexRef = useRef(null);
  const [groundDraftPoints, setGroundDraftPoints] = useState([]);
  const [selectedGroundIds, setSelectedGroundIds] = useState([]);
  const [groundOrthoMode, setGroundOrthoMode] = useState(true);
  const [groundScale, setGroundScale] = useState(100);

  const toMeters = useCallback(
    (canvasLength) => (canvasLength / 100) * (100 / groundScale),
    [groundScale],
  );

  const {
    grounds,
    rooms,
    doors,
    windows,
    furniture,
    activeFloor,
    activeTool,
    setActiveTool,
    selectedId,
    setSelectedId,
    isDrawingRoom,
    drawStart,
    drawCurrent,
    startDrawing,
    updateDrawing,
    finishDrawing,
    cancelDrawing,
    addRoom,
    updateRoom,
    deleteRoom,
    deleteFurniture,
    deleteGround,
    snap,
    addDoor,
    addWindow,
    addFurniture,
    updateFurniture,
    addGroundPolygon,
    updateGroundPolygon,
    mergeGrounds,
    openDoors,
    toggleDoor,
    openWindows,
    toggleWindow,
  } = useDesignStore();

  // ── Auto-fit rooms into view on first load ──────────────────
  useEffect(() => {
    const div = divRef.current;
    if (!div || centered) return;
    const vis = rooms.filter((r) => r.floor === activeFloor);
    if (vis.length === 0) return;

    // Wait for layout to be painted
    requestAnimationFrame(() => {
      const rect = div.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const minX = Math.min(...vis.map((r) => r.x));
      const maxX = Math.max(...vis.map((r) => r.x + r.width));
      const minY = Math.min(...vis.map((r) => r.y));
      const maxY = Math.max(...vis.map((r) => r.y + r.height));
      const dw = maxX - minX;
      const dh = maxY - minY;
      const sc = Math.min(
        2.5,
        Math.max(
          0.2,
          Math.min((rect.width * 0.75) / dw, (rect.height * 0.75) / dh),
        ),
      );
      const px = rect.width / 2 - (minX + dw / 2) * sc;
      const py = rect.height / 2 - (minY + dh / 2) * sc;
      panRef.current = { x: px, y: py };
      zoomRef.current = sc;
      setLocalPan({ x: px, y: py });
      setLocalZoom(sc);
      setCentered(true);
    });
  }, [rooms, activeFloor, centered]);

  // Reset centering when floor or rooms list change meaningfully
  useEffect(() => {
    setCentered(false);
  }, [activeFloor]);

  useEffect(() => {
    if (activeTool !== "ground") setGroundDraftPoints([]);
  }, [activeTool]);

  useEffect(() => {
    setGroundDraftPoints([]);
    setSelectedGroundIds([]);
  }, [activeFloor]);

  // ── Coordinate transform ──────────────────────────────────
  const toWorld = useCallback((clientX, clientY) => {
    const rect = divRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - panRef.current.x) / zoomRef.current,
      y: (clientY - rect.top - panRef.current.y) / zoomRef.current,
    };
  }, []);

  // ── Event handlers ─────────────────────────────────────────
  const onMouseDown = useCallback(
    (e) => {
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        isPanRef.current = true;
        panStart.current = {
          x: e.clientX - panRef.current.x,
          y: e.clientY - panRef.current.y,
        };
        e.preventDefault();
        return;
      }
      if (e.button !== 0) return;
      const w = toWorld(e.clientX, e.clientY);
      const floorGrounds = grounds.filter((g) => g.floor === activeFloor);
      const visRooms = rooms.filter((r) => r.floor === activeFloor);
      const z = zoomRef.current;

      if (activeTool === "ground") {
        setGroundDraftPoints((prev) => {
          let nx = snap(w.x);
          let ny = snap(w.y);
          if (groundOrthoMode && prev.length > 0) {
            const last = prev[prev.length - 1];
            const dx = nx - last.x;
            const dy = ny - last.y;
            if (Math.abs(dx) >= Math.abs(dy)) ny = last.y;
            else nx = last.x;
          }
          return [...prev, { x: nx, y: ny }];
        });
        return;
      }

      if (activeTool === "room") {
        if (floorGrounds.length === 0) return;
        startDrawing({ x: snap(w.x), y: snap(w.y) });
        return;
      }

      if (activeTool === "furniture") {
        const at = visRooms.find(
          (r) =>
            w.x >= r.x &&
            w.x <= r.x + r.width &&
            w.y >= r.y &&
            w.y <= r.y + r.height,
        );
        addFurniture({
          roomId: at?.id ?? null,
          type: "sofa",
          x: snap(w.x) - 60,
          y: snap(w.y) - 40,
          width: 120,
          height: 80,
          color: "#546e7a",
          label: "3-Seater Sofa",
        });
        return;
      }

      if (activeTool === "door" || activeTool === "window") {
        const thr = 20 / z;
        const room = visRooms.find(
          (r) =>
            w.x >= r.x - thr &&
            w.x <= r.x + r.width + thr &&
            w.y >= r.y - thr &&
            w.y <= r.y + r.height + thr,
        );
        if (room) {
          const dists = {
            top: Math.abs(w.y - room.y),
            bottom: Math.abs(w.y - room.y - room.height),
            left: Math.abs(w.x - room.x),
            right: Math.abs(w.x - room.x - room.width),
          };
          const wall = Object.entries(dists).reduce((a, b) =>
            a[1] < b[1] ? a : b,
          )[0];
          const isH = wall === "top" || wall === "bottom";
          const pos = Math.max(
            0.1,
            Math.min(
              0.9,
              isH ? (w.x - room.x) / room.width : (w.y - room.y) / room.height,
            ),
          );
          if (activeTool === "door")
            addDoor({ roomId: room.id, wall, position: pos, width: 80 });
          else addWindow({ roomId: room.id, wall, position: pos, width: 70 });
        }
      }
    },
    [
      activeTool,
      rooms,
      grounds,
      activeFloor,
      snap,
      startDrawing,
      addFurniture,
      addDoor,
      addWindow,
      toWorld,
      groundOrthoMode,
    ],
  );

  const onMouseMove = useCallback(
    (e) => {
      if (isPanRef.current) {
        const nx = e.clientX - panStart.current.x;
        const ny = e.clientY - panStart.current.y;
        panRef.current = { x: nx, y: ny };
        setLocalPan({ x: nx, y: ny });
        return;
      }

      const w = toWorld(e.clientX, e.clientY);
      setMousePos(w);

      if (dragGroundVertexRef.current) {
        const { groundId, pointIndex } = dragGroundVertexRef.current;
        const target = grounds.find((g) => g.id === groundId);
        if (!target) return;
        const nextPoints = [...normalizeGroundPoints(target)];
        nextPoints[pointIndex] = { x: snap(w.x), y: snap(w.y) };
        updateGroundPolygon(groundId, nextPoints);
        return;
      }

      if (dragFurnRef.current) {
        const nx = snap(w.x - dragFurnRef.current.offsetX);
        const ny = snap(w.y - dragFurnRef.current.offsetY);
        updateFurniture(dragFurnRef.current.id, { x: nx, y: ny });
        return;
      }

      if (dragRoomHandleRef.current) {
        const {
          id,
          handle,
          startX,
          startY,
          initialX,
          initialY,
          initialW,
          initialH,
        } = dragRoomHandleRef.current;
        const dx = w.x - startX;
        const dy = w.y - startY;
        const patch = {};

        if (handle.includes("left")) {
          const newW = snap(Math.max(40, initialW - dx));
          const newX = initialX + (initialW - newW);
          patch.x = newX;
          patch.width = newW;
        }
        if (handle.includes("right")) {
          patch.width = snap(Math.max(40, initialW + dx));
        }
        if (handle.includes("top")) {
          const newH = snap(Math.max(40, initialH - dy));
          const newY = initialY + (initialH - newH);
          patch.y = newY;
          patch.height = newH;
        }
        if (handle.includes("bottom")) {
          patch.height = snap(Math.max(40, initialH + dy));
        }

        updateRoom(id, patch);
        return;
      }

      if (isDrawingRoom) updateDrawing({ x: snap(w.x), y: snap(w.y) });
    },
    [
      isDrawingRoom,
      toWorld,
      snap,
      updateDrawing,
      updateFurniture,
      updateRoom,
      grounds,
      updateGroundPolygon,
    ],
  );

  const onMouseUp = useCallback(() => {
    if (dragGroundVertexRef.current) {
      dragGroundVertexRef.current = null;
      return;
    }
    if (dragRoomHandleRef.current) {
      dragRoomHandleRef.current = null;
      return;
    }
    if (dragFurnRef.current) {
      dragFurnRef.current = null;
      return;
    }
    if (isPanRef.current) {
      isPanRef.current = false;
      return;
    }
    if (isDrawingRoom) finishDrawing();
  }, [isDrawingRoom, finishDrawing]);

  const onMouseDownFurniture = useCallback(
    (e, item) => {
      e.stopPropagation();
      setSelectedId(item.id);
      if (e.button !== 0) return;
      const w = toWorld(e.clientX, e.clientY);
      dragFurnRef.current = {
        id: item.id,
        offsetX: w.x - item.x,
        offsetY: w.y - item.y,
      };
    },
    [setSelectedId, toWorld],
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      try {
        const raw = e.dataTransfer.getData("application/json");
        if (!raw) return;
        const item = JSON.parse(raw);
        const w = toWorld(e.clientX, e.clientY);
        const nx = snap(w.x - (item.w || 80) / 2);
        const ny = snap(w.y - (item.h || 80) / 2);
        addFurniture({
          roomId: null,
          type: item.type,
          x: nx,
          y: ny,
          width: item.w || 80,
          height: item.h || 80,
          color: item.color || "#607d8b",
          label: item.name || "Furniture",
          rotation: 0,
        });
        setActiveTool("select");
      } catch (err) {
        console.error("Failed to drop furniture item:", err);
      }
    },
    [toWorld, snap, addFurniture, setActiveTool],
  );

  // Wheel zoom attached non-passively
  useEffect(() => {
    const el = divRef.current;
    if (!el) return;
    const handler = (e) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const f = e.deltaY < 0 ? 1.12 : 0.9;
      const z = zoomRef.current;
      const px = panRef.current.x,
        py = panRef.current.y;
      const nz = Math.min(5, Math.max(0.08, z * f));
      const sc = nz / z;
      const nx = cx - sc * (cx - px);
      const ny = cy - sc * (cy - py);
      zoomRef.current = nz;
      panRef.current = { x: nx, y: ny };
      setLocalZoom(nz);
      setLocalPan({ x: nx, y: ny });
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  // Keyboard
  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") {
        cancelDrawing();
        setGroundDraftPoints([]);
      }

      if (
        e.key === "Enter" &&
        activeTool === "ground" &&
        groundDraftPoints.length >= 3
      ) {
        addGroundPolygon(groundDraftPoints);
        setGroundDraftPoints([]);
        setSelectedGroundIds([]);
      }

      if ((e.key === "m" || e.key === "M") && selectedGroundIds.length >= 2) {
        mergeGrounds(selectedGroundIds);
        setSelectedGroundIds([]);
      }

      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        if (selectedGroundIds.length > 0) {
          selectedGroundIds.forEach((id) => deleteGround(id));
          setSelectedGroundIds([]);
          return;
        }
        if (selectedId.startsWith("ground-")) deleteGround(selectedId);
        deleteRoom(selectedId);
        deleteFurniture(selectedId);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [
    cancelDrawing,
    activeTool,
    groundDraftPoints,
    addGroundPolygon,
    selectedGroundIds,
    mergeGrounds,
    deleteGround,
    selectedId,
    deleteRoom,
    deleteFurniture,
  ]);

  const z = localZoom;
  const pan = localPan;
  const visGrounds = grounds
    .filter((g) => g.floor === activeFloor)
    .map((g) => ({ ...g, points: normalizeGroundPoints(g) }));
  const visRooms = rooms.filter((r) => r.floor === activeFloor);
  const visibleFurn = furniture.filter((f) => f.floor === activeFloor);

  let preview = null;
  if (isDrawingRoom && drawStart && drawCurrent) {
    preview = {
      x: Math.min(drawStart.x, drawCurrent.x),
      y: Math.min(drawStart.y, drawCurrent.y),
      width: Math.abs(drawCurrent.x - drawStart.x),
      height: Math.abs(drawCurrent.y - drawStart.y),
    };
  }

  const cursor =
    activeTool === "room" || activeTool === "ground"
      ? "crosshair"
      : isPanRef.current
        ? "grabbing"
        : "default";

  return (
    <div
      ref={divRef}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        cursor,
        userSelect: "none",
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* Grid background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
          linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px),
          linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
        `,
          backgroundSize: `${100 * z}px ${100 * z}px, ${100 * z}px ${100 * z}px, ${20 * z}px ${20 * z}px, ${20 * z}px ${20 * z}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px, ${pan.x}px ${pan.y}px, ${pan.x}px ${pan.y}px, ${pan.x}px ${pan.y}px`,
          pointerEvents: "none",
        }}
      />

      {/* SVG */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
        overflow="visible"
      >
        <defs>
          <filter id="room-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="4"
              stdDeviation="6"
              floodColor="rgba(0,0,0,0.4)"
            />
          </filter>
        </defs>

        <g transform={`translate(${pan.x},${pan.y}) scale(${z})`}>
          {/* Ground footprints */}
          {visGrounds.map((ground, gi) => {
            const isSel =
              selectedGroundIds.includes(ground.id) || selectedId === ground.id;
            const c = polygonCentroid(ground.points);
            return (
              <g
                key={ground.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeTool !== "select") return;
                  if (e.shiftKey) {
                    setSelectedGroundIds((prev) =>
                      prev.includes(ground.id)
                        ? prev.filter((id) => id !== ground.id)
                        : [...prev, ground.id],
                    );
                  } else {
                    setSelectedGroundIds([ground.id]);
                  }
                  setSelectedId(ground.id);
                }}
                style={{
                  cursor: activeTool === "select" ? "pointer" : "default",
                }}
              >
                <path
                  d={polygonPath(ground.points)}
                  fill="rgba(34,197,94,0.10)"
                  stroke={isSel ? "#16a34a" : "#4b5563"}
                  strokeWidth={isSel ? 3 / z : 1.5 / z}
                  strokeDasharray={`${8 / z} ${4 / z}`}
                />
                <text
                  x={c.x}
                  y={c.y}
                  textAnchor="middle"
                  fill="#166534"
                  fontSize={Math.max(8, 11 / z)}
                  fontFamily="Inter,sans-serif"
                  fontWeight="700"
                >
                  Ground {gi + 1}
                </text>

                {isSel &&
                  activeTool === "select" &&
                  ground.points.map((p, i) => (
                    <circle
                      key={`${ground.id}-pt-${i}`}
                      cx={p.x}
                      cy={p.y}
                      r={5 / z}
                      fill="#ffffff"
                      stroke="#16a34a"
                      strokeWidth={2 / z}
                      style={{ cursor: "move" }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        dragGroundVertexRef.current = {
                          groundId: ground.id,
                          pointIndex: i,
                        };
                      }}
                    />
                  ))}
              </g>
            );
          })}

          {activeTool === "ground" && groundDraftPoints.length > 0 && (
            <g pointerEvents="none">
              <polyline
                points={groundDraftPoints.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="none"
                stroke="#16a34a"
                strokeWidth={2 / z}
                strokeDasharray={`${6 / z} ${3 / z}`}
              />
              {groundDraftPoints.length >= 2 && (
                <line
                  x1={groundDraftPoints[groundDraftPoints.length - 1].x}
                  y1={groundDraftPoints[groundDraftPoints.length - 1].y}
                  x2={mousePos.x}
                  y2={mousePos.y}
                  stroke="#16a34a"
                  strokeWidth={1.5 / z}
                  strokeDasharray={`${4 / z} ${2 / z}`}
                />
              )}
              {groundDraftPoints.map((p, i) => (
                <circle
                  key={`draft-${i}`}
                  cx={p.x}
                  cy={p.y}
                  r={3.5 / z}
                  fill="#16a34a"
                />
              ))}

              {groundDraftPoints.slice(1).map((p, i) => {
                const a = groundDraftPoints[i];
                const len = toMeters(segmentLength(a, p));
                const mx = (a.x + p.x) / 2;
                const my = (a.y + p.y) / 2;
                return (
                  <text
                    key={`seg-len-${i}`}
                    x={mx}
                    y={my - 8 / z}
                    textAnchor="middle"
                    fill="#14532d"
                    fontSize={Math.max(7, 10 / z)}
                    fontFamily="Inter,sans-serif"
                    fontWeight="700"
                  >
                    {len.toFixed(2)} m
                  </text>
                );
              })}
            </g>
          )}

          {/* Rooms */}
          {visRooms.map((room) => {
            const sel = selectedId === room.id;
            return (
              <g
                key={room.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeTool === "select") setSelectedId(room.id);
                }}
                style={{
                  cursor: activeTool === "select" ? "pointer" : "default",
                }}
              >
                {/* Selection glow */}
                {sel && (
                  <rect
                    x={room.x - 4 / z}
                    y={room.y - 4 / z}
                    width={room.width + 8 / z}
                    height={room.height + 8 / z}
                    fill="none"
                    stroke="rgba(79,142,247,0.4)"
                    strokeWidth={6 / z}
                    rx={4}
                    pointerEvents="none"
                  />
                )}

                {/* Room fill + wall stroke */}
                <rect
                  x={room.x}
                  y={room.y}
                  width={room.width}
                  height={room.height}
                  fill={room.color}
                  stroke={sel ? "#4f8ef7" : "#9aaabb"}
                  strokeWidth={sel ? 3 / z : WALL_THICKNESS / z}
                  rx={2}
                  filter="url(#room-shadow)"
                />

                {/* Labels */}
                <text
                  x={room.x + room.width / 2}
                  y={room.y + room.height / 2 - 8}
                  textAnchor="middle"
                  fill="rgba(20,30,50,0.75)"
                  fontSize={Math.max(8, 14 / z)}
                  fontWeight="600"
                  fontFamily="Inter,sans-serif"
                  pointerEvents="none"
                >
                  {room.name}
                </text>
                <text
                  x={room.x + room.width / 2}
                  y={room.y + room.height / 2 + 10}
                  textAnchor="middle"
                  fill="rgba(20,30,50,0.45)"
                  fontSize={Math.max(6, 10 / z)}
                  fontFamily="Inter,sans-serif"
                  pointerEvents="none"
                >
                  {((room.width / 100) * (room.height / 100)).toFixed(1)} m²
                </text>

                {/* Dimension lines */}
                {sel && (
                  <>
                    <line
                      x1={room.x}
                      y1={room.y - 20 / z}
                      x2={room.x + room.width}
                      y2={room.y - 20 / z}
                      stroke="#4f8ef7"
                      strokeWidth={0.8 / z}
                      strokeDasharray={`${3 / z} ${2 / z}`}
                    />
                    <text
                      x={room.x + room.width / 2}
                      y={room.y - 24 / z}
                      textAnchor="middle"
                      fill="#4f8ef7"
                      fontSize={Math.max(6, 9 / z)}
                      fontFamily="Inter"
                      pointerEvents="none"
                    >
                      {(room.width / 100).toFixed(1)} m
                    </text>
                    <line
                      x1={room.x - 20 / z}
                      y1={room.y}
                      x2={room.x - 20 / z}
                      y2={room.y + room.height}
                      stroke="#4f8ef7"
                      strokeWidth={0.8 / z}
                      strokeDasharray={`${3 / z} ${2 / z}`}
                    />
                    <text
                      x={room.x - 26 / z}
                      y={room.y + room.height / 2}
                      textAnchor="middle"
                      fill="#4f8ef7"
                      fontSize={Math.max(6, 9 / z)}
                      fontFamily="Inter"
                      pointerEvents="none"
                      transform={`rotate(-90,${room.x - 26 / z},${room.y + room.height / 2})`}
                    >
                      {(room.height / 100).toFixed(1)} m
                    </text>

                    {/* Room Extension Handles */}
                    {[
                      {
                        handle: "top-left",
                        hx: room.x,
                        hy: room.y,
                        cursor: "nwse-resize",
                      },
                      {
                        handle: "top",
                        hx: room.x + room.width / 2,
                        hy: room.y,
                        cursor: "ns-resize",
                      },
                      {
                        handle: "top-right",
                        hx: room.x + room.width,
                        hy: room.y,
                        cursor: "nesw-resize",
                      },
                      {
                        handle: "left",
                        hx: room.x,
                        hy: room.y + room.height / 2,
                        cursor: "ew-resize",
                      },
                      {
                        handle: "right",
                        hx: room.x + room.width,
                        hy: room.y + room.height / 2,
                        cursor: "ew-resize",
                      },
                      {
                        handle: "bottom-left",
                        hx: room.x,
                        hy: room.y + room.height,
                        cursor: "nesw-resize",
                      },
                      {
                        handle: "bottom",
                        hx: room.x + room.width / 2,
                        hy: room.y + room.height,
                        cursor: "ns-resize",
                      },
                      {
                        handle: "bottom-right",
                        hx: room.x + room.width,
                        hy: room.y + room.height,
                        cursor: "nwse-resize",
                      },
                    ].map((h) => (
                      <circle
                        key={h.handle}
                        cx={h.hx}
                        cy={h.hy}
                        r={6 / z}
                        fill="#ffffff"
                        stroke="#4f8ef7"
                        strokeWidth={2 / z}
                        style={{ cursor: h.cursor }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          const w = toWorld(e.clientX, e.clientY);
                          dragRoomHandleRef.current = {
                            id: room.id,
                            handle: h.handle,
                            startX: w.x,
                            startY: w.y,
                            initialX: room.x,
                            initialY: room.y,
                            initialW: room.width,
                            initialH: room.height,
                          };
                        }}
                      />
                    ))}
                  </>
                )}
              </g>
            );
          })}

          {/* Doors — clickable to open/close with animated swing and selection */}
          {doors.map((door) => {
            const room = rooms.find((r) => r.id === door.roomId);
            if (!room || room.floor !== activeFloor) return null;
            const t = getOpeningTransform(
              room,
              door.wall,
              door.position,
              door.width,
            );
            const isH = door.wall === "top" || door.wall === "bottom";
            const isOpen = openDoors.has(door.id);
            const isSel = selectedId === door.id;
            const arc = door.width * 0.85;

            // Hinge corner pivot point
            let pivotX, pivotY;
            if (isH) {
              pivotX = t.x;
              pivotY = t.y + WALL_THICKNESS / 2;
            } else {
              pivotX = t.x + WALL_THICKNESS / 2;
              pivotY = t.y;
            }

            const openAngle = isH ? -90 : 90;
            const angle = isOpen ? openAngle : 0;

            return (
              <g
                key={door.id}
                style={{
                  cursor: activeTool === "select" ? "pointer" : "default",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeTool === "select") {
                    setSelectedId(door.id);
                    toggleDoor(door.id);
                  }
                }}
              >
                {/* Wall gap */}
                <rect
                  x={t.x}
                  y={t.y}
                  width={t.w}
                  height={t.h}
                  fill={room.color}
                />

                {/* Selection highlight */}
                {isSel && (
                  <rect
                    x={t.x - 4 / z}
                    y={t.y - 4 / z}
                    width={t.w + 8 / z}
                    height={t.h + 8 / z}
                    fill="none"
                    stroke="#4f8ef7"
                    strokeWidth={2 / z}
                    strokeDasharray={`${3 / z} ${2 / z}`}
                    rx={2}
                  />
                )}

                {/* Door frame */}
                <rect
                  x={t.x}
                  y={t.y}
                  width={t.w}
                  height={t.h}
                  fill="none"
                  stroke="#7a5030"
                  strokeWidth={1.5 / z}
                />

                {/* Rotating Door Leaf */}
                <g
                  style={{
                    transformOrigin: `${pivotX}px ${pivotY}px`,
                    transform: `rotate(${angle}deg)`,
                    transition: "transform 0.4s cubic-bezier(0.4,0,0.2,1)",
                    transformBox: "fill-box",
                  }}
                >
                  <rect
                    x={t.x}
                    y={t.y}
                    width={isH ? door.width : WALL_THICKNESS}
                    height={isH ? WALL_THICKNESS : door.width}
                    fill={isOpen ? "#e8b878" : "#c8923a"}
                    fillOpacity="0.9"
                    stroke="#a06828"
                    strokeWidth={0.8 / z}
                    rx={1 / z}
                  />
                  {/* Knob */}
                  <circle
                    cx={isH ? t.x + door.width * 0.8 : t.x + WALL_THICKNESS / 2}
                    cy={isH ? t.y + WALL_THICKNESS / 2 : t.y + door.width * 0.8}
                    r={3.5 / z}
                    fill="#c8a840"
                    stroke="#806010"
                    strokeWidth={0.5 / z}
                  />
                </g>

                {/* Swing arc */}
                {!isOpen && (
                  <path
                    d={
                      isH
                        ? `M${t.x} ${t.y + WALL_THICKNESS / 2} A${arc} ${arc} 0 0 1 ${t.x} ${t.y + WALL_THICKNESS / 2 - arc}`
                        : `M${t.x + WALL_THICKNESS / 2} ${t.y} A${arc} ${arc} 0 0 0 ${t.x + WALL_THICKNESS / 2 + arc} ${t.y}`
                    }
                    fill="rgba(200,146,58,0.08)"
                    stroke="#a06828"
                    strokeWidth={0.6 / z}
                    strokeDasharray={`${2.5 / z} ${2 / z}`}
                    pointerEvents="none"
                  />
                )}

                {/* Status Indicator */}
                <text
                  x={isH ? t.x + door.width / 2 : t.x + WALL_THICKNESS / 2}
                  y={isH ? t.y - 6 / z : t.y - 6 / z}
                  textAnchor="middle"
                  fill={isOpen ? "#16a34a" : "#c8923a"}
                  fontSize={Math.max(5, 8 / z)}
                  fontFamily="Inter"
                  fontWeight="700"
                  pointerEvents="none"
                >
                  {isOpen ? "▲ OPEN" : "▼ CLOSED"}
                </text>
              </g>
            );
          })}

          {/* Windows — clickable to unlock/open with sliding sashes */}
          {windows.map((win) => {
            const room = rooms.find((r) => r.id === win.roomId);
            if (!room || room.floor !== activeFloor) return null;
            const t = getOpeningTransform(
              room,
              win.wall,
              win.position,
              win.width,
            );
            const isH = win.wall === "top" || win.wall === "bottom";
            const isOpen = openWindows.has(win.id);
            const isSel = selectedId === win.id;

            return (
              <g
                key={`w-${win.id}`}
                style={{
                  cursor: activeTool === "select" ? "pointer" : "default",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeTool === "select") {
                    setSelectedId(win.id);
                    toggleWindow(win.id);
                  }
                }}
              >
                {/* Wall gap */}
                <rect
                  x={t.x}
                  y={t.y}
                  width={t.w}
                  height={t.h}
                  fill={room.color}
                />

                {/* Selection highlight */}
                {isSel && (
                  <rect
                    x={t.x - 4 / z}
                    y={t.y - 4 / z}
                    width={t.w + 8 / z}
                    height={t.h + 8 / z}
                    fill="none"
                    stroke="#4f8ef7"
                    strokeWidth={2 / z}
                    strokeDasharray={`${3 / z} ${2 / z}`}
                    rx={2}
                  />
                )}

                {/* Window glass pane & frame */}
                <rect
                  x={t.x}
                  y={t.y}
                  width={t.w}
                  height={t.h}
                  fill={
                    isOpen
                      ? "rgba(74, 222, 128, 0.35)"
                      : "rgba(168, 216, 240, 0.65)"
                  }
                  stroke={isOpen ? "#16a34a" : "#5ab0e0"}
                  strokeWidth={1.2 / z}
                  rx={1 / z}
                />

                {/* Pane division lines */}
                {isH ? (
                  <>
                    <line
                      x1={t.x + (isOpen ? win.width * 0.25 : win.width / 2)}
                      y1={t.y}
                      x2={t.x + (isOpen ? win.width * 0.25 : win.width / 2)}
                      y2={t.y + WALL_THICKNESS}
                      stroke="#5ab0e0"
                      strokeWidth={1 / z}
                    />
                    {isOpen && (
                      <line
                        x1={t.x + win.width * 0.75}
                        y1={t.y}
                        x2={t.x + win.width * 0.75}
                        y2={t.y + WALL_THICKNESS}
                        stroke="#16a34a"
                        strokeWidth={1 / z}
                        strokeDasharray={`${2 / z} ${1 / z}`}
                      />
                    )}
                  </>
                ) : (
                  <>
                    <line
                      x1={t.x}
                      y1={t.y + (isOpen ? win.width * 0.25 : win.width / 2)}
                      x2={t.x + WALL_THICKNESS}
                      y2={t.y + (isOpen ? win.width * 0.25 : win.width / 2)}
                      stroke="#5ab0e0"
                      strokeWidth={1 / z}
                    />
                    {isOpen && (
                      <line
                        x1={t.x}
                        y1={t.y + win.width * 0.75}
                        x2={t.x + WALL_THICKNESS}
                        y2={t.y + win.width * 0.75}
                        stroke="#16a34a"
                        strokeWidth={1 / z}
                        strokeDasharray={`${2 / z} ${1 / z}`}
                      />
                    )}
                  </>
                )}

                {/* Window status badge */}
                <text
                  x={isH ? t.x + win.width / 2 : t.x + WALL_THICKNESS / 2}
                  y={isH ? t.y - 6 / z : t.y - 6 / z}
                  textAnchor="middle"
                  fill={isOpen ? "#16a34a" : "#0284c7"}
                  fontSize={Math.max(5, 8 / z)}
                  fontFamily="Inter"
                  fontWeight="700"
                  pointerEvents="none"
                >
                  {isOpen ? "🔓 UNLOCKED" : "🔒 LOCKED"}
                </text>
              </g>
            );
          })}

          {/* Furniture — Detailed 2D IKEA models */}
          {visibleFurn.map((f) => (
            <Furniture2D
              key={f.id}
              item={f}
              selected={selectedId === f.id}
              z={z}
              onMouseDown={(e) => onMouseDownFurniture(e, f)}
              onClick={(e) => {
                e.stopPropagation();
                if (activeTool === "select") setSelectedId(f.id);
              }}
            />
          ))}

          {/* Draw preview */}
          {preview && preview.width > 5 && preview.height > 5 && (
            <g pointerEvents="none">
              <rect
                x={preview.x}
                y={preview.y}
                width={preview.width}
                height={preview.height}
                fill="rgba(79,142,247,0.08)"
                stroke="#4f8ef7"
                strokeWidth={1.5 / z}
                strokeDasharray={`${6 / z} ${3 / z}`}
                rx={2}
              />
              <text
                x={preview.x + preview.width / 2}
                y={preview.y - 8 / z}
                textAnchor="middle"
                fill="#4f8ef7"
                fontSize={Math.max(8, 12 / z)}
                fontFamily="Inter"
                fontWeight="600"
              >
                {(preview.width / 100).toFixed(1)}m ×{" "}
                {(preview.height / 100).toFixed(1)}m
              </text>
            </g>
          )}

          {/* Crosshair */}
          {(activeTool === "room" || activeTool === "ground") && (
            <g pointerEvents="none" opacity="0.55">
              <line
                x1={mousePos.x - 14 / z}
                y1={mousePos.y}
                x2={mousePos.x + 14 / z}
                y2={mousePos.y}
                stroke="#4f8ef7"
                strokeWidth={1 / z}
              />
              <line
                x1={mousePos.x}
                y1={mousePos.y - 14 / z}
                x2={mousePos.x}
                y2={mousePos.y + 14 / z}
                stroke="#4f8ef7"
                strokeWidth={1 / z}
              />
              <circle
                cx={mousePos.x}
                cy={mousePos.y}
                r={2.5 / z}
                fill="#4f8ef7"
              />
            </g>
          )}
        </g>
      </svg>

      {/* Status bar */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: "50%",
          transform: "translateX(-50%)",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: 99,
          padding: "5px 18px",
          fontSize: 11,
          color: "var(--text-muted)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--green)",
            boxShadow: "0 0 6px var(--green)",
          }}
        />
        <span>X: {(mousePos.x / 100).toFixed(2)} m</span>
        <span>|</span>
        <span>Y: {(mousePos.y / 100).toFixed(2)} m</span>
        <span>|</span>
        <span>Zoom: {Math.round(z * 100)}%</span>
        <span>|</span>
        <span>{visRooms.length} rooms</span>
        <span>|</span>
        <span>{visGrounds.length} grounds</span>
        {activeTool === "ground" && groundDraftPoints.length >= 3 && (
          <>
            <span>|</span>
            <span style={{ color: "#16a34a", fontWeight: 600 }}>
              Area:{" "}
              {(
                polygonArea(groundDraftPoints) * Math.pow(toMeters(1), 2)
              ).toFixed(2)}{" "}
              m²
            </span>
          </>
        )}
        {isDrawingRoom && drawStart && drawCurrent && (
          <>
            <span>|</span>
            <span style={{ color: "#4f8ef7", fontWeight: 600 }}>
              {(Math.abs(drawCurrent.x - drawStart.x) / 100).toFixed(1)}m ×{" "}
              {(Math.abs(drawCurrent.y - drawStart.y) / 100).toFixed(1)}m
            </span>
          </>
        )}
      </div>

      {/* Zoom controls */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          display: "flex",
          flexDirection: "column",
          gap: 0,
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
        }}
      >
        {[
          {
            label: "+",
            action: () => {
              const nz = Math.min(5, zoomRef.current * 1.25);
              zoomRef.current = nz;
              setLocalZoom(nz);
            },
          },
          {
            label: "−",
            action: () => {
              const nz = Math.max(0.08, zoomRef.current * 0.8);
              zoomRef.current = nz;
              setLocalZoom(nz);
            },
          },
          {
            label: "⊡",
            action: () => setCentered(false),
            title: "Fit to screen",
          },
        ].map((btn) => (
          <button
            key={btn.label}
            onClick={btn.action}
            style={{
              width: 34,
              height: 34,
              border: "none",
              borderTop: btn.label !== "+" ? "1px solid var(--border)" : "none",
              background: "transparent",
              color: "var(--text-secondary)",
              fontSize: btn.label === "⊡" ? 13 : 17,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {activeTool === "ground" && groundDraftPoints.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            display: "flex",
            alignItems: "center",
            gap: 8,
            zIndex: 8,
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "5px 8px",
              fontSize: 12,
              color: "var(--text-secondary)",
            }}
          >
            Scale
            <select
              value={groundScale}
              onChange={(e) => setGroundScale(+e.target.value)}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 6,
                background: "var(--bg-tertiary)",
                color: "var(--text-primary)",
                fontSize: 12,
                padding: "2px 6px",
              }}
            >
              <option value={50}>1:50</option>
              <option value={100}>1:100</option>
              <option value={200}>1:200</option>
            </select>
          </label>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "5px 8px",
              fontSize: 12,
              color: "var(--text-secondary)",
            }}
          >
            <input
              type="checkbox"
              checked={groundOrthoMode}
              onChange={(e) => setGroundOrthoMode(e.target.checked)}
            />
            Perpendicular
          </label>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (groundDraftPoints.length < 3) {
                alert("Add at least 3 points to create a ground polygon.");
                return;
              }
              addGroundPolygon(groundDraftPoints);
              setGroundDraftPoints([]);
            }}
          >
            Finish Ground
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setGroundDraftPoints([])}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Tool hint banners */}
      {activeTool === "ground" && (
        <ToolHint>
          Click to add points · Perpendicular mode keeps edges orthogonal ·
          Press <b>Enter</b> to finish
        </ToolHint>
      )}
      {activeTool === "room" && (
        <ToolHint>
          🖊 Click and drag to draw a room · <b>Esc</b> to cancel
        </ToolHint>
      )}
      {activeTool === "door" && (
        <ToolHint>Click near a wall to place a door</ToolHint>
      )}
      {activeTool === "window" && (
        <ToolHint>Click near a wall to place a window</ToolHint>
      )}
      {activeTool === "furniture" && (
        <ToolHint>
          Click on canvas to place furniture, or use Library panel →
        </ToolHint>
      )}
      {activeTool === "select" && selectedGroundIds.length >= 2 && (
        <ToolHint>
          <b>{selectedGroundIds.length}</b> grounds selected · Press <b>M</b> to
          merge
        </ToolHint>
      )}

      {/* Empty state */}
      {visGrounds.length === 0 && !isDrawingRoom && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <div style={{ fontSize: 48, opacity: 0.25, marginBottom: 12 }}>
            🌍
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--text-secondary)",
              marginBottom: 6,
            }}
          >
            Define your ground first
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              lineHeight: 1.7,
            }}
          >
            Pick <b>Ground</b> tool and draw your footprint, then preview it in{" "}
            <b>3D View</b>
          </div>
        </div>
      )}

      {visGrounds.length > 0 && visRooms.length === 0 && !isDrawingRoom && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <div style={{ fontSize: 48, opacity: 0.25, marginBottom: 12 }}>
            🏗️
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--text-secondary)",
              marginBottom: 6,
            }}
          >
            Ground is ready
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              lineHeight: 1.7,
            }}
          >
            Open <b>3D View</b> once to preview the site, then use <b>Room</b>{" "}
            tool
          </div>
        </div>
      )}
    </div>
  );
}

function ToolHint({ children }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(79,142,247,0.15)",
        border: "1px solid rgba(79,142,247,0.4)",
        borderRadius: 99,
        padding: "6px 18px",
        fontSize: 12,
        color: "#4f8ef7",
        backdropFilter: "blur(8px)",
        pointerEvents: "none",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
}

function Furniture2D({ item, selected, z, onClick, onMouseDown }) {
  const { x, y, width: w, height: h, color, label, type, rotation = 0 } = item;
  const rot = rotation || 0;
  const cx = x + w / 2;
  const cy = y + h / 2;

  const renderDetails = () => {
    switch (type) {
      case "sofa":
        return (
          <>
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              fill={color}
              rx={6 / z}
              stroke="rgba(0,0,0,0.3)"
              strokeWidth={1 / z}
            />
            <rect
              x={x + 2}
              y={y + 2}
              width={w - 4}
              height={h * 0.3}
              fill="rgba(0,0,0,0.15)"
              rx={3 / z}
            />
            <rect
              x={x + 2}
              y={y + 2}
              width={w * 0.15}
              height={h - 4}
              fill="rgba(0,0,0,0.12)"
              rx={3 / z}
            />
            <rect
              x={x + w - w * 0.15 - 2}
              y={y + 2}
              width={w * 0.15}
              height={h - 4}
              fill="rgba(0,0,0,0.12)"
              rx={3 / z}
            />
            <rect
              x={x + w * 0.18}
              y={y + h * 0.32}
              width={(w * 0.64) / 2 - 2}
              height={h * 0.6}
              fill="rgba(255,255,255,0.2)"
              rx={3 / z}
            />
            <rect
              x={x + w * 0.18 + (w * 0.64) / 2 + 1}
              y={y + h * 0.32}
              width={(w * 0.64) / 2 - 2}
              height={h * 0.6}
              fill="rgba(255,255,255,0.2)"
              rx={3 / z}
            />
          </>
        );

      case "sofa_sectional":
        return (
          <>
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              fill={color}
              rx={6 / z}
              stroke="rgba(0,0,0,0.3)"
              strokeWidth={1 / z}
            />
            <rect
              x={x + 2}
              y={y + 2}
              width={w - 4}
              height={h * 0.25}
              fill="rgba(0,0,0,0.15)"
              rx={3 / z}
            />
            <rect
              x={x + w * 0.65}
              y={y + 2}
              width={w * 0.32}
              height={h - 4}
              fill="rgba(0,0,0,0.15)"
              rx={3 / z}
            />
            <rect
              x={x + 2}
              y={y + 2}
              width={w * 0.12}
              height={h * 0.75}
              fill="rgba(0,0,0,0.12)"
              rx={2 / z}
            />
          </>
        );

      case "armchair":
        return (
          <>
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              fill={color}
              rx={6 / z}
              stroke="rgba(0,0,0,0.3)"
              strokeWidth={1 / z}
            />
            <rect
              x={x + 3}
              y={y + 3}
              width={w - 6}
              height={h * 0.3}
              fill="rgba(0,0,0,0.15)"
              rx={3 / z}
            />
            <rect
              x={x + 3}
              y={y + 3}
              width={w * 0.2}
              height={h - 6}
              fill="rgba(0,0,0,0.12)"
              rx={3 / z}
            />
            <rect
              x={x + w - w * 0.2 - 3}
              y={y + 3}
              width={w * 0.2}
              height={h - 6}
              fill="rgba(0,0,0,0.12)"
              rx={3 / z}
            />
            <rect
              x={x + w * 0.22}
              y={y + h * 0.33}
              width={w * 0.56}
              height={h * 0.6}
              fill="rgba(255,255,255,0.25)"
              rx={4 / z}
            />
          </>
        );

      case "bed_single":
      case "bed_double":
      case "bed_queen":
      case "bed_king":
      case "bed_bunk":
      case "bed":
        const isKingQueen =
          type === "bed_queen" || type === "bed_king" || type === "bed_double";
        return (
          <>
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              fill={color}
              rx={5 / z}
              stroke="rgba(0,0,0,0.3)"
              strokeWidth={1 / z}
            />
            <rect
              x={x + 2}
              y={y + 2}
              width={w - 4}
              height={h * 0.12}
              fill="rgba(0,0,0,0.25)"
              rx={2 / z}
            />
            <rect
              x={x + 4}
              y={y + h * 0.14}
              width={w - 8}
              height={h * 0.82}
              fill="rgba(255,255,255,0.85)"
              rx={3 / z}
            />
            {isKingQueen ? (
              <>
                <rect
                  x={x + w * 0.1}
                  y={y + h * 0.18}
                  width={w * 0.36}
                  height={h * 0.18}
                  fill="#f5f5f5"
                  stroke="#ccc"
                  strokeWidth={0.5 / z}
                  rx={3 / z}
                />
                <rect
                  x={x + w * 0.54}
                  y={y + h * 0.18}
                  width={w * 0.36}
                  height={h * 0.18}
                  fill="#f5f5f5"
                  stroke="#ccc"
                  strokeWidth={0.5 / z}
                  rx={3 / z}
                />
              </>
            ) : (
              <rect
                x={x + w * 0.2}
                y={y + h * 0.18}
                width={w * 0.6}
                height={h * 0.18}
                fill="#f5f5f5"
                stroke="#ccc"
                strokeWidth={0.5 / z}
                rx={3 / z}
              />
            )}
            <rect
              x={x + 4}
              y={y + h * 0.42}
              width={w - 8}
              height={h * 0.54}
              fill={color}
              fillOpacity="0.6"
              rx={2 / z}
            />
            <line
              x1={x + 4}
              y1={y + h * 0.42}
              x2={x + w - 4}
              y2={y + h * 0.42}
              stroke="rgba(0,0,0,0.2)"
              strokeWidth={1.5 / z}
            />
            {type === "bed_bunk" && (
              <text
                x={x + w / 2}
                y={y + h * 0.75}
                textAnchor="middle"
                fill="#fff"
                fontSize={Math.max(6, 8 / z)}
                fontWeight="bold"
              >
                BUNK
              </text>
            )}
          </>
        );

      case "dining_4":
      case "dining_6":
      case "table":
        const chairCount = type === "dining_6" ? 6 : 4;
        return (
          <>
            <rect
              x={x + w * 0.15}
              y={y + h * 0.15}
              width={w * 0.7}
              height={h * 0.7}
              fill={color}
              rx={4 / z}
              stroke="rgba(0,0,0,0.3)"
              strokeWidth={1 / z}
            />
            <rect
              x={x + w * 0.25}
              y={y}
              width={w * 0.2}
              height={h * 0.12}
              fill="#5d4037"
              rx={2 / z}
            />
            <rect
              x={x + w * 0.55}
              y={y}
              width={w * 0.2}
              height={h * 0.12}
              fill="#5d4037"
              rx={2 / z}
            />
            <rect
              x={x + w * 0.25}
              y={y + h * 0.88}
              width={w * 0.2}
              height={h * 0.12}
              fill="#5d4037"
              rx={2 / z}
            />
            <rect
              x={x + w * 0.55}
              y={y + h * 0.88}
              width={w * 0.2}
              height={h * 0.12}
              fill="#5d4037"
              rx={2 / z}
            />
            {chairCount === 6 && (
              <>
                <rect
                  x={x}
                  y={y + h * 0.35}
                  width={w * 0.12}
                  height={h * 0.3}
                  fill="#5d4037"
                  rx={2 / z}
                />
                <rect
                  x={x + w * 0.88}
                  y={y + h * 0.35}
                  width={w * 0.88}
                  height={h * 0.3}
                  fill="#5d4037"
                  rx={2 / z}
                />
              </>
            )}
          </>
        );

      case "table_coffee":
      case "desk":
      case "nightstand":
        return (
          <>
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              fill={color}
              rx={4 / z}
              stroke="rgba(0,0,0,0.3)"
              strokeWidth={1 / z}
            />
            <rect
              x={x + 3}
              y={y + 3}
              width={w - 6}
              height={h - 6}
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth={1 / z}
              rx={2 / z}
            />
            {type === "desk" && (
              <>
                <rect
                  x={x + w * 0.3}
                  y={y + h * 0.2}
                  width={w * 0.4}
                  height={h * 0.3}
                  fill="#333"
                  rx={1 / z}
                />
                <rect
                  x={x + w * 0.72}
                  y={y + 4}
                  width={w * 0.24}
                  height={h - 8}
                  fill="rgba(0,0,0,0.15)"
                  rx={2 / z}
                />
              </>
            )}
            {type === "nightstand" && (
              <circle
                cx={x + w / 2}
                cy={y + h / 2}
                r={3 / z}
                fill="rgba(0,0,0,0.3)"
              />
            )}
          </>
        );

      case "wardrobe":
        return (
          <>
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              fill={color}
              rx={2 / z}
              stroke="rgba(0,0,0,0.4)"
              strokeWidth={1 / z}
            />
            <line
              x1={x + w / 2}
              y1={y + 2}
              x2={x + w / 2}
              y2={y + h - 2}
              stroke="rgba(0,0,0,0.3)"
              strokeWidth={1 / z}
            />
            <rect
              x={x + w * 0.45}
              y={y + h * 0.4}
              width={w * 0.03}
              height={h * 0.2}
              fill="#c8a840"
            />
            <rect
              x={x + w * 0.52}
              y={y + h * 0.4}
              width={w * 0.03}
              height={h * 0.2}
              fill="#c8a840"
            />
          </>
        );

      case "shoerack":
        return (
          <>
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              fill={color}
              rx={2 / z}
              stroke="rgba(0,0,0,0.4)"
              strokeWidth={1 / z}
            />
            {[0.25, 0.5, 0.75].map((p, i) => (
              <line
                key={i}
                x1={x + 4}
                y1={y + h * p}
                x2={x + w - 4}
                y2={y + h * p}
                stroke="rgba(255,255,255,0.25)"
                strokeWidth={1 / z}
              />
            ))}
          </>
        );

      case "tv_unit":
      case "tv":
        return (
          <>
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              fill={color}
              rx={3 / z}
              stroke="rgba(0,0,0,0.4)"
              strokeWidth={1 / z}
            />
            <rect
              x={x + w * 0.1}
              y={y + h * 0.35}
              width={w * 0.8}
              height={h * 0.3}
              fill="#000"
              rx={1 / z}
              stroke="#444"
              strokeWidth={0.5 / z}
            />
          </>
        );

      case "door_single":
      case "door_double":
        const isDouble = type === "door_double";
        return (
          <>
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              fill={color}
              fillOpacity="0.3"
              stroke={color}
              strokeWidth={1.5 / z}
              rx={2 / z}
            />
            {isDouble ? (
              <>
                <path
                  d={`M ${x} ${y + h} A ${w / 2} ${w / 2} 0 0 1 ${x + w / 2} ${y + h - w / 2}`}
                  fill="none"
                  stroke={color}
                  strokeDasharray={`${3 / z} ${2 / z}`}
                  strokeWidth={1 / z}
                />
                <path
                  d={`M ${x + w} ${y + h} A ${w / 2} ${w / 2} 0 0 0 ${x + w / 2} ${y + h - w / 2}`}
                  fill="none"
                  stroke={color}
                  strokeDasharray={`${3 / z} ${2 / z}`}
                  strokeWidth={1 / z}
                />
              </>
            ) : (
              <path
                d={`M ${x} ${y + h} A ${w} ${w} 0 0 1 ${x + w} ${y + h - w}`}
                fill="none"
                stroke={color}
                strokeDasharray={`${3 / z} ${2 / z}`}
                strokeWidth={1 / z}
              />
            )}
          </>
        );

      default:
        return (
          <rect
            x={x}
            y={y}
            width={w}
            height={h}
            fill={color}
            rx={4 / z}
            stroke="rgba(0,0,0,0.3)"
            strokeWidth={1 / z}
          />
        );
    }
  };

  return (
    <g
      onClick={onClick}
      onMouseDown={onMouseDown}
      style={{ cursor: "grab" }}
      transform={rot ? `rotate(${rot}, ${cx}, ${cy})` : undefined}
    >
      {selected && (
        <rect
          x={x - 4 / z}
          y={y - 4 / z}
          width={w + 8 / z}
          height={h + 8 / z}
          fill="none"
          stroke="#4f8ef7"
          strokeWidth={2 / z}
          strokeDasharray={`${4 / z} ${2 / z}`}
          rx={6 / z}
        />
      )}
      {renderDetails()}
      <text
        x={cx}
        y={cy + 3}
        textAnchor="middle"
        fill="#000"
        fillOpacity="0.75"
        fontSize={Math.max(6, 9 / z)}
        fontWeight="600"
        fontFamily="Inter, sans-serif"
        pointerEvents="none"
      >
        {label}
      </text>
    </g>
  );
}
