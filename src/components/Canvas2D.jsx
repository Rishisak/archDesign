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
    floors,
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
    canvas2DTheme,
    toggleCanvas2DTheme,
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
        // Don't intercept when user is typing inside an input / textarea / select
        const tag = document.activeElement?.tagName?.toLowerCase();
        const isEditable = document.activeElement?.isContentEditable;
        if (tag === "input" || tag === "textarea" || tag === "select" || isEditable) return;

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

  // ── Ghost reference: ground-floor rooms shown on upper floors ────────────
  const sortedFloors = [...floors].sort((a, b) => a.id - b.id);
  const groundFloorId = sortedFloors[0]?.id;
  const isUpperFloor = activeFloor !== groundFloorId;
  // Ghost: ground-floor rooms (layout reference) + overall bounding outline
  const ghostRooms = isUpperFloor
    ? rooms.filter((r) => r.floor === groundFloorId)
    : [];

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

  const isDark = canvas2DTheme === "dark";
  const themeColors = {
    bg: isDark ? "#0b0f19" : "#f6f4ee",
    gridMajor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
    gridMinor: isDark ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.035)",
    roomFillStd: isDark ? "#141c2b" : "#fbf9f4",
    roomFillBath: isDark ? "#282019" : "#d0baa4",
    wallFill: isDark ? "#38475c" : "#181818",
    wallStroke: isDark ? "#94a3b8" : "#181818",
    roomTitleText: isDark ? "#f8fafc" : "#111111",
    roomDimText: isDark ? "#94a3b8" : "#555555",
    doorArc: isDark ? "#60a5fa" : "#222222",
    doorLeaf: isDark ? "#38bdf8" : "#111111",
    doorJamb: isDark ? "#475569" : "#181818",
    windowPane: isDark ? "#38bdf8" : "#222222",
    furnFill: isDark ? "#1e293b" : "#ffffff",
    furnStroke: isDark ? "#e2e8f0" : "#181818",
    furnText: isDark ? "#f8fafc" : "#111111",
    outerDimLine: isDark ? "#94a3b8" : "#111111",
    outerDimText: isDark ? "#f8fafc" : "#111111",
    porchFill: isDark ? "#1e293b" : "#e5dabf",
  };

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
      {/* Floating Light/Dark Mode Theme Switcher */}
      <button
        onClick={toggleCanvas2DTheme}
        title="Switch 2D Plan Theme (Light / Dark)"
        style={{
          position: "absolute",
          top: 16,
          left: 80,
          zIndex: 100,
          background: isDark ? "rgba(30,41,59,0.9)" : "rgba(255,255,255,0.9)",
          backdropFilter: "blur(8px)",
          border: isDark ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(0,0,0,0.15)",
          borderRadius: 99,
          padding: "6px 14px",
          fontSize: 12,
          fontWeight: 600,
          color: isDark ? "#f8fafc" : "#111111",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
          transition: "all 0.2s",
        }}
      >
        <span>{isDark ? "🌙 Dark Plan" : "☀️ Light Plan"}</span>
      </button>

      {/* Architectural Graph Paper background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: themeColors.bg,
          backgroundImage: `
          linear-gradient(${themeColors.gridMajor} 1px, transparent 1px),
          linear-gradient(90deg, ${themeColors.gridMajor} 1px, transparent 1px),
          linear-gradient(${themeColors.gridMinor} 1px, transparent 1px),
          linear-gradient(90deg, ${themeColors.gridMinor} 1px, transparent 1px)
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
          <filter id="room-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow
              dx="0"
              dy="2"
              stdDeviation="3"
              floodColor="rgba(0,0,0,0.15)"
            />
          </filter>
          <pattern id="tile-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="0.8"/>
          </pattern>
          <pattern id="bath-tile-pattern" width="16" height="16" patternUnits="userSpaceOnUse">
            <rect width="16" height="16" fill="#cbb7a1"/>
            <path d="M 16 0 L 0 0 0 16" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1"/>
          </pattern>
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

          {/* ── Ghost ground-floor rooms (reference for upper floors) ── */}
          {isUpperFloor && ghostRooms.length > 0 && (
            <g pointerEvents="none">
              {/* Overall bounding box outline */}
              {(() => {
                const minX = Math.min(...ghostRooms.map((r) => r.x));
                const minY = Math.min(...ghostRooms.map((r) => r.y));
                const maxX = Math.max(...ghostRooms.map((r) => r.x + r.width));
                const maxY = Math.max(...ghostRooms.map((r) => r.y + r.height));
                return (
                  <rect
                    x={minX - 6}
                    y={minY - 6}
                    width={maxX - minX + 12}
                    height={maxY - minY + 12}
                    fill="none"
                    stroke="rgba(79,142,247,0.4)"
                    strokeWidth={2 / z}
                    strokeDasharray={`${12 / z} ${6 / z}`}
                    rx={4}
                  />
                );
              })()}

              {/* Per-room ghost rectangles */}
              {ghostRooms.map((room) => (
                <g key={`ghost-room-${room.id}`}>
                  <rect
                    x={room.x}
                    y={room.y}
                    width={room.width}
                    height={room.height}
                    fill="rgba(79,142,247,0.06)"
                    stroke="rgba(79,142,247,0.30)"
                    strokeWidth={1.5 / z}
                    strokeDasharray={`${6 / z} ${3 / z}`}
                    rx={2}
                  />
                  {/* Room label */}
                  <text
                    x={room.x + room.width / 2}
                    y={room.y + room.height / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="rgba(79,142,247,0.55)"
                    fontSize={Math.max(7, 9 / z)}
                    fontFamily="Inter,sans-serif"
                    fontWeight="500"
                  >
                    {room.name}
                  </text>
                </g>
              ))}

              {/* Legend label */}
              {ghostRooms.length > 0 && (() => {
                const minX = Math.min(...ghostRooms.map((r) => r.x));
                const minY = Math.min(...ghostRooms.map((r) => r.y));
                return (
                  <text
                    x={minX}
                    y={minY - 14 / z}
                    fill="rgba(79,142,247,0.6)"
                    fontSize={Math.max(7, 9 / z)}
                    fontFamily="Inter,sans-serif"
                    fontWeight="600"
                  >
                    ⬇ Ground floor layout (reference)
                  </text>
                );
              })()}
            </g>
          )}

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

          {/* ── Entrance & Back Porch Slabs (matching reference image) ── */}
          {visRooms.length > 0 && (
            <g pointerEvents="none">
              {/* Bottom Main Entrance Porch */}
              <rect x={460} y={1050} width={240} height={35} fill={themeColors.porchFill} stroke={themeColors.wallStroke} strokeWidth={1.5 / z} rx={2} />
              <line x1={460} y1={1067} x2={700} y2={1067} stroke={themeColors.wallStroke} strokeWidth={1 / z} />
              {/* Top Back Exit Porch */}
              <rect x={480} y={65} width={200} height={35} fill={themeColors.porchFill} stroke={themeColors.wallStroke} strokeWidth={1.5 / z} rx={2} />
              <line x1={480} y1={82} x2={680} y2={82} stroke={themeColors.wallStroke} strokeWidth={1 / z} />
            </g>
          )}

          {/* ── AutoCAD Outer Dimension Lines (14.20 m × 11.60 m) ── */}
          {visRooms.length > 0 && (
            <g pointerEvents="none">
              {/* TOP DIMENSION LINE (14.20 m) */}
              <line x1={100} y1={30} x2={1120} y2={30} stroke={themeColors.outerDimLine} strokeWidth={1.2 / z} />
              <circle cx={100} cy={30} r={4 / z} fill={themeColors.outerDimLine} />
              <circle cx={1120} cy={30} r={4 / z} fill={themeColors.outerDimLine} />
              <line x1={100} y1={20} x2={100} y2={90} stroke={themeColors.outerDimLine} strokeWidth={0.8 / z} strokeOpacity="0.5" />
              <line x1={1120} y1={20} x2={1120} y2={90} stroke={themeColors.outerDimLine} strokeWidth={0.8 / z} strokeOpacity="0.5" />
              <text x={610} y={22} textAnchor="middle" fill={themeColors.outerDimText} fontSize={Math.max(8, 14 / z)} fontWeight="700" fontFamily="Inter, sans-serif">14.20 m</text>

              {/* BOTTOM DIMENSION LINE (14.20 m) */}
              <line x1={100} y1={1120} x2={1120} y2={1120} stroke={themeColors.outerDimLine} strokeWidth={1.2 / z} />
              <circle cx={100} cy={1120} r={4 / z} fill={themeColors.outerDimLine} />
              <circle cx={1120} cy={1120} r={4 / z} fill={themeColors.outerDimLine} />
              <line x1={100} y1={1060} x2={100} y2={1130} stroke={themeColors.outerDimLine} strokeWidth={0.8 / z} strokeOpacity="0.5" />
              <line x1={1120} y1={1060} x2={1120} y2={1130} stroke={themeColors.outerDimLine} strokeWidth={0.8 / z} strokeOpacity="0.5" />
              <text x={610} y={1142} textAnchor="middle" fill={themeColors.outerDimText} fontSize={Math.max(8, 14 / z)} fontWeight="700" fontFamily="Inter, sans-serif">14.20 m</text>

              {/* LEFT DIMENSION LINE (11.60 m) */}
              <line x1={30} y1={100} x2={30} y2={1050} stroke={themeColors.outerDimLine} strokeWidth={1.2 / z} />
              <circle cx={30} cy={100} r={4 / z} fill={themeColors.outerDimLine} />
              <circle cx={30} cy={1050} r={4 / z} fill={themeColors.outerDimLine} />
              <line x1={20} y1={100} x2={90} y2={100} stroke={themeColors.outerDimLine} strokeWidth={0.8 / z} strokeOpacity="0.5" />
              <line x1={20} y1={1050} x2={90} y2={1050} stroke={themeColors.outerDimLine} strokeWidth={0.8 / z} strokeOpacity="0.5" />
              <text x={20} y={575} textAnchor="middle" fill={themeColors.outerDimText} fontSize={Math.max(8, 14 / z)} fontWeight="700" fontFamily="Inter, sans-serif" transform={`rotate(-90, 20, 575)`}>11.60 m</text>

              {/* RIGHT DIMENSION LINE (11.60 m) */}
              <line x1={1190} y1={100} x2={1190} y2={1050} stroke={themeColors.outerDimLine} strokeWidth={1.2 / z} />
              <circle cx={1190} cy={100} r={4 / z} fill={themeColors.outerDimLine} />
              <circle cx={1190} cy={1050} r={4 / z} fill={themeColors.outerDimLine} />
              <line x1={1130} y1={100} x2={1200} y2={100} stroke={themeColors.outerDimLine} strokeWidth={0.8 / z} strokeOpacity="0.5" />
              <line x1={1130} y1={1050} x2={1200} y2={1050} stroke={themeColors.outerDimLine} strokeWidth={0.8 / z} strokeOpacity="0.5" />
              <text x={1205} y={575} textAnchor="middle" fill={themeColors.outerDimText} fontSize={Math.max(8, 14 / z)} fontWeight="700" fontFamily="Inter, sans-serif" transform={`rotate(90, 1205, 575)`}>11.60 m</text>
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

                {/* Room Floor Fill */}
                <rect
                  x={room.x}
                  y={room.y}
                  width={room.width}
                  height={room.height}
                  fill={
                    room.type === "bathroom"
                      ? themeColors.roomFillBath
                      : themeColors.roomFillStd
                  }
                />
                {/* Tile overlay */}
                <rect
                  x={room.x}
                  y={room.y}
                  width={room.width}
                  height={room.height}
                  fill="url(#tile-pattern)"
                  pointerEvents="none"
                />

                {/* Solid AutoCAD Walls */}
                <rect
                  x={room.x}
                  y={room.y}
                  width={room.width}
                  height={room.height}
                  fill="none"
                  stroke={sel ? "#4f8ef7" : themeColors.wallFill}
                  strokeWidth={sel ? Math.max(3 / z, 14 / z) : 16 / z}
                />

                {/* AutoCAD Room Labels (Title + Dimensions String) */}
                <text
                  x={room.x + room.width / 2}
                  y={room.y + room.height / 2 - 6}
                  textAnchor="middle"
                  fill={themeColors.roomTitleText}
                  fontSize={Math.max(7, 13 / z)}
                  fontWeight="700"
                  fontFamily="'Space Grotesk', Inter, sans-serif"
                  letterSpacing="0.04em"
                  pointerEvents="none"
                >
                  {room.name.toUpperCase()}
                </text>
                <text
                  x={room.x + room.width / 2}
                  y={room.y + room.height / 2 + 10}
                  textAnchor="middle"
                  fill={themeColors.roomDimText}
                  fontSize={Math.max(6, 10 / z)}
                  fontFamily="Inter, sans-serif"
                  fontWeight="500"
                  pointerEvents="none"
                >
                  {(room.width / 100).toFixed(1)}m × {(room.height / 100).toFixed(1)}m
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

          {/* Doors — AutoCAD Architectural Door Graphic with Quarter-Arc Swing */}
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
            const isDouble = door.type === "door_double";
            const leafLength = isDouble ? door.width / 2 : door.width;

            // Compute exact arc and leaf line coordinates based on wall direction
            let arcPath = "";
            let openTipX = t.x;
            let openTipY = t.y;
            let closedTipX = t.x + door.width;
            let closedTipY = t.y + WALL_THICKNESS / 2;
            let hingeX = t.x;
            let hingeY = t.y + WALL_THICKNESS / 2;

            if (isH) {
              if (door.wall === "bottom") {
                // Swings up into room
                arcPath = `M ${t.x + leafLength} ${t.y + WALL_THICKNESS} A ${leafLength} ${leafLength} 0 0 0 ${t.x} ${t.y + WALL_THICKNESS - leafLength}`;
                openTipX = t.x;
                openTipY = t.y + WALL_THICKNESS / 2 - leafLength;
                closedTipX = t.x + leafLength;
                closedTipY = t.y + WALL_THICKNESS / 2;
                hingeX = t.x;
                hingeY = t.y + WALL_THICKNESS / 2;
              } else {
                // Swings down into room
                arcPath = `M ${t.x + leafLength} ${t.y} A ${leafLength} ${leafLength} 0 0 1 ${t.x} ${t.y + leafLength}`;
                openTipX = t.x;
                openTipY = t.y + WALL_THICKNESS / 2 + leafLength;
                closedTipX = t.x + leafLength;
                closedTipY = t.y + WALL_THICKNESS / 2;
                hingeX = t.x;
                hingeY = t.y + WALL_THICKNESS / 2;
              }
            } else {
              if (door.wall === "left") {
                // Swings right into room
                arcPath = `M ${t.x} ${t.y + leafLength} A ${leafLength} ${leafLength} 0 0 0 ${t.x + leafLength} ${t.y}`;
                openTipX = t.x + WALL_THICKNESS / 2 + leafLength;
                openTipY = t.y;
                closedTipX = t.x + WALL_THICKNESS / 2;
                closedTipY = t.y + leafLength;
                hingeX = t.x + WALL_THICKNESS / 2;
                hingeY = t.y;
              } else {
                // Swings left into room
                arcPath = `M ${t.x + WALL_THICKNESS} ${t.y + leafLength} A ${leafLength} ${leafLength} 0 0 1 ${t.x + WALL_THICKNESS - leafLength} ${t.y}`;
                openTipX = t.x + WALL_THICKNESS / 2 - leafLength;
                openTipY = t.y;
                closedTipX = t.x + WALL_THICKNESS / 2;
                closedTipY = t.y + leafLength;
                hingeX = t.x + WALL_THICKNESS / 2;
                hingeY = t.y;
              }
            }

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
                {/* Wall Opening Gap */}
                <rect
                  x={t.x}
                  y={t.y}
                  width={t.w}
                  height={t.h}
                  fill={themeColors.roomFillStd}
                />

                {/* Selection Highlight */}
                {isSel && (
                  <rect
                    x={t.x - 4 / z}
                    y={t.y - 4 / z}
                    width={t.w + 8 / z}
                    height={t.h + 8 / z}
                    fill="none"
                    stroke="#4f8ef7"
                    strokeWidth={2 / z}
                    strokeDasharray={`${4 / z} ${2 / z}`}
                    rx={2}
                  />
                )}

                {/* AutoCAD Wall Jamb Caps */}
                {isH ? (
                  <>
                    <rect x={t.x - 2} y={t.y - 3} width={4} height={WALL_THICKNESS + 6} fill={themeColors.doorJamb} />
                    <rect x={t.x + door.width - 2} y={t.y - 3} width={4} height={WALL_THICKNESS + 6} fill={themeColors.doorJamb} />
                  </>
                ) : (
                  <>
                    <rect x={t.x - 3} y={t.y - 2} width={WALL_THICKNESS + 6} height={4} fill={themeColors.doorJamb} />
                    <rect x={t.x - 3} y={t.y + door.width - 2} width={WALL_THICKNESS + 6} height={4} fill={themeColors.doorJamb} />
                  </>
                )}

                {/* Architectural Door Swing Graphic */}
                {isDouble ? (
                  // Double Door Swing (Entrance)
                  <>
                    <path
                      d={`M ${t.x + leafLength} ${t.y + WALL_THICKNESS} A ${leafLength} ${leafLength} 0 0 0 ${t.x} ${t.y + WALL_THICKNESS - leafLength} M ${t.x + leafLength} ${t.y + WALL_THICKNESS} A ${leafLength} ${leafLength} 0 0 1 ${t.x + door.width} ${t.y + WALL_THICKNESS - leafLength}`}
                      fill="none"
                      stroke={themeColors.doorArc}
                      strokeWidth={1.2 / z}
                      strokeDasharray={isOpen ? `${3 / z} ${2 / z}` : undefined}
                    />
                    <line
                      x1={t.x}
                      y1={t.y + WALL_THICKNESS / 2}
                      x2={isOpen ? t.x : t.x + leafLength}
                      y2={isOpen ? t.y + WALL_THICKNESS / 2 - leafLength : t.y + WALL_THICKNESS / 2}
                      stroke={themeColors.doorLeaf}
                      strokeWidth={2.5 / z}
                    />
                    <line
                      x1={t.x + door.width}
                      y1={t.y + WALL_THICKNESS / 2}
                      x2={isOpen ? t.x + door.width : t.x + leafLength}
                      y2={isOpen ? t.y + WALL_THICKNESS / 2 - leafLength : t.y + WALL_THICKNESS / 2}
                      stroke={themeColors.doorLeaf}
                      strokeWidth={2.5 / z}
                    />
                  </>
                ) : (
                  // Single Door Swing
                  <>
                    <path
                      d={arcPath}
                      fill="none"
                      stroke={themeColors.doorArc}
                      strokeWidth={1.2 / z}
                      strokeDasharray={isOpen ? `${3 / z} ${2 / z}` : undefined}
                    />
                    <line
                      x1={hingeX}
                      y1={hingeY}
                      x2={isOpen ? openTipX : closedTipX}
                      y2={isOpen ? openTipY : closedTipY}
                      stroke={themeColors.doorLeaf}
                      strokeWidth={2.5 / z}
                    />
                  </>
                )}
              </g>
            );
          })}

          {/* Windows — AutoCAD Glass Sash Line Graphics */}
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
                {/* Wall Opening Gap */}
                <rect
                  x={t.x}
                  y={t.y}
                  width={t.w}
                  height={t.h}
                  fill={themeColors.roomFillStd}
                />

                {/* Selection Highlight */}
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

                {/* Jamb Caps */}
                {isH ? (
                  <>
                    <line x1={t.x} y1={t.y - 2} x2={t.x} y2={t.y + WALL_THICKNESS + 2} stroke={themeColors.wallStroke} strokeWidth={2.5 / z} />
                    <line x1={t.x + win.width} y1={t.y - 2} x2={t.x + win.width} y2={t.y + WALL_THICKNESS + 2} stroke={themeColors.wallStroke} strokeWidth={2.5 / z} />
                    {/* Glass Panes */}
                    <line x1={t.x} y1={t.y + 3} x2={t.x + win.width} y2={t.y + 3} stroke={themeColors.windowPane} strokeWidth={1.2 / z} />
                    <line x1={t.x} y1={t.y + WALL_THICKNESS - 3} x2={t.x + win.width} y2={t.y + WALL_THICKNESS - 3} stroke={themeColors.windowPane} strokeWidth={1.2 / z} />
                    <line x1={t.x} y1={t.y + WALL_THICKNESS / 2} x2={t.x + win.width} y2={t.y + WALL_THICKNESS / 2} stroke={themeColors.windowPane} strokeWidth={0.8 / z} strokeDasharray="4 2" />
                  </>
                ) : (
                  <>
                    <line x1={t.x - 2} y1={t.y} x2={t.x + WALL_THICKNESS + 2} y2={t.y} stroke={themeColors.wallStroke} strokeWidth={2.5 / z} />
                    <line x1={t.x - 2} y1={t.y + win.width} x2={t.x + WALL_THICKNESS + 2} y2={t.y + win.width} stroke={themeColors.wallStroke} strokeWidth={2.5 / z} />
                    {/* Glass Panes */}
                    <line x1={t.x + 3} y1={t.y} x2={t.x + 3} y2={t.y + win.width} stroke={themeColors.windowPane} strokeWidth={1.2 / z} />
                    <line x1={t.x + WALL_THICKNESS - 3} y1={t.y} x2={t.x + WALL_THICKNESS - 3} y2={t.y + win.width} stroke={themeColors.windowPane} strokeWidth={1.2 / z} />
                    <line x1={t.x + WALL_THICKNESS / 2} y1={t.y} x2={t.x + WALL_THICKNESS / 2} y2={t.y + win.width} stroke={themeColors.windowPane} strokeWidth={0.8 / z} strokeDasharray="4 2" />
                  </>
                )}
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
              themeColors={themeColors}
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

function Furniture2D({ item, selected, z, themeColors, onClick, onMouseDown }) {
  const { x, y, width: w, height: h, label, type, rotation = 0 } = item;
  const rot = rotation || 0;
  const cx = x + w / 2;
  const cy = y + h / 2;

  const fFill = themeColors?.furnFill || "#ffffff";
  const fStroke = themeColors?.furnStroke || "#181818";
  const fText = themeColors?.furnText || "#111111";

  const renderDetails = () => {
    switch (type) {
      case "plant":
        // Starburst Radial Leaves Plant (as in architectural drawing)
        return (
          <g>
            {/* Outer Starburst Leaf Ring */}
            <path
              d={`
                M ${cx} ${cy - h * 0.48}
                L ${cx + w * 0.1} ${cy - h * 0.2}
                L ${cx + w * 0.35} ${cy - h * 0.35}
                L ${cx + w * 0.2} ${cy - h * 0.1}
                L ${cx + w * 0.48} ${cy}
                L ${cx + w * 0.2} ${cy + h * 0.1}
                L ${cx + w * 0.35} ${cy + h * 0.35}
                L ${cx + w * 0.1} ${cy + h * 0.2}
                L ${cx} ${cy + h * 0.48}
                L ${cx - w * 0.1} ${cy + h * 0.2}
                L ${cx - w * 0.35} ${cy + h * 0.35}
                L ${cx - w * 0.2} ${cy + h * 0.1}
                L ${cx - w * 0.48} ${cy}
                L ${cx - w * 0.2} ${cy - h * 0.1}
                L ${cx - w * 0.35} ${cy - h * 0.35}
                L ${cx - w * 0.1} ${cy - h * 0.2}
                Z
              `}
              fill="#8ab470"
              stroke="#213d10"
              strokeWidth={1.2 / z}
            />
            {/* Inner Leaf Accent Ring */}
            <circle cx={cx} cy={cy} r={Math.min(w, h) * 0.25} fill="#629248" stroke="#162c0b" strokeWidth={1 / z} />
            {/* Center Pot */}
            <circle cx={cx} cy={cy} r={Math.min(w, h) * 0.14} fill="#c89250" stroke="#603810" strokeWidth={1 / z} />
          </g>
        );

      case "stairs":
        // Architectural Staircase with Treads and Direction Arrow
        const stepCount = 8;
        const stepH = h / stepCount;
        return (
          <g>
            <rect x={x} y={y} width={w} height={h} fill={fFill} stroke={fStroke} strokeWidth={1.5 / z} />
            {Array.from({ length: stepCount }).map((_, i) => (
              <line
                key={i}
                x1={x}
                y1={y + i * stepH}
                x2={x + w}
                y2={y + i * stepH}
                stroke={fStroke}
                strokeWidth={1.2 / z}
              />
            ))}
            {/* Center Handrail & UP Arrow */}
            <line x1={cx} y1={y + h * 0.85} x2={cx} y2={y + h * 0.15} stroke={fStroke} strokeWidth={1.5 / z} />
            <path d={`M ${cx - 8} ${y + h * 0.3} L ${cx} ${y + h * 0.15} L ${cx + 8} ${y + h * 0.3}`} fill="none" stroke={fStroke} strokeWidth={1.8 / z} />
            <text x={cx} y={y + h * 0.95} textAnchor="middle" fill={fText} fontSize={Math.max(6, 9 / z)} fontWeight="700" fontFamily="Inter">UP ↑</text>
          </g>
        );

      case "sofa":
        return (
          <g>
            {/* Outer Frame */}
            <rect x={x} y={y} width={w} height={h} fill={fFill} stroke={fStroke} strokeWidth={1.5 / z} rx={3 / z} />
            {/* Backrest Cushion */}
            <rect x={x + 2} y={y + 2} width={w - 4} height={h * 0.28} fill={fFill} stroke={fStroke} strokeWidth={1.2 / z} rx={2 / z} />
            {/* Armrests */}
            <rect x={x + 2} y={y + 2} width={w * 0.16} height={h - 4} fill={fFill} stroke={fStroke} strokeWidth={1.2 / z} rx={2 / z} />
            <rect x={x + w - w * 0.16 - 2} y={y + 2} width={w * 0.16} height={h - 4} fill={fFill} stroke={fStroke} strokeWidth={1.2 / z} rx={2 / z} />
            {/* Seat Cushions */}
            <rect x={x + w * 0.18} y={y + h * 0.3} width={(w * 0.64) / 2 - 1} height={h * 0.65} fill={fFill} stroke={fStroke} strokeWidth={1 / z} rx={2 / z} />
            <rect x={x + w * 0.18 + (w * 0.64) / 2 + 1} y={y + h * 0.3} width={(w * 0.64) / 2 - 1} height={h * 0.65} fill={fFill} stroke={fStroke} strokeWidth={1 / z} rx={2 / z} />
          </g>
        );

      case "armchair":
        return (
          <g>
            <rect x={x} y={y} width={w} height={h} fill={fFill} stroke={fStroke} strokeWidth={1.5 / z} rx={3 / z} />
            <rect x={x + 3} y={y + 3} width={w - 6} height={h * 0.3} fill={fFill} stroke={fStroke} strokeWidth={1.2 / z} rx={2 / z} />
            <rect x={x + 3} y={y + 3} width={w * 0.22} height={h - 6} fill={fFill} stroke={fStroke} strokeWidth={1.2 / z} rx={2 / z} />
            <rect x={x + w - w * 0.22 - 3} y={y + 3} width={w * 0.22} height={h - 6} fill={fFill} stroke={fStroke} strokeWidth={1.2 / z} rx={2 / z} />
            <rect x={x + w * 0.24} y={y + h * 0.32} width={w * 0.52} height={h * 0.62} fill={fFill} stroke={fStroke} strokeWidth={1 / z} rx={2 / z} />
          </g>
        );

      case "bed_king":
      case "bed_queen":
      case "bed_double":
      case "bed_single":
      case "bed":
        const isKingQueen = type === "bed_king" || type === "bed_queen" || type === "bed_double";
        return (
          <g>
            {/* Outer Frame */}
            <rect x={x} y={y} width={w} height={h} fill={fFill} stroke={fStroke} strokeWidth={1.5 / z} rx={2 / z} />
            {/* Headboard */}
            <rect x={x + 2} y={y + 2} width={w - 4} height={h * 0.08} fill={fStroke} />
            {/* Mattress */}
            <rect x={x + 4} y={y + h * 0.1} width={w - 8} height={h * 0.86} fill={fFill} stroke={fStroke} strokeWidth={1 / z} rx={2 / z} />
            {/* Pillows */}
            {isKingQueen ? (
              <>
                <rect x={x + w * 0.08} y={y + h * 0.14} width={w * 0.38} height={h * 0.18} fill={fFill} stroke={fStroke} strokeWidth={1 / z} rx={3 / z} />
                <rect x={x + w * 0.54} y={y + h * 0.14} width={w * 0.38} height={h * 0.18} fill={fFill} stroke={fStroke} strokeWidth={1 / z} rx={3 / z} />
              </>
            ) : (
              <rect x={x + w * 0.2} y={y + h * 0.14} width={w * 0.6} height={h * 0.18} fill={fFill} stroke={fStroke} strokeWidth={1 / z} rx={3 / z} />
            )}
            {/* Folded Duvet Line */}
            <line x1={x + 4} y1={y + h * 0.38} x2={x + w - 4} y2={y + h * 0.38} stroke={fStroke} strokeWidth={1.2 / z} strokeDasharray="6 3" />
          </g>
        );

      case "dining_6":
      case "dining_4":
        return (
          <g>
            {/* Dining Table */}
            <rect x={x + w * 0.18} y={y + h * 0.15} width={w * 0.64} height={h * 0.7} fill={fFill} stroke={fStroke} strokeWidth={1.5 / z} rx={3 / z} />
            {/* Top Chairs */}
            <rect x={x + w * 0.22} y={y} width={w * 0.16} height={h * 0.12} fill={fFill} stroke={fStroke} strokeWidth={1.2 / z} rx={3 / z} />
            <rect x={x + w * 0.42} y={y} width={w * 0.16} height={h * 0.12} fill={fFill} stroke={fStroke} strokeWidth={1.2 / z} rx={3 / z} />
            <rect x={x + w * 0.62} y={y} width={w * 0.16} height={h * 0.12} fill={fFill} stroke={fStroke} strokeWidth={1.2 / z} rx={3 / z} />
            {/* Bottom Chairs */}
            <rect x={x + w * 0.22} y={y + h * 0.88} width={w * 0.16} height={h * 0.12} fill={fFill} stroke={fStroke} strokeWidth={1.2 / z} rx={3 / z} />
            <rect x={x + w * 0.42} y={y + h * 0.88} width={w * 0.16} height={h * 0.12} fill={fFill} stroke={fStroke} strokeWidth={1.2 / z} rx={3 / z} />
            <rect x={x + w * 0.62} y={y + h * 0.88} width={w * 0.16} height={h * 0.12} fill={fFill} stroke={fStroke} strokeWidth={1.2 / z} rx={3 / z} />
          </g>
        );

      case "nightstand":
        return (
          <g>
            <rect x={x} y={y} width={w} height={h} fill={fFill} stroke={fStroke} strokeWidth={1.2 / z} rx={2 / z} />
            <circle cx={cx} cy={cy} r={Math.min(w, h) * 0.2} fill={fFill} stroke={fStroke} strokeWidth={1 / z} />
          </g>
        );

      case "tv_unit":
        return (
          <g>
            <rect x={x} y={y} width={w} height={h} fill={fFill} stroke={fStroke} strokeWidth={1.5 / z} rx={2 / z} />
            <rect x={x + w * 0.2} y={y + 4} width={w * 0.6} height={h - 8} fill={fStroke} rx={1 / z} />
          </g>
        );

      case "desk":
        // Kitchen Counter / Sink / Desk
        return (
          <g>
            <rect x={x} y={y} width={w} height={h} fill={fFill} stroke={fStroke} strokeWidth={1.5 / z} rx={2 / z} />
            {/* Double Basin Sink Bowls */}
            <rect x={x + 10} y={y + 6} width={w * 0.38} height={h - 12} fill={fFill} stroke={fStroke} strokeWidth={1 / z} rx={4 / z} />
            <rect x={x + 10 + w * 0.42} y={y + 6} width={w * 0.38} height={h - 12} fill={fFill} stroke={fStroke} strokeWidth={1 / z} rx={4 / z} />
            <circle cx={x + 10 + w * 0.4} cy={cy} r={4 / z} fill={fStroke} />
          </g>
        );

      default:
        return (
          <rect x={x} y={y} width={w} height={h} fill={fFill} stroke={fStroke} strokeWidth={1.5 / z} rx={2 / z} />
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
          rx={4 / z}
        />
      )}
      {renderDetails()}
      {label && type !== "plant" && (
        <text
          x={cx}
          y={cy + 3}
          textAnchor="middle"
          fill={fText}
          fontSize={Math.max(6, 8 / z)}
          fontWeight="600"
          fontFamily="Inter, sans-serif"
          pointerEvents="none"
        >
          {label}
        </text>
      )}
    </g>
  );
}
