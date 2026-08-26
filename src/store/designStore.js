import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

let nextId = 100;
const genId = (prefix = "el") =>
  `${prefix}-${nextId++}-${Math.random().toString(36).slice(2, 6)}`;

function rectToPoints(g) {
  const x = g.x ?? 0;
  const y = g.y ?? 0;
  const w = g.width ?? 0;
  const h = g.height ?? 0;
  return [
    { x, y },
    { x: x + w, y },
    { x: x + w, y: y + h },
    { x, y: y + h },
  ];
}

function normalizeGround(g) {
  if (Array.isArray(g.points) && g.points.length >= 3) {
    return {
      ...g,
      points: g.points.map((p) => ({ x: +p.x, y: +p.y })),
    };
  }
  return {
    ...g,
    points: rectToPoints(g),
  };
}

function pointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi || 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function rectInsideAnyGround(x, y, width, height, grounds) {
  const corners = [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height },
  ];
  return corners.every((corner) =>
    grounds.some((g) => pointInPolygon(corner, g.points)),
  );
}

function convexHull(points) {
  if (points.length < 3) return points;
  const sorted = [...points].sort((a, b) =>
    a.x === b.x ? a.y - b.y : a.x - b.x,
  );
  const cross = (o, a, b) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  const lower = [];
  for (const p of sorted) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
    ) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper = [];
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    const p = sorted[i];
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0
    ) {
      upper.pop();
    }
    upper.push(p);
  }

  upper.pop();
  lower.pop();
  return [...lower, ...upper];
}

// ─── Default rooms & furniture for demo architectural plan (matching blueprint image) ─────────
const DEFAULT_ROOMS = [
  {
    id: "room-b1",
    name: "BEDROOM 1",
    x: 100,
    y: 100,
    width: 400,
    height: 400,
    color: "#fbf9f4",
    floor: 0,
    type: "bedroom",
  },
  {
    id: "room-bath",
    name: "BATH",
    x: 500,
    y: 100,
    width: 200,
    height: 200,
    color: "#d0baa4",
    floor: 0,
    type: "bathroom",
  },
  {
    id: "room-kit",
    name: "KITCHEN",
    x: 700,
    y: 100,
    width: 420,
    height: 400,
    color: "#fbf9f4",
    floor: 0,
    type: "kitchen",
  },
  {
    id: "room-toilet",
    name: "TOILET",
    x: 100,
    y: 500,
    width: 200,
    height: 150,
    color: "#d0baa4",
    floor: 0,
    type: "bathroom",
  },
  {
    id: "room-b2",
    name: "BEDROOM 2",
    x: 100,
    y: 650,
    width: 400,
    height: 400,
    color: "#fbf9f4",
    floor: 0,
    type: "bedroom",
  },
  {
    id: "room-liv",
    name: "LIVING ROOM",
    x: 500,
    y: 460,
    width: 620,
    height: 590,
    color: "#fbf9f4",
    floor: 0,
    type: "living",
  },
];

const DEFAULT_DOORS = [
  { id: "door-ent", roomId: "room-liv", wall: "bottom", position: 0.25, width: 110, type: "door_double" },
  { id: "door-b1", roomId: "room-b1", wall: "bottom", position: 0.85, width: 85 },
  { id: "door-b2", roomId: "room-b2", wall: "top", position: 0.85, width: 85 },
  { id: "door-toilet", roomId: "room-toilet", wall: "bottom", position: 0.6, width: 70 },
  { id: "door-bath", roomId: "room-bath", wall: "bottom", position: 0.4, width: 75 },
];

const DEFAULT_WINDOWS = [
  { id: "win-b1", roomId: "room-b1", wall: "top", position: 0.5, width: 140 },
  { id: "win-b2", roomId: "room-b2", wall: "bottom", position: 0.5, width: 140 },
  { id: "win-kit", roomId: "room-kit", wall: "top", position: 0.6, width: 140 },
  { id: "win-din", roomId: "room-liv", wall: "bottom", position: 0.85, width: 140 },
  { id: "win-kit-r", roomId: "room-kit", wall: "right", position: 0.2, width: 90 },
];

const DEFAULT_FURNITURE = [
  // Bedroom 1 Bed & Nightstands
  { id: "f-bed1", roomId: "room-b1", type: "bed_king", x: 120, y: 190, width: 170, height: 180, color: "#ffffff", label: "King Bed", rotation: 90, floor: 0 },
  { id: "f-ns1a", roomId: "room-b1", type: "nightstand", x: 120, y: 150, width: 35, height: 35, color: "#ffffff", label: "", rotation: 0, floor: 0 },
  { id: "f-ns1b", roomId: "room-b1", type: "nightstand", x: 120, y: 375, width: 35, height: 35, color: "#ffffff", label: "", rotation: 0, floor: 0 },
  { id: "f-plant1", roomId: "room-b1", type: "plant", x: 440, y: 120, width: 45, height: 45, color: "#8ab470", label: "", rotation: 0, floor: 0 },

  // Bedroom 2 Bed & Nightstands
  { id: "f-bed2", roomId: "room-b2", type: "bed_king", x: 120, y: 740, width: 170, height: 180, color: "#ffffff", label: "King Bed", rotation: 90, floor: 0 },
  { id: "f-ns2a", roomId: "room-b2", type: "nightstand", x: 120, y: 700, width: 35, height: 35, color: "#ffffff", label: "", rotation: 0, floor: 0 },
  { id: "f-ns2b", roomId: "room-b2", type: "nightstand", x: 120, y: 925, width: 35, height: 35, color: "#ffffff", label: "", rotation: 0, floor: 0 },
  { id: "f-plant2", roomId: "room-b2", type: "plant", x: 440, y: 1000, width: 45, height: 45, color: "#8ab470", label: "", rotation: 0, floor: 0 },

  // Living Room Sofa & Armchair
  { id: "f-sofa", roomId: "room-liv", type: "sofa", x: 800, y: 640, width: 75, height: 210, color: "#ffffff", label: "Sofa", rotation: 0, floor: 0 },
  { id: "f-armchair1", roomId: "room-liv", type: "armchair", x: 790, y: 900, width: 70, height: 70, color: "#ffffff", label: "Armchair", rotation: 0, floor: 0 },
  { id: "f-armchair2", roomId: "room-liv", type: "armchair", x: 740, y: 530, width: 60, height: 60, color: "#ffffff", label: "", rotation: 45, floor: 0 },
  { id: "f-tv", roomId: "room-liv", type: "tv_unit", x: 505, y: 670, width: 25, height: 150, color: "#111111", label: "TV Console", rotation: 0, floor: 0 },
  { id: "f-plant3", roomId: "room-liv", type: "plant", x: 820, y: 990, width: 45, height: 45, color: "#8ab470", label: "", rotation: 0, floor: 0 },

  // Dining Table Set (6 Seat)
  { id: "f-dining", roomId: "room-liv", type: "dining_6", x: 920, y: 700, width: 170, height: 240, color: "#ffffff", label: "Dining Set", rotation: 90, floor: 0 },

  // Kitchen Counters & Sink & Cooktop
  { id: "f-counter", roomId: "room-kit", type: "desk", x: 950, y: 110, width: 160, height: 45, color: "#ffffff", label: "Kitchen Sink", rotation: 0, floor: 0 },
  { id: "f-stove", roomId: "room-kit", type: "tv_unit", x: 1065, y: 180, width: 45, height: 110, color: "#ffffff", label: "Cooktop", rotation: 90, floor: 0 },
  { id: "f-island", roomId: "room-kit", type: "desk", x: 900, y: 410, width: 140, height: 35, color: "#cbb7a1", label: "", rotation: 0, floor: 0 },

  // Bathroom & Toilet Fixtures
  { id: "f-toilet1", roomId: "room-bath", type: "nightstand", x: 515, y: 120, width: 40, height: 60, color: "#ffffff", label: "WC", rotation: 0, floor: 0 },
  { id: "f-toilet2", roomId: "room-toilet", type: "nightstand", x: 230, y: 550, width: 40, height: 50, color: "#ffffff", label: "WC", rotation: 0, floor: 0 },
  { id: "f-stairs", roomId: "room-bath", type: "stairs", x: 500, y: 300, width: 190, height: 150, color: "#d0baa4", label: "STAIRS", rotation: 0, floor: 0 },
];

const DEFAULT_GROUNDS = [
  {
    id: "g-main",
    name: "Ground Footprint",
    floor: 0,
    points: [
      { x: 100, y: 100 },
      { x: 1120, y: 100 },
      { x: 1120, y: 1050 },
      { x: 100, y: 1050 },
    ],
  },
];

const AI_SUGGESTIONS = [
  {
    id: "s1",
    type: "lighting",
    severity: "warning",
    title: "Limited Natural Light",
    description:
      "Bathroom has no window. Consider adding a small window on the right wall for natural ventilation and light.",
    roomId: "room-5",
    action: "addWindow",
    applied: false,
  },
  {
    id: "s2",
    type: "space",
    severity: "info",
    title: "Open Plan Opportunity",
    description:
      "Removing the wall between Kitchen and Living Room could create a more spacious, modern open-plan layout.",
    roomId: "room-2",
    action: null,
    applied: false,
  },
  {
    id: "s3",
    type: "flow",
    severity: "success",
    title: "Good Traffic Flow",
    description:
      "The hallway provides excellent connectivity between all rooms. Circulation paths are well-optimized.",
    roomId: "room-6",
    action: null,
    applied: false,
  },
  {
    id: "s4",
    type: "furniture",
    severity: "info",
    title: "Furniture Arrangement",
    description:
      "The sofa in the Living Room could be repositioned to face the TV directly, improving viewing angles.",
    roomId: "room-1",
    action: null,
    applied: false,
  },
  {
    id: "s5",
    type: "safety",
    severity: "warning",
    title: "Emergency Egress",
    description:
      "Master Bedroom has only one exit. Building codes recommend at least one emergency egress window.",
    roomId: "room-3",
    action: "addWindow",
    applied: false,
  },
];

function deepClone(obj) {
  if (obj instanceof Set) {
    return new Set(obj);
  }
  if (typeof structuredClone === "function") {
    try {
      return structuredClone(obj);
    } catch {
      // fallback
    }
  }
  if (obj === null || typeof obj !== "object") return obj;
  return JSON.parse(JSON.stringify(obj));
}

function getDesignSnapshot(state) {
  return {
    grounds: deepClone(state.grounds),
    rooms: deepClone(state.rooms),
    doors: deepClone(state.doors),
    windows: deepClone(state.windows),
    furniture: deepClone(state.furniture),
    floors: deepClone(state.floors),
    pbrMaterialTheme: deepClone(state.pbrMaterialTheme),
    theme: state.theme,
    windowModes: deepClone(state.windowModes),
    entrances: deepClone(state.entrances || []),
    openDoors: new Set(state.openDoors || []),
    openWindows: new Set(state.openWindows || []),
    aiSuggestions: deepClone(state.aiSuggestions || []),
  };
}

let lastHistoryTime = 0;
const MAX_HISTORY = 50;

function saveHistory(get, set, force = false) {
  const state = get();
  const now = Date.now();
  const currentSnap = getDesignSnapshot(state);

  if (force || now - lastHistoryTime > 400) {
    const past = [...state.past, currentSnap].slice(-MAX_HISTORY);
    set({
      past,
      future: [],
      canUndo: past.length > 0,
      canRedo: false,
    });
    lastHistoryTime = now;
  }
}

export const useDesignStore = create(
  subscribeWithSelector((set, get) => ({
    // History state
    past: [],
    future: [],
    canUndo: false,
    canRedo: false,

    // Core state
    grounds: DEFAULT_GROUNDS,
    rooms: DEFAULT_ROOMS,
    doors: DEFAULT_DOORS,
    windows: DEFAULT_WINDOWS,
    furniture: DEFAULT_FURNITURE,
    aiSuggestions: AI_SUGGESTIONS,
    openDoors: new Set(), // Set of door IDs that are open
    openWindows: new Set(), // Set of window IDs that are unlocked/open
    windowModes: {}, // Map of windowId -> 'sliding' | 'casement'

    pbrMaterialTheme: {
      wallTexture: "modern_paint", // 'modern_paint' | 'brick_stone' | 'wood_panel' | 'concrete'
      floorTexture: "hardwood_parquet", // 'hardwood_parquet' | 'marble_tiles' | 'ceramic_tiles' | 'terracotta' | 'carpet'
      exteriorTexture: "siding_wood", // 'siding_wood' | 'stone_facade' | 'stucco'
    },

    entrances: [
      {
        id: "ent-1",
        roomId: "room-6",
        name: "Main Entrance",
        x: 310,
        y: 570,
        isSpawnPoint: true,
      },
    ],

    viewMode: "2d", // '2d' | '3d' | 'walkthrough' | 'vr'
    showAllFloorsIn3D: false,
    activeTool: "select", // 'select' | 'ground' | 'room' | 'door' | 'window' | 'furniture'
    activeFloor: 0,
    floors: [
      { id: 0, name: "Ground Floor", height: 0 },
    ],
    selectedId: null,
    showAIPanel: true,
    showRightPanel: true,
    showLibrary: false,
    zoom: 1,
    panX: 0,
    panY: 0,
    gridSize: 20,
    snapToGrid: true,
    canvas2DTheme: "light", // 'light' | 'dark'
    theme: "modern", // 'modern' | 'japandi' | 'industrial' | 'scandinavian' | 'cyberpunk'
    wallColor: "#e2e8f0",
    floorColor: "#f8f9fa",
    groundPreviewed3D: {},

    // Drawing state
    isDrawingRoom: false,
    drawStart: null,
    drawCurrent: null,

    draggingFurniture: null,
    resizingRoom: null,

    // ─── Undo / Redo Actions ───────────────────────────────────────────────────────
    undo: () => {
      const state = get();
      if (state.past.length === 0) return;

      const previousSnap = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, state.past.length - 1);
      const currentSnap = getDesignSnapshot(state);
      const newFuture = [currentSnap, ...state.future];

      let selectedId = state.selectedId;
      if (selectedId) {
        const exists =
          previousSnap.rooms.some((r) => r.id === selectedId) ||
          previousSnap.furniture.some((f) => f.id === selectedId) ||
          previousSnap.doors.some((d) => d.id === selectedId) ||
          previousSnap.windows.some((w) => w.id === selectedId) ||
          previousSnap.grounds.some((g) => g.id === selectedId);
        if (!exists) selectedId = null;
      }

      set({
        ...previousSnap,
        selectedId,
        past: newPast,
        future: newFuture,
        canUndo: newPast.length > 0,
        canRedo: true,
      });
      lastHistoryTime = 0;
    },

    redo: () => {
      const state = get();
      if (state.future.length === 0) return;

      const nextSnap = state.future[0];
      const newFuture = state.future.slice(1);
      const currentSnap = getDesignSnapshot(state);
      const newPast = [...state.past, currentSnap];

      let selectedId = state.selectedId;
      if (selectedId) {
        const exists =
          nextSnap.rooms.some((r) => r.id === selectedId) ||
          nextSnap.furniture.some((f) => f.id === selectedId) ||
          nextSnap.doors.some((d) => d.id === selectedId) ||
          nextSnap.windows.some((w) => w.id === selectedId) ||
          nextSnap.grounds.some((g) => g.id === selectedId);
        if (!exists) selectedId = null;
      }

      set({
        ...nextSnap,
        selectedId,
        past: newPast,
        future: newFuture,
        canUndo: true,
        canRedo: newFuture.length > 0,
      });
      lastHistoryTime = 0;
    },

    // ─── Actions ──────────────────────────────────────────────────────────────────
    setViewMode: (mode, options = {}) =>
      set((s) => {
        const showAllFloorsIn3D =
          mode === "3d" ? Boolean(options.allFloors) : false;

        if (mode !== "3d") {
          return { viewMode: mode, showAllFloorsIn3D: false };
        }

        const hasGround = s.grounds.some((g) => g.floor === s.activeFloor);
        const next = { viewMode: mode, showAllFloorsIn3D };
        if (!hasGround) return next;
        return {
          ...next,
          groundPreviewed3D: { ...s.groundPreviewed3D, [s.activeFloor]: true },
        };
      }),
    setActiveTool: (tool) => set({ activeTool: tool, selectedId: null }),
    setActiveFloor: (floor) => set({ activeFloor: floor }),

    // ── Floor management ──────────────────────────────────────────────────
    addFloor: () => {
      saveHistory(get, set, true);
      set((s) => {
        const newId = Date.now();
        const orderedFloors = [...s.floors].sort((a, b) => a.id - b.id);
        const newIndex = orderedFloors.length;
        const suffix =
          newIndex === 1 ? "1st"
          : newIndex === 2 ? "2nd"
          : newIndex === 3 ? "3rd"
          : `${newIndex}th`;
        const newFloor = { id: newId, name: `${suffix} Floor`, height: newIndex * 300 };

        const baseFloorId = orderedFloors[0].id;
        const baseRooms = s.rooms.filter((r) => r.floor === baseFloorId);

        let autoGrounds = [];

        if (baseRooms.length > 0) {
          const MARGIN = 10;
          const minX = Math.min(...baseRooms.map((r) => r.x)) - MARGIN;
          const minY = Math.min(...baseRooms.map((r) => r.y)) - MARGIN;
          const maxX = Math.max(...baseRooms.map((r) => r.x + r.width)) + MARGIN;
          const maxY = Math.max(...baseRooms.map((r) => r.y + r.height)) + MARGIN;

          autoGrounds = [{
            id: genId("ground"),
            floor: newId,
            name: "Auto (from ground floor rooms)",
            points: [
              { x: minX, y: minY },
              { x: maxX, y: minY },
              { x: maxX, y: maxY },
              { x: minX, y: maxY },
            ],
          }];
        } else {
          autoGrounds = s.grounds
            .filter((g) => g.floor === baseFloorId)
            .map((g) => ({
              ...g,
              id: genId("ground"),
              floor: newId,
              name: g.name + " (ref)",
            }));
        }

        return {
          floors: [...s.floors, newFloor],
          grounds: [...s.grounds, ...autoGrounds],
          activeFloor: newId,
          groundPreviewed3D: { ...s.groundPreviewed3D, [newId]: true },
        };
      });
    },

    deleteFloor: (id) => {
      saveHistory(get, set, true);
      set((s) => {
        if (s.floors.length <= 1) return {}; // must keep at least 1 floor
        const remaining = s.floors.filter((f) => f.id !== id);
        const newActive =
          s.activeFloor === id
            ? remaining[remaining.length - 1].id
            : s.activeFloor;
        return {
          floors: remaining,
          activeFloor: newActive,
          rooms: s.rooms.filter((r) => r.floor !== id),
          doors: s.doors.filter((d) => {
            const room = s.rooms.find((r) => r.id === d.roomId);
            return room ? room.floor !== id : true;
          }),
          windows: s.windows.filter((w) => {
            const room = s.rooms.find((r) => r.id === w.roomId);
            return room ? room.floor !== id : true;
          }),
          furniture: s.furniture.filter((f) => f.floor !== id),
          grounds: s.grounds.filter((g) => g.floor !== id),
          selectedId: null,
        };
      });
    },

    renameFloor: (id, name) => {
      saveHistory(get, set, true);
      set((s) => ({
        floors: s.floors.map((f) => (f.id === id ? { ...f, name } : f)),
      }));
    },

    setSelectedId: (id) => set({ selectedId: id }),
    setShowAIPanel: (v) => set({ showAIPanel: v }),
    setShowRightPanel: (v) => set({ showRightPanel: v }),
    toggleRightPanel: () => set((s) => ({ showRightPanel: !s.showRightPanel })),
    setShowLibrary: (v) => set({ showLibrary: v }),
    setZoom: (zoom) => set({ zoom: Math.min(3, Math.max(0.2, zoom)) }),
    setPan: (panX, panY) => set({ panX, panY }),
    setTheme: (theme) => {
      saveHistory(get, set, true);
      set({ theme });
    },
    setCanvas2DTheme: (canvas2DTheme) => set({ canvas2DTheme }),
    toggleCanvas2DTheme: () =>
      set((s) => ({ canvas2DTheme: s.canvas2DTheme === "light" ? "dark" : "light" })),
    setPBRMaterialTheme: (patch) => {
      saveHistory(get, set, true);
      set((s) => ({ pbrMaterialTheme: { ...s.pbrMaterialTheme, ...patch } }));
    },
    setSnapToGrid: (v) => set({ snapToGrid: v }),
    toggleWindowMode: (id) => {
      saveHistory(get, set, true);
      set((s) => {
        const current = s.windowModes[id] || "sliding";
        const nextMode = current === "sliding" ? "casement" : "sliding";
        return { windowModes: { ...s.windowModes, [id]: nextMode } };
      });
    },

    snap: (val) => {
      const { snapToGrid, gridSize } = get();
      return snapToGrid ? Math.round(val / gridSize) * gridSize : val;
    },

    // Room CRUD
    addRoom: (room) => {
      saveHistory(get, set, true);
      set((s) => ({
        rooms: [
          ...s.rooms,
          { id: genId("room"), floor: s.activeFloor, ...room },
        ],
      }));
    },
    updateRoom: (id, patch) => {
      saveHistory(get, set, false);
      set((s) => ({
        rooms: s.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      }));
    },
    deleteRoom: (id) => {
      saveHistory(get, set, true);
      set((s) => ({
        rooms: s.rooms.filter((r) => r.id !== id),
        doors: s.doors.filter((d) => d.roomId !== id),
        windows: s.windows.filter((w) => w.roomId !== id),
        furniture: s.furniture.filter((f) => f.roomId !== id),
        selectedId: s.selectedId === id ? null : s.selectedId,
      }));
    },

    // Ground footprint CRUD
    addGroundPolygon: (points) => {
      saveHistory(get, set, true);
      set((s) => ({
        grounds: [
          ...s.grounds,
          normalizeGround({
            id: genId("ground"),
            name: `Ground ${s.grounds.filter((g) => g.floor === s.activeFloor).length + 1}`,
            floor: s.activeFloor,
            points,
          }),
        ],
        groundPreviewed3D: { ...s.groundPreviewed3D, [s.activeFloor]: false },
      }));
    },
    updateGroundPolygon: (id, points) => {
      saveHistory(get, set, false);
      set((s) => ({
        grounds: s.grounds.map((g) =>
          g.id === id ? normalizeGround({ ...g, points }) : g,
        ),
        groundPreviewed3D: { ...s.groundPreviewed3D, [s.activeFloor]: false },
      }));
    },
    deleteGround: (id) => {
      saveHistory(get, set, true);
      set((s) => ({
        grounds: s.grounds.filter((g) => g.id !== id),
        selectedId: s.selectedId === id ? null : s.selectedId,
      }));
    },
    mergeGrounds: (groundIds) => {
      saveHistory(get, set, true);
      set((s) => {
        const selected = s.grounds.filter(
          (g) => groundIds.includes(g.id) && g.floor === s.activeFloor,
        );
        if (selected.length < 2) return {};
        const allPoints = selected.flatMap((g) => normalizeGround(g).points);
        const mergedPoints = convexHull(allPoints);
        const mergedId = genId("ground");
        return {
          grounds: [
            ...s.grounds.filter((g) => !groundIds.includes(g.id)),
            {
              id: mergedId,
              name: "Merged Ground",
              floor: s.activeFloor,
              points: mergedPoints,
            },
          ],
          selectedId: mergedId,
          groundPreviewed3D: { ...s.groundPreviewed3D, [s.activeFloor]: false },
        };
      });
    },

    // Room Extending & Merging
    extendRoom: (id, dir, delta = 40) => {
      saveHistory(get, set, false);
      set((s) => ({
        rooms: s.rooms.map((r) => {
          if (r.id !== id) return r;
          if (dir === "top")
            return {
              ...r,
              y: Math.max(0, r.y - delta),
              height: r.height + delta,
            };
          if (dir === "bottom")
            return { ...r, height: Math.max(40, r.height + delta) };
          if (dir === "left")
            return {
              ...r,
              x: Math.max(0, r.x - delta),
              width: r.width + delta,
            };
          if (dir === "right")
            return { ...r, width: Math.max(40, r.width + delta) };
          return r;
        }),
      }));
    },

    mergeRooms: (id1, id2) => {
      saveHistory(get, set, true);
      set((s) => {
        const r1 = s.rooms.find((r) => r.id === id1);
        const r2 = s.rooms.find((r) => r.id === id2);
        if (!r1 || !r2) return {};

        const minX = Math.min(r1.x, r2.x);
        const minY = Math.min(r1.y, r2.y);
        const maxX = Math.max(r1.x + r1.width, r2.x + r2.width);
        const maxY = Math.max(r1.y + r1.height, r2.y + r2.height);

        const mergedRoom = {
          ...r1,
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
          name: `${r1.name} & ${r2.name} (Merged)`,
        };

        return {
          rooms: s.rooms
            .map((r) => (r.id === id1 ? mergedRoom : r))
            .filter((r) => r.id !== id2),
          doors: s.doors.map((d) =>
            d.roomId === id2 ? { ...d, roomId: id1 } : d,
          ),
          windows: s.windows.map((w) =>
            w.roomId === id2 ? { ...w, roomId: id1 } : w,
          ),
          furniture: s.furniture.map((f) =>
            f.roomId === id2 ? { ...f, roomId: id1 } : f,
          ),
          selectedId: id1,
        };
      });
    },

    // File Import / Export
    exportProjectJSON: () => {
      const {
        grounds,
        rooms,
        doors,
        windows,
        furniture,
        floors,
        activeFloor,
        theme,
        pbrMaterialTheme,
        windowModes,
        groundPreviewed3D,
      } = get();
      const projectData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        grounds,
        rooms,
        doors,
        windows,
        furniture,
        floors,
        activeFloor,
        theme,
        pbrMaterialTheme,
        windowModes,
        groundPreviewed3D,
      };
      const jsonStr = JSON.stringify(projectData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `archDesign_project_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },

    importProjectJSON: (jsonData) => {
      try {
        const data =
          typeof jsonData === "string" ? JSON.parse(jsonData) : jsonData;
        if (!data.rooms || !Array.isArray(data.rooms))
          throw new Error("Invalid project file format.");
        saveHistory(get, set, true);
        set({
          grounds: (data.grounds || []).map(normalizeGround),
          rooms: data.rooms || [],
          doors: data.doors || [],
          windows: data.windows || [],
          furniture: data.furniture || [],
          floors: data.floors || [{ id: 0, name: "Ground Floor", height: 0 }],
          activeFloor: data.activeFloor ?? 0,
          theme: data.theme || "modern",
          pbrMaterialTheme: data.pbrMaterialTheme || {
            wallTexture: "modern_paint",
            floorTexture: "hardwood_parquet",
            exteriorTexture: "siding_wood",
          },
          windowModes: data.windowModes || {},
          groundPreviewed3D: data.groundPreviewed3D || {},
          selectedId: null,
        });
        return true;
      } catch (err) {
        console.error("Import error:", err);
        alert("Failed to import file: " + err.message);
        return false;
      }
    },

    // Door / Window
    addDoor: (door) => {
      saveHistory(get, set, true);
      set((s) => ({ doors: [...s.doors, { id: genId("door"), ...door }] }));
    },
    addWindow: (win) => {
      saveHistory(get, set, true);
      set((s) => ({ windows: [...s.windows, { id: genId("win"), ...win }] }));
    },
    updateDoor: (id, patch) => {
      saveHistory(get, set, false);
      set((s) => ({
        doors: s.doors.map((d) => (d.id === id ? { ...d, ...patch } : d)),
      }));
    },
    updateWindow: (id, patch) => {
      saveHistory(get, set, false);
      set((s) => ({
        windows: s.windows.map((w) => (w.id === id ? { ...w, ...patch } : w)),
      }));
    },
    deleteDoor: (id) => {
      saveHistory(get, set, true);
      set((s) => ({
        doors: s.doors.filter((d) => d.id !== id),
        selectedId: s.selectedId === id ? null : s.selectedId,
      }));
    },
    deleteWindow: (id) => {
      saveHistory(get, set, true);
      set((s) => ({
        windows: s.windows.filter((w) => w.id !== id),
        selectedId: s.selectedId === id ? null : s.selectedId,
      }));
    },
    toggleDoor: (id) => {
      saveHistory(get, set, true);
      set((s) => {
        const next = new Set(s.openDoors);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return { openDoors: next };
      });
    },
    toggleWindow: (id) => {
      saveHistory(get, set, true);
      set((s) => {
        const next = new Set(s.openWindows);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return { openWindows: next };
      });
    },

    // Furniture
    addFurniture: (item) => {
      saveHistory(get, set, true);
      const id = genId("furn");
      set((s) => ({
        furniture: [
          ...s.furniture,
          { ...item, id, floor: s.activeFloor },
        ],
        selectedId: id,
      }));
    },
    updateFurniture: (id, patch) => {
      saveHistory(get, set, false);
      set((s) => ({
        furniture: s.furniture.map((f) =>
          f.id === id ? { ...f, ...patch } : f,
        ),
      }));
    },
    deleteFurniture: (id) => {
      saveHistory(get, set, true);
      set((s) => ({ furniture: s.furniture.filter((f) => f.id !== id) }));
    },

    // AI
    applySuggestion: (id) => {
      saveHistory(get, set, true);
      set((s) => {
        const sugg = s.aiSuggestions.find((a) => a.id === id);
        let windows = s.windows;
        if (sugg?.action === "addWindow" && sugg.roomId) {
          windows = [
            ...s.windows,
            {
              id: genId("win"),
              roomId: sugg.roomId,
              wall: "right",
              position: 0.5,
              width: 70,
            },
          ];
        }
        return {
          aiSuggestions: s.aiSuggestions.map((a) =>
            a.id === id ? { ...a, applied: true } : a,
          ),
          windows,
        };
      });
    },
    dismissSuggestion: (id) => {
      saveHistory(get, set, true);
      set((s) => ({
        aiSuggestions: s.aiSuggestions.filter((a) => a.id !== id),
      }));
    },

    // Drawing
    startDrawing: (point) =>
      set({ isDrawingRoom: true, drawStart: point, drawCurrent: point }),
    updateDrawing: (point) => set({ drawCurrent: point }),
    finishDrawing: () => {
      const {
        drawStart,
        drawCurrent,
        snap,
        addRoom,
        activeTool,
        activeFloor,
        grounds,
        groundPreviewed3D,
      } = get();
      if (!drawStart || !drawCurrent) return;
      const x = snap(Math.min(drawStart.x, drawCurrent.x));
      const y = snap(Math.min(drawStart.y, drawCurrent.y));
      const width = Math.abs(snap(drawCurrent.x - drawStart.x));
      const height = Math.abs(snap(drawCurrent.y - drawStart.y));

      if (width > 40 && height > 40 && activeTool === "room") {
        const { floors } = get();
        const sortedFloors = [...floors].sort((a, b) => a.id - b.id);
        const groundFloorId = sortedFloors[0]?.id;
        const isUpperFloor = activeFloor !== groundFloorId;

        const floorGrounds = grounds
          .filter((g) => g.floor === activeFloor)
          .map(normalizeGround);

        if (floorGrounds.length === 0) {
          if (isUpperFloor) {
            addRoom({ x, y, width, height, name: "New Room", color: "#f0f4ff", type: "room" });
          } else {
            alert("Draw a ground footprint first.");
          }
        } else if (!isUpperFloor && !groundPreviewed3D[activeFloor]) {
          alert("Preview your ground in 3D View before creating rooms.");
        } else {
          const inside = rectInsideAnyGround(x, y, width, height, floorGrounds);
          if (!inside) {
            alert("Room must stay inside the building footprint.");
          } else {
            addRoom({ x, y, width, height, name: "New Room", color: "#f0f4ff", type: "room" });
          }
        }
      }
      set({
        isDrawingRoom: false,
        drawStart: null,
        drawCurrent: null,
        activeTool: "select",
      });
    },
    cancelDrawing: () =>
      set({ isDrawingRoom: false, drawStart: null, drawCurrent: null }),

    // Reset
    clearDesign: () => {
      saveHistory(get, set, true);
      set({
        grounds: [],
        rooms: [],
        doors: [],
        windows: [],
        furniture: [],
        selectedId: null,
        groundPreviewed3D: {},
      });
    },
    loadDemo: () => {
      saveHistory(get, set, true);
      set({
        grounds: DEFAULT_GROUNDS,
        rooms: DEFAULT_ROOMS,
        doors: DEFAULT_DOORS,
        windows: DEFAULT_WINDOWS,
        furniture: DEFAULT_FURNITURE,
        aiSuggestions: AI_SUGGESTIONS,
        groundPreviewed3D: {},
      });
    },
  })),
);
