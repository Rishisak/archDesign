import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

let nextId = 100;
const genId = (prefix = 'el') => `${prefix}-${nextId++}-${Math.random().toString(36).slice(2,6)}`;

// ─── Default rooms for demo ───────────────────────────────────────────────────
const DEFAULT_ROOMS = [
  { id: 'room-1', name: 'Living Room',  x: 50,  y: 50,  width: 320, height: 240, color: '#e8f4f8', floor: 0, type: 'living'   },
  { id: 'room-2', name: 'Kitchen',      x: 370, y: 50,  width: 200, height: 240, color: '#fff4e8', floor: 0, type: 'kitchen'  },
  { id: 'room-3', name: 'Master Bed',   x: 50,  y: 290, width: 240, height: 200, color: '#f0e8ff', floor: 0, type: 'bedroom'  },
  { id: 'room-4', name: 'Bedroom 2',    x: 290, y: 290, width: 180, height: 200, color: '#e8ffef', floor: 0, type: 'bedroom'  },
  { id: 'room-5', name: 'Bathroom',     x: 470, y: 290, width: 100, height: 200, color: '#e8f8ff', floor: 0, type: 'bathroom' },
  { id: 'room-6', name: 'Hallway',      x: 50,  y: 490, width: 520, height: 80,  color: '#f5f5f5', floor: 0, type: 'hallway'  },
];

const DEFAULT_DOORS = [
  { id: 'door-1', roomId: 'room-1', wall: 'right',  position: 0.5, width: 80 },
  { id: 'door-2', roomId: 'room-3', wall: 'right',  position: 0.5, width: 80 },
  { id: 'door-3', roomId: 'room-2', wall: 'bottom', position: 0.5, width: 80 },
  { id: 'door-4', roomId: 'room-4', wall: 'bottom', position: 0.5, width: 80 },
  { id: 'door-5', roomId: 'room-5', wall: 'left',   position: 0.5, width: 60 },
];

const DEFAULT_WINDOWS = [
  { id: 'win-1', roomId: 'room-1', wall: 'top',    position: 0.3, width: 80 },
  { id: 'win-2', roomId: 'room-1', wall: 'top',    position: 0.7, width: 80 },
  { id: 'win-3', roomId: 'room-2', wall: 'top',    position: 0.5, width: 70 },
  { id: 'win-4', roomId: 'room-3', wall: 'left',   position: 0.5, width: 90 },
  { id: 'win-5', roomId: 'room-4', wall: 'right',  position: 0.5, width: 80 },
];

const DEFAULT_FURNITURE = [
  { id: 'furn-1', roomId: 'room-1', type: 'sofa',    x: 100, y: 130, width: 160, height: 70,  color: '#b4c4d4', label: 'Sofa',        floor: 0 },
  { id: 'furn-2', roomId: 'room-1', type: 'tv',      x: 100, y: 60,  width: 120, height: 20,  color: '#333',    label: 'TV Console',   floor: 0 },
  { id: 'furn-3', roomId: 'room-2', type: 'table',   x: 400, y: 100, width: 100, height: 60,  color: '#d4b483', label: 'Dining Table', floor: 0 },
  { id: 'furn-4', roomId: 'room-3', type: 'bed',     x: 70,  y: 320, width: 140, height: 180, color: '#c4a0d4', label: 'Queen Bed',    floor: 0 },
  { id: 'furn-5', roomId: 'room-4', type: 'bed',     x: 310, y: 320, width: 120, height: 140, color: '#a0d4c4', label: 'Twin Bed',     floor: 0 },
];

const AI_SUGGESTIONS = [
  { id: 's1', type: 'lighting',  severity: 'warning', title: 'Limited Natural Light', description: 'Bathroom has no window. Consider adding a small window on the right wall for natural ventilation and light.', roomId: 'room-5', action: 'addWindow', applied: false },
  { id: 's2', type: 'space',     severity: 'info',    title: 'Open Plan Opportunity', description: 'Removing the wall between Kitchen and Living Room could create a more spacious, modern open-plan layout.', roomId: 'room-2', action: null, applied: false },
  { id: 's3', type: 'flow',      severity: 'success', title: 'Good Traffic Flow', description: 'The hallway provides excellent connectivity between all rooms. Circulation paths are well-optimized.', roomId: 'room-6', action: null, applied: false },
  { id: 's4', type: 'furniture', severity: 'info',    title: 'Furniture Arrangement', description: 'The sofa in the Living Room could be repositioned to face the TV directly, improving viewing angles.', roomId: 'room-1', action: null, applied: false },
  { id: 's5', type: 'safety',    severity: 'warning', title: 'Emergency Egress', description: 'Master Bedroom has only one exit. Building codes recommend at least one emergency egress window.', roomId: 'room-3', action: 'addWindow', applied: false },
];

export const useDesignStore = create(subscribeWithSelector((set, get) => ({
  // Core state
  rooms: DEFAULT_ROOMS,
  doors: DEFAULT_DOORS,
  windows: DEFAULT_WINDOWS,
  furniture: DEFAULT_FURNITURE,
  aiSuggestions: AI_SUGGESTIONS,
  openDoors: new Set(),    // Set of door IDs that are open
  openWindows: new Set(),  // Set of window IDs that are unlocked/open

  viewMode: '2d',          // '2d' | '3d' | 'walkthrough' | 'vr'
  activeTool: 'select',    // 'select' | 'room' | 'door' | 'window' | 'furniture'
  activeFloor: 0,
  floors: [{ id: 0, name: 'Ground Floor', height: 0 }, { id: 1, name: '1st Floor', height: 300 }],
  selectedId: null,
  showAIPanel: true,
  showLibrary: false,
  zoom: 1,
  panX: 0,
  panY: 0,
  gridSize: 20,
  snapToGrid: true,
  theme: 'modern',         // 'modern' | 'japandi' | 'industrial' | 'scandinavian' | 'cyberpunk'
  wallColor: '#e2e8f0',
  floorColor: '#f8f9fa',

  // Drawing state
  isDrawingRoom: false,
  drawStart: null,
  drawCurrent: null,

  draggingFurniture: null,
  resizingRoom: null,

  // ─── Actions ──────────────────────────────────────────────────────────────────
  setViewMode: (mode) => set({ viewMode: mode }),
  setActiveTool: (tool) => set({ activeTool: tool, selectedId: null }),
  setActiveFloor: (floor) => set({ activeFloor: floor }),
  setSelectedId: (id) => set({ selectedId: id }),
  setShowAIPanel: (v) => set({ showAIPanel: v }),
  setShowLibrary: (v) => set({ showLibrary: v }),
  setZoom: (zoom) => set({ zoom: Math.min(3, Math.max(0.2, zoom)) }),
  setPan: (panX, panY) => set({ panX, panY }),
  setTheme: (theme) => set({ theme }),
  setSnapToGrid: (v) => set({ snapToGrid: v }),

  snap: (val) => {
    const { snapToGrid, gridSize } = get();
    return snapToGrid ? Math.round(val / gridSize) * gridSize : val;
  },

  // Room CRUD
  addRoom: (room) => set((s) => ({ rooms: [...s.rooms, { id: genId('room'), floor: s.activeFloor, ...room }] })),
  updateRoom: (id, patch) => set((s) => ({ rooms: s.rooms.map(r => r.id === id ? { ...r, ...patch } : r) })),
  deleteRoom: (id) => set((s) => ({
    rooms: s.rooms.filter(r => r.id !== id),
    doors: s.doors.filter(d => d.roomId !== id),
    windows: s.windows.filter(w => w.roomId !== id),
    furniture: s.furniture.filter(f => f.roomId !== id),
    selectedId: s.selectedId === id ? null : s.selectedId,
  })),

  // Door / Window
  addDoor: (door) => set((s) => ({ doors: [...s.doors, { id: genId('door'), ...door }] })),
  addWindow: (win) => set((s) => ({ windows: [...s.windows, { id: genId('win'), ...win }] })),
  updateDoor: (id, patch) => set((s) => ({ doors: s.doors.map(d => d.id === id ? { ...d, ...patch } : d) })),
  updateWindow: (id, patch) => set((s) => ({ windows: s.windows.map(w => w.id === id ? { ...w, ...patch } : w) })),
  deleteDoor: (id) => set((s) => ({
    doors: s.doors.filter(d => d.id !== id),
    selectedId: s.selectedId === id ? null : s.selectedId,
  })),
  deleteWindow: (id) => set((s) => ({
    windows: s.windows.filter(w => w.id !== id),
    selectedId: s.selectedId === id ? null : s.selectedId,
  })),
  toggleDoor: (id) => set((s) => {
    const next = new Set(s.openDoors);
    if (next.has(id)) next.delete(id); else next.add(id);
    return { openDoors: next };
  }),
  toggleWindow: (id) => set((s) => {
    const next = new Set(s.openWindows);
    if (next.has(id)) next.delete(id); else next.add(id);
    return { openWindows: next };
  }),

  // Furniture
  addFurniture: (item) => set((s) => ({ furniture: [...s.furniture, { id: genId('furn'), floor: s.activeFloor, ...item }] })),
  updateFurniture: (id, patch) => set((s) => ({ furniture: s.furniture.map(f => f.id === id ? { ...f, ...patch } : f) })),
  deleteFurniture: (id) => set((s) => ({ furniture: s.furniture.filter(f => f.id !== id) })),

  // AI
  applySuggestion: (id) => set((s) => {
    const sugg = s.aiSuggestions.find(a => a.id === id);
    let windows = s.windows;
    if (sugg?.action === 'addWindow' && sugg.roomId) {
      windows = [...s.windows, { id: genId('win'), roomId: sugg.roomId, wall: 'right', position: 0.5, width: 70 }];
    }
    return {
      aiSuggestions: s.aiSuggestions.map(a => a.id === id ? { ...a, applied: true } : a),
      windows,
    };
  }),
  dismissSuggestion: (id) => set((s) => ({ aiSuggestions: s.aiSuggestions.filter(a => a.id !== id) })),

  // Drawing
  startDrawing: (point) => set({ isDrawingRoom: true, drawStart: point, drawCurrent: point }),
  updateDrawing: (point) => set({ drawCurrent: point }),
  finishDrawing: () => {
    const { drawStart, drawCurrent, snap, addRoom } = get();
    if (!drawStart || !drawCurrent) return;
    const x = snap(Math.min(drawStart.x, drawCurrent.x));
    const y = snap(Math.min(drawStart.y, drawCurrent.y));
    const width = Math.abs(snap(drawCurrent.x - drawStart.x));
    const height = Math.abs(snap(drawCurrent.y - drawStart.y));
    if (width > 40 && height > 40) {
      addRoom({ x, y, width, height, name: 'New Room', color: '#f0f4ff', type: 'room' });
    }
    set({ isDrawingRoom: false, drawStart: null, drawCurrent: null, activeTool: 'select' });
  },
  cancelDrawing: () => set({ isDrawingRoom: false, drawStart: null, drawCurrent: null }),

  // Reset
  clearDesign: () => set({ rooms: [], doors: [], windows: [], furniture: [], selectedId: null }),
  loadDemo: () => set({ rooms: DEFAULT_ROOMS, doors: DEFAULT_DOORS, windows: DEFAULT_WINDOWS, furniture: DEFAULT_FURNITURE, aiSuggestions: AI_SUGGESTIONS }),
})));
