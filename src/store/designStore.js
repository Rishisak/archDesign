import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

let nextId = 100;
const genId = (prefix = "el") =>
  `${prefix}-${nextId++}-${Math.random().toString(36).slice(2, 6)}`;

// ─── Default rooms & furniture for demo apartment (Image 5) ─────────
const DEFAULT_ROOMS = [
  {
    id: "room-1",
    name: "Living Room",
    x: 50,
    y: 50,
    width: 340,
    height: 260,
    color: "#f0f4f8",
    floor: 0,
    type: "living",
  },
  {
    id: "room-2",
    name: "Dining & Kitchen",
    x: 50,
    y: 310,
    width: 340,
    height: 260,
    color: "#fff6ec",
    floor: 0,
    type: "kitchen",
  },
  {
    id: "room-3",
    name: "Master Bedroom",
    x: 390,
    y: 50,
    width: 240,
    height: 200,
    color: "#f5f0ff",
    floor: 0,
    type: "bedroom",
  },
  {
    id: "room-4",
    name: "Kids Bedroom",
    x: 630,
    y: 50,
    width: 220,
    height: 200,
    color: "#efffef",
    floor: 0,
    type: "bedroom",
  },
  {
    id: "room-5",
    name: "Guest Bedroom",
    x: 630,
    y: 350,
    width: 220,
    height: 220,
    color: "#fff0f5",
    floor: 0,
    type: "bedroom",
  },
  {
    id: "room-6",
    name: "En-Suite Bathroom",
    x: 390,
    y: 250,
    width: 240,
    height: 100,
    color: "#e8f8ff",
    floor: 0,
    type: "bathroom",
  },
  {
    id: "room-7",
    name: "Guest Bathroom",
    x: 630,
    y: 250,
    width: 220,
    height: 100,
    color: "#e8f8ff",
    floor: 0,
    type: "bathroom",
  },
  {
    id: "room-8",
    name: "Balcony Terrace",
    x: 50,
    y: 570,
    width: 340,
    height: 140,
    color: "#f4f0e6",
    floor: 0,
    type: "hallway",
  },
];

const DEFAULT_DOORS = [
  { id: "door-1", roomId: "room-1", wall: "bottom", position: 0.3, width: 90 },
  { id: "door-2", roomId: "room-3", wall: "bottom", position: 0.5, width: 80 },
  { id: "door-3", roomId: "room-4", wall: "bottom", position: 0.5, width: 80 },
  { id: "door-4", roomId: "room-5", wall: "top", position: 0.5, width: 80 },
  { id: "door-5", roomId: "room-6", wall: "bottom", position: 0.5, width: 70 },
  { id: "door-6", roomId: "room-7", wall: "top", position: 0.5, width: 70 },
];

const DEFAULT_WINDOWS = [
  { id: "win-1", roomId: "room-1", wall: "top", position: 0.5, width: 140 },
  { id: "win-2", roomId: "room-3", wall: "top", position: 0.5, width: 110 },
  { id: "win-3", roomId: "room-4", wall: "top", position: 0.5, width: 100 },
  { id: "win-4", roomId: "room-5", wall: "right", position: 0.5, width: 110 },
  { id: "win-5", roomId: "room-8", wall: "left", position: 0.5, width: 120 },
];

const DEFAULT_FURNITURE = [
  {
    id: "furn-1",
    roomId: "room-1",
    type: "sofa_sectional",
    x: 210,
    y: 70,
    width: 160,
    height: 210,
    color: "#eceff1",
    label: "Sectional Sofa",
    floor: 0,
  },
  {
    id: "furn-2",
    roomId: "room-1",
    type: "table_coffee",
    x: 130,
    y: 130,
    width: 70,
    height: 50,
    color: "#8d6e63",
    label: "Coffee Table",
    floor: 0,
  },
  {
    id: "furn-3",
    roomId: "room-1",
    type: "tv_unit",
    x: 65,
    y: 110,
    width: 30,
    height: 140,
    color: "#4e342e",
    label: "TV Wall Unit",
    floor: 0,
  },
  {
    id: "furn-4",
    roomId: "room-2",
    type: "dining_6",
    x: 90,
    y: 350,
    width: 160,
    height: 90,
    color: "#795548",
    label: "Dining Set",
    floor: 0,
  },
  {
    id: "furn-5",
    roomId: "room-2",
    type: "desk",
    x: 270,
    y: 340,
    width: 50,
    height: 130,
    color: "#d7ccc8",
    label: "Kitchen Island",
    floor: 0,
  },
  {
    id: "furn-6",
    roomId: "room-3",
    type: "bed_king",
    x: 430,
    y: 65,
    width: 160,
    height: 170,
    color: "#7b1fa2",
    label: "King Bed",
    floor: 0,
  },
  {
    id: "furn-7",
    roomId: "room-3",
    type: "nightstand",
    x: 395,
    y: 65,
    width: 30,
    height: 35,
    color: "#bcaaa4",
    label: "Nightstand",
    floor: 0,
  },
  {
    id: "furn-8",
    roomId: "room-3",
    type: "nightstand",
    x: 595,
    y: 65,
    width: 30,
    height: 35,
    color: "#bcaaa4",
    label: "Nightstand",
    floor: 0,
  },
  {
    id: "furn-9",
    roomId: "room-4",
    type: "bed_single",
    x: 660,
    y: 65,
    width: 110,
    height: 160,
    color: "#8e24aa",
    label: "Single Bed",
    floor: 0,
  },
  {
    id: "furn-10",
    roomId: "room-4",
    type: "desk",
    x: 775,
    y: 150,
    width: 65,
    height: 45,
    color: "#5d4037",
    label: "Study Desk",
    floor: 0,
  },
  {
    id: "furn-11",
    roomId: "room-5",
    type: "bed_queen",
    x: 660,
    y: 380,
    width: 150,
    height: 170,
    color: "#ab47bc",
    label: "Queen Bed",
    floor: 0,
  },
  {
    id: "furn-12",
    roomId: "room-6",
    type: "bath",
    x: 400,
    y: 260,
    width: 70,
    height: 80,
    color: "#0288d1",
    label: "Shower Cabinet",
    floor: 0,
  },
  {
    id: "furn-13",
    roomId: "room-8",
    type: "table_coffee",
    x: 160,
    y: 610,
    width: 90,
    height: 60,
    color: "#d4b483",
    label: "Balcony Set",
    floor: 0,
  },
];

const DEFAULT_GROUNDS = [];

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

export const useDesignStore = create(
  subscribeWithSelector((set, get) => ({
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
    activeTool: "select", // 'select' | 'ground' | 'room' | 'door' | 'window' | 'furniture'
    activeFloor: 0,
    floors: [
      { id: 0, name: "Ground Floor", height: 0 },
      { id: 1, name: "1st Floor", height: 300 },
    ],
    selectedId: null,
    showAIPanel: true,
    showLibrary: false,
    zoom: 1,
    panX: 0,
    panY: 0,
    gridSize: 20,
    snapToGrid: true,
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

    // ─── Actions ──────────────────────────────────────────────────────────────────
    setViewMode: (mode) =>
      set((s) => {
        if (mode !== "3d") return { viewMode: mode };
        const hasGround = s.grounds.some((g) => g.floor === s.activeFloor);
        if (!hasGround) return { viewMode: mode };
        return {
          viewMode: mode,
          groundPreviewed3D: { ...s.groundPreviewed3D, [s.activeFloor]: true },
        };
      }),
    setActiveTool: (tool) => set({ activeTool: tool, selectedId: null }),
    setActiveFloor: (floor) => set({ activeFloor: floor }),
    setSelectedId: (id) => set({ selectedId: id }),
    setShowAIPanel: (v) => set({ showAIPanel: v }),
    setShowLibrary: (v) => set({ showLibrary: v }),
    setZoom: (zoom) => set({ zoom: Math.min(3, Math.max(0.2, zoom)) }),
    setPan: (panX, panY) => set({ panX, panY }),
    setTheme: (theme) => set({ theme }),
    setPBRMaterialTheme: (patch) =>
      set((s) => ({ pbrMaterialTheme: { ...s.pbrMaterialTheme, ...patch } })),
    setSnapToGrid: (v) => set({ snapToGrid: v }),
    toggleWindowMode: (id) =>
      set((s) => {
        const current = s.windowModes[id] || "sliding";
        const nextMode = current === "sliding" ? "casement" : "sliding";
        return { windowModes: { ...s.windowModes, [id]: nextMode } };
      }),

    snap: (val) => {
      const { snapToGrid, gridSize } = get();
      return snapToGrid ? Math.round(val / gridSize) * gridSize : val;
    },

    // Room CRUD
    addRoom: (room) =>
      set((s) => ({
        rooms: [
          ...s.rooms,
          { id: genId("room"), floor: s.activeFloor, ...room },
        ],
      })),
    updateRoom: (id, patch) =>
      set((s) => ({
        rooms: s.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      })),
    deleteRoom: (id) =>
      set((s) => ({
        rooms: s.rooms.filter((r) => r.id !== id),
        doors: s.doors.filter((d) => d.roomId !== id),
        windows: s.windows.filter((w) => w.roomId !== id),
        furniture: s.furniture.filter((f) => f.roomId !== id),
        selectedId: s.selectedId === id ? null : s.selectedId,
      })),

    // Ground footprint CRUD
    upsertGroundForActiveFloor: (ground) =>
      set((s) => {
        const nextGround = {
          id: genId("ground"),
          name: "Ground Footprint",
          floor: s.activeFloor,
          ...ground,
        };
        const hasForFloor = s.grounds.some((g) => g.floor === s.activeFloor);
        return {
          grounds: hasForFloor
            ? s.grounds.map((g) =>
                g.floor === s.activeFloor ? { ...g, ...nextGround } : g,
              )
            : [...s.grounds, nextGround],
          groundPreviewed3D: { ...s.groundPreviewed3D, [s.activeFloor]: false },
        };
      }),
    deleteGroundForActiveFloor: () =>
      set((s) => ({
        grounds: s.grounds.filter((g) => g.floor !== s.activeFloor),
        selectedId:
          s.selectedId && s.selectedId.startsWith("ground-")
            ? null
            : s.selectedId,
      })),

    // Room Extending & Merging
    extendRoom: (id, dir, delta = 40) =>
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
      })),

    mergeRooms: (id1, id2) =>
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
      }),

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
        set({
          grounds: data.grounds || [],
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
    addDoor: (door) =>
      set((s) => ({ doors: [...s.doors, { id: genId("door"), ...door }] })),
    addWindow: (win) =>
      set((s) => ({ windows: [...s.windows, { id: genId("win"), ...win }] })),
    updateDoor: (id, patch) =>
      set((s) => ({
        doors: s.doors.map((d) => (d.id === id ? { ...d, ...patch } : d)),
      })),
    updateWindow: (id, patch) =>
      set((s) => ({
        windows: s.windows.map((w) => (w.id === id ? { ...w, ...patch } : w)),
      })),
    deleteDoor: (id) =>
      set((s) => ({
        doors: s.doors.filter((d) => d.id !== id),
        selectedId: s.selectedId === id ? null : s.selectedId,
      })),
    deleteWindow: (id) =>
      set((s) => ({
        windows: s.windows.filter((w) => w.id !== id),
        selectedId: s.selectedId === id ? null : s.selectedId,
      })),
    toggleDoor: (id) =>
      set((s) => {
        const next = new Set(s.openDoors);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return { openDoors: next };
      }),
    toggleWindow: (id) =>
      set((s) => {
        const next = new Set(s.openWindows);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return { openWindows: next };
      }),

    // Furniture
    addFurniture: (item) =>
      set((s) => ({
        furniture: [
          ...s.furniture,
          { id: genId("furn"), floor: s.activeFloor, ...item },
        ],
      })),
    updateFurniture: (id, patch) =>
      set((s) => ({
        furniture: s.furniture.map((f) =>
          f.id === id ? { ...f, ...patch } : f,
        ),
      })),
    deleteFurniture: (id) =>
      set((s) => ({ furniture: s.furniture.filter((f) => f.id !== id) })),

    // AI
    applySuggestion: (id) =>
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
      }),
    dismissSuggestion: (id) =>
      set((s) => ({
        aiSuggestions: s.aiSuggestions.filter((a) => a.id !== id),
      })),

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
        upsertGroundForActiveFloor,
        groundPreviewed3D,
      } = get();
      if (!drawStart || !drawCurrent) return;
      const x = snap(Math.min(drawStart.x, drawCurrent.x));
      const y = snap(Math.min(drawStart.y, drawCurrent.y));
      const width = Math.abs(snap(drawCurrent.x - drawStart.x));
      const height = Math.abs(snap(drawCurrent.y - drawStart.y));

      if (width > 40 && height > 40 && activeTool === "ground") {
        upsertGroundForActiveFloor({ x, y, width, height });
        set({
          isDrawingRoom: false,
          drawStart: null,
          drawCurrent: null,
          activeTool: "select",
        });
        return;
      }

      if (width > 40 && height > 40 && activeTool === "room") {
        const ground = grounds.find((g) => g.floor === activeFloor);
        if (!ground) {
          alert("Draw a ground footprint first.");
        } else if (!groundPreviewed3D[activeFloor]) {
          alert("Preview your ground in 3D View before creating rooms.");
        } else {
          const inside =
            x >= ground.x &&
            y >= ground.y &&
            x + width <= ground.x + ground.width &&
            y + height <= ground.y + ground.height;
          if (!inside) {
            alert("Room must stay inside the ground footprint.");
          } else {
            addRoom({
              x,
              y,
              width,
              height,
              name: "New Room",
              color: "#f0f4ff",
              type: "room",
            });
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
    clearDesign: () =>
      set({
        grounds: [],
        rooms: [],
        doors: [],
        windows: [],
        furniture: [],
        selectedId: null,
        groundPreviewed3D: {},
      }),
    loadDemo: () =>
      set({
        grounds: DEFAULT_GROUNDS,
        rooms: DEFAULT_ROOMS,
        doors: DEFAULT_DOORS,
        windows: DEFAULT_WINDOWS,
        furniture: DEFAULT_FURNITURE,
        aiSuggestions: AI_SUGGESTIONS,
        groundPreviewed3D: { 0: true },
      }),
  })),
);
