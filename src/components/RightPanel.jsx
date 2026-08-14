import React, { useState, useEffect } from "react";
import { useDesignStore } from "../store/designStore";

const ROOM_COLORS = [
  "#e8f4f8",
  "#fff4e8",
  "#f0e8ff",
  "#e8ffef",
  "#fff8e8",
  "#ffe8e8",
  "#f5f5f5",
  "#e8f0ff",
  "#ffeeff",
  "#f0fff0",
];

const ROOM_TYPES = [
  "living",
  "bedroom",
  "kitchen",
  "bathroom",
  "dining",
  "hallway",
  "study",
  "gym",
  "cinema",
  "other",
];

export const LIBRARY_ITEMS = [
  // ── Doors & Openings ──
  {
    category: "doors",
    icon: "🚪",
    name: "Single Door",
    type: "door_single",
    w: 80,
    h: 20,
    color: "#c8923a",
  },
  {
    category: "doors",
    icon: "🚪",
    name: "Double Door",
    type: "door_double",
    w: 140,
    h: 20,
    color: "#c8923a",
  },
  {
    category: "doors",
    icon: "🚪",
    name: "Sliding Door",
    type: "door_sliding",
    w: 120,
    h: 20,
    color: "#b07a30",
  },
  {
    category: "doors",
    icon: "🚪",
    name: "Folding Door",
    type: "door_folding",
    w: 100,
    h: 20,
    color: "#a06828",
  },

  // ── Windows ──
  {
    category: "windows",
    icon: "🪟",
    name: "Single Window",
    type: "window_single",
    w: 80,
    h: 15,
    color: "#64b5f6",
  },
  {
    category: "windows",
    icon: "🪟",
    name: "Double Window",
    type: "window_double",
    w: 140,
    h: 15,
    color: "#42a5f5",
  },
  {
    category: "windows",
    icon: "🪟",
    name: "Bay Window",
    type: "window_bay",
    w: 160,
    h: 40,
    color: "#1e88e5",
  },
  {
    category: "windows",
    icon: "🪟",
    name: "Sliding Window",
    type: "window_sliding",
    w: 120,
    h: 15,
    color: "#2196f3",
  },

  // ── Seating ──
  {
    category: "seating",
    icon: "🛋️",
    name: "3-Seater Sofa",
    type: "sofa",
    w: 180,
    h: 80,
    color: "#546e7a",
  },
  {
    category: "seating",
    icon: "🛋️",
    name: "Sectional L-Sofa",
    type: "sofa_sectional",
    w: 200,
    h: 160,
    color: "#37474f",
  },
  {
    category: "seating",
    icon: "🪑",
    name: "Armchair",
    type: "armchair",
    w: 80,
    h: 80,
    color: "#78909c",
  },

  // ── Beds ──
  {
    category: "beds",
    icon: "🛏️",
    name: "Single Bed",
    type: "bed_single",
    w: 100,
    h: 190,
    color: "#8e24aa",
  },
  {
    category: "beds",
    icon: "🛏️",
    name: "Double Bed",
    type: "bed_double",
    w: 140,
    h: 190,
    color: "#ab47bc",
  },
  {
    category: "beds",
    icon: "🛏️",
    name: "Queen Bed",
    type: "bed_queen",
    w: 160,
    h: 200,
    color: "#7b1fa2",
  },
  {
    category: "beds",
    icon: "🛏️",
    name: "King Bed",
    type: "bed_king",
    w: 190,
    h: 200,
    color: "#673ab7",
  },
  {
    category: "beds",
    icon: "🛏️",
    name: "Bunk Bed",
    type: "bed_bunk",
    w: 100,
    h: 190,
    color: "#512da8",
  },

  // ── Tables & Desks ──
  {
    category: "tables",
    icon: "🍽️",
    name: "Dining Table (4-Seat)",
    type: "dining_4",
    w: 120,
    h: 80,
    color: "#8d6e63",
  },
  {
    category: "tables",
    icon: "🍽️",
    name: "Dining Table (6-Seat)",
    type: "dining_6",
    w: 170,
    h: 90,
    color: "#6d4c41",
  },
  {
    category: "tables",
    icon: "☕",
    name: "Coffee Table",
    type: "table_coffee",
    w: 100,
    h: 50,
    color: "#a1887f",
  },
  {
    category: "tables",
    icon: "🖥️",
    name: "Office Desk",
    type: "desk",
    w: 130,
    h: 65,
    color: "#5d4037",
  },
  {
    category: "tables",
    icon: "🛏️",
    name: "Bedside Table",
    type: "nightstand",
    w: 45,
    h: 45,
    color: "#bcaaa4",
  },

  // ── Storage & Appliances ──
  {
    category: "storage",
    icon: "🪞",
    name: "Wardrobe",
    type: "wardrobe",
    w: 160,
    h: 60,
    color: "#4e342e",
  },
  {
    category: "storage",
    icon: "👟",
    name: "Shoe Rack",
    type: "shoerack",
    w: 90,
    h: 35,
    color: "#3e2723",
  },
  {
    category: "storage",
    icon: "📺",
    name: "TV Unit & Console",
    type: "tv_unit",
    w: 150,
    h: 40,
    color: "#212121",
  },

  // ── Bath & Decor ──
  {
    category: "decor",
    icon: "🛁",
    name: "Bathtub",
    type: "bath",
    w: 80,
    h: 150,
    color: "#0288d1",
  },
  {
    category: "decor",
    icon: "🚿",
    name: "Shower Cabinet",
    type: "shower",
    w: 90,
    h: 90,
    color: "#03a9f4",
  },
  {
    category: "decor",
    icon: "🌿",
    name: "Plant",
    type: "plant",
    w: 40,
    h: 40,
    color: "#2e7d32",
  },
  {
    category: "decor",
    icon: "🪜",
    name: "Staircase",
    type: "stairs",
    w: 110,
    h: 240,
    color: "#d4b483",
  },
];

const THEMES = [
  {
    id: "modern",
    name: "Modern Minimal",
    colors: ["#e2e8f0", "#f8f9fa", "#cbd5e1"],
  },
  {
    id: "japandi",
    name: "Japandi Wood",
    colors: ["#d4b896", "#f5f0e8", "#a08060"],
  },
  {
    id: "industrial",
    name: "Warm Industrial",
    colors: ["#b4a090", "#2a2420", "#8a7060"],
  },
  {
    id: "scandinavian",
    name: "Scandinavian",
    colors: ["#f0ece8", "#ffffff", "#d0c8c0"],
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk Neon",
    colors: ["#2a0a3a", "#0a1a2a", "#bc8cff"],
  },
];

const AI_RESPONSES = [
  "Your Living Room is well-proportioned at 3.2m × 2.4m. I recommend adding a second window on the east wall for better cross-ventilation.",
  "Based on the current layout, the Kitchen-to-Dining distance is optimal. The traffic flow from the entrance to bedrooms follows a logical path.",
  "The Master Bedroom size (2.4m × 2.0m) is slightly below the recommended 3m × 4m. Consider expanding into the adjacent Hallway space.",
  "Great layout! The hallway provides clear circulation. I suggest adding a coat closet near the entrance — typical size: 1.0m × 0.6m.",
  "The Bathroom has no natural light source. A skylight or frosted window on the north wall would improve ventilation and reduce mold risk.",
  "For a modern open-plan feel, consider removing the wall between Kitchen and Living Room. This would increase natural light by approximately 40%.",
];

// ─── Floors Manager Section on Right Panel ──────────────────────────────────
function FloorsPanel() {
  const {
    floors,
    activeFloor,
    setActiveFloor,
    addFloor,
    deleteFloor,
    renameFloor,
    rooms,
    setViewMode,
  } = useDesignStore();

  const [editingFloorId, setEditingFloorId] = useState(null);
  const [editingName, setEditingName] = useState("");

  const sortedFloors = [...floors].sort((a, b) => a.id - b.id);
  const groundFloorId = sortedFloors[0]?.id;
  const groundFloorHasRooms = rooms.some((r) => r.floor === groundFloorId);

  const startRename = (f, e) => {
    e.stopPropagation();
    setEditingFloorId(f.id);
    setEditingName(f.name);
  };

  const commitRename = () => {
    if (editingFloorId !== null && editingName.trim()) {
      renameFloor(editingFloorId, editingName.trim());
    }
    setEditingFloorId(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="section-header">🏢 Building Floors & Storeys</div>

      {/* Info / Status Banner */}
      <div
        style={{
          padding: "10px 12px",
          borderRadius: "var(--radius-md)",
          background: groundFloorHasRooms
            ? "rgba(63,185,80,0.08)"
            : "rgba(210,153,34,0.1)",
          border: groundFloorHasRooms
            ? "1px solid rgba(63,185,80,0.25)"
            : "1px solid rgba(210,153,34,0.3)",
          fontSize: 11,
          lineHeight: 1.5,
          color: groundFloorHasRooms ? "var(--green)" : "var(--orange)",
        }}
      >
        {groundFloorHasRooms ? (
          <span>
            ✨ <strong>Ground layout ready!</strong> Upper floors automatically
            inherit your ground floor room footprint as allowed building boundaries.
          </span>
        ) : (
          <span>
            ⚡ <strong>Setup hint:</strong> Design at least one room on the
            Ground Floor to establish the building outline before adding upper floors.
          </span>
        )}
      </div>

      {/* Add New Floor Button */}
      <button
        onClick={() => {
          if (!groundFloorHasRooms) {
            alert(
              "Please design at least one room on the Ground Floor first to establish the building footprint.",
            );
            return;
          }
          addFloor();
        }}
        style={{
          width: "100%",
          padding: "10px 14px",
          borderRadius: "var(--radius-md)",
          border: groundFloorHasRooms
            ? "1px solid var(--accent)"
            : "1px dashed var(--border)",
          background: groundFloorHasRooms
            ? "linear-gradient(135deg, rgba(79,142,247,0.2), rgba(188,140,255,0.15))"
            : "var(--bg-tertiary)",
          color: groundFloorHasRooms ? "var(--accent)" : "var(--text-muted)",
          fontWeight: 600,
          fontSize: 12,
          cursor: groundFloorHasRooms ? "pointer" : "not-allowed",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          transition: "all 0.2s",
        }}
      >
        <span>➕ Add New Floor</span>
      </button>

      {/* Floor Cards List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sortedFloors.map((f, idx) => {
          const isActive = activeFloor === f.id;
          const isGround = f.id === groundFloorId;
          const isEditing = editingFloorId === f.id;
          const floorRooms = rooms.filter((r) => r.floor === f.id);
          const storeyHeightM = (idx * 3.0).toFixed(1);

          return (
            <div
              key={f.id}
              onClick={() => setActiveFloor(f.id)}
              style={{
                padding: "10px 12px",
                borderRadius: "var(--radius-md)",
                border: isActive
                  ? "1.5px solid var(--accent)"
                  : "1px solid var(--border)",
                background: isActive
                  ? "rgba(79,142,247,0.12)"
                  : "var(--bg-tertiary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
                transition: "all 0.2s",
                boxShadow: isActive ? "0 2px 10px var(--accent-glow)" : "none",
              }}
            >
              {/* Icon */}
              <div
                style={{
                  fontSize: 18,
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: isActive ? "var(--accent)" : "var(--bg-quaternary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {isGround ? "🏠" : "🏢"}
              </div>

              {/* Title & info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {isEditing ? (
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename();
                      if (e.key === "Escape") setEditingFloorId(null);
                    }}
                    style={{
                      background: "var(--bg-primary)",
                      border: "1px solid var(--accent)",
                      borderRadius: 4,
                      color: "var(--text-primary)",
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "2px 6px",
                      width: "100%",
                    }}
                  />
                ) : (
                  <div
                    onDoubleClick={(e) => startRename(f, e)}
                    style={{
                      fontSize: 13,
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {f.name}
                  </div>
                )}
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--text-muted)",
                    marginTop: 2,
                    display: "flex",
                    gap: 8,
                  }}
                >
                  <span>+{storeyHeightM}m elevation</span>
                  <span>•</span>
                  <span>{floorRooms.length} room{floorRooms.length === 1 ? "" : "s"}</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {!isEditing && (
                  <button
                    onClick={(e) => startRename(f, e)}
                    title="Rename Floor"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      fontSize: 11,
                      padding: "3px 4px",
                    }}
                  >
                    ✏️
                  </button>
                )}

                {!isGround && sortedFloors.length > 1 && !isEditing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (
                        window.confirm(
                          `Are you sure you want to delete "${f.name}" and all its rooms?`,
                        )
                      ) {
                        deleteFloor(f.id);
                      }
                    }}
                    title="Delete Floor"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--red)",
                      cursor: "pointer",
                      fontSize: 12,
                      padding: "3px 4px",
                    }}
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* View all floors 3D button */}
      <button
        onClick={() => setViewMode("3d")}
        style={{
          width: "100%",
          padding: "8px 12px",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border)",
          background: "var(--bg-tertiary)",
          color: "var(--text-primary)",
          fontSize: 11,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          marginTop: 6,
        }}
      >
        <span>◈ View Building in 3D</span>
      </button>
    </div>
  );
}

function AIPanel() {
  const { aiSuggestions, applySuggestion, dismissSuggestion } =
    useDesignStore();
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "👋 Hi! I'm Archie, your AI design copilot. I've analysed your current layout and have some suggestions ready. You can also ask me anything about your design!",
    },
  ]);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", text: userMsg }]);
    const reply = AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)];
    setTimeout(
      () => setMessages((m) => [...m, { role: "ai", text: reply }]),
      700,
    );
  };

  const pending = aiSuggestions.filter((s) => !s.applied);

  return (
    <div className="ai-chat">
      {pending.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div className="section-header">
            AI Suggestions ({pending.length})
          </div>
          {pending.map((s) => (
            <div key={s.id} className={`ai-card ${s.severity}`}>
              <div className="ai-card-header">
                <div className="ai-severity-dot" />
                <span className="ai-title">{s.title}</span>
              </div>
              <div className="ai-body">{s.description}</div>
              <div className="ai-actions">
                {s.action && (
                  <button
                    className="btn btn-success"
                    onClick={() => applySuggestion(s.id)}
                  >
                    ✓ Apply Fix
                  </button>
                )}
                <button
                  className="btn btn-ghost"
                  onClick={() => dismissSuggestion(s.id)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="section-header">Chat with Archie AI</div>

      <div className="ai-messages">
        {messages.map((m, i) => (
          <div key={i} className={`ai-msg ${m.role}`}>
            {m.text}
          </div>
        ))}
      </div>

      <div className="ai-input-row">
        <input
          className="ai-input"
          placeholder="Ask about your design..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button className="btn btn-primary" onClick={send}>
          →
        </button>
      </div>
    </div>
  );
}

function RoomsPanel() {
  const {
    rooms,
    doors,
    windows,
    furniture,
    selectedId,
    updateRoom,
    deleteRoom,
    extendRoom,
    mergeRooms,
    deleteDoor,
    deleteWindow,
    openDoors,
    toggleDoor,
    activeFloor,
  } = useDesignStore();
  const vis = rooms.filter((r) => r.floor === activeFloor);
  const selRoom = vis.find((r) => r.id === selectedId);
  const selDoor = doors.find((d) => d.id === selectedId);
  const selWin = windows.find((w) => w.id === selectedId);

  return (
    <div>
      {selDoor && (
        <div
          style={{
            marginBottom: 12,
            padding: 12,
            background: "var(--bg-tertiary)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--accent)",
          }}
        >
          <div className="section-header">🚪 Selected Door</div>
          <div className="prop-group">
            <div className="prop-label">Status</div>
            <button
              className={`btn ${openDoors.has(selDoor.id) ? "btn-success" : "btn-primary"}`}
              style={{ width: "100%" }}
              onClick={() => toggleDoor(selDoor.id)}
            >
              {openDoors.has(selDoor.id)
                ? "▲ Open (Click to Close)"
                : "▼ Closed (Click to Open)"}
            </button>
          </div>
          <button
            className="btn btn-danger w-full"
            style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
            onClick={() => deleteDoor(selDoor.id)}
          >
            🗑 Delete Door
          </button>
        </div>
      )}

      {selWin && (
        <div
          style={{
            marginBottom: 12,
            padding: 12,
            background: "var(--bg-tertiary)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--accent)",
          }}
        >
          <div className="section-header">🪟 Selected Window</div>
          <button
            className="btn btn-danger w-full"
            style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
            onClick={() => deleteWindow(selWin.id)}
          >
            🗑 Delete Window
          </button>
        </div>
      )}

      {selRoom && (
        <div
          style={{
            marginBottom: 12,
            padding: 12,
            background: "var(--bg-tertiary)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--accent)",
          }}
        >
          <div className="section-header">🏠 Room Settings</div>
          <div className="prop-group">
            <div className="prop-label">Room Name</div>
            <input
              className="prop-input"
              value={selRoom.name}
              onChange={(e) =>
                updateRoom(selRoom.id, { name: e.target.value })
              }
            />
          </div>
          <div className="prop-group">
            <div className="prop-label">Room Type</div>
            <select
              className="prop-input"
              value={selRoom.type || "room"}
              onChange={(e) =>
                updateRoom(selRoom.id, { type: e.target.value })
              }
            >
              {ROOM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="prop-group">
            <div className="prop-label">Floor Color</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 4,
              }}
            >
              {ROOM_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => updateRoom(selRoom.id, { color: c })}
                  style={{
                    height: 24,
                    borderRadius: 4,
                    background: c,
                    border:
                      selRoom.color === c
                        ? "2px solid var(--accent)"
                        : "1px solid var(--border)",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          </div>

          <div className="prop-group" style={{ marginTop: 8 }}>
            <div className="prop-label">📏 Extend Room Size</div>
            <div
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}
            >
              <button
                className="btn btn-secondary"
                style={{ fontSize: 11, padding: "4px" }}
                onClick={() => extendRoom(selRoom.id, "top", 50)}
              >
                ↑ Top +50cm
              </button>
              <button
                className="btn btn-secondary"
                style={{ fontSize: 11, padding: "4px" }}
                onClick={() => extendRoom(selRoom.id, "bottom", 50)}
              >
                ↓ Bottom +50cm
              </button>
              <button
                className="btn btn-secondary"
                style={{ fontSize: 11, padding: "4px" }}
                onClick={() => extendRoom(selRoom.id, "left", 50)}
              >
                ← Left +50cm
              </button>
              <button
                className="btn btn-secondary"
                style={{ fontSize: 11, padding: "4px" }}
                onClick={() => extendRoom(selRoom.id, "right", 50)}
              >
                → Right +50cm
              </button>
            </div>
          </div>

          {vis.filter((r) => r.id !== selRoom.id).length > 0 && (
            <div className="prop-group" style={{ marginTop: 8 }}>
              <div className="prop-label">🔗 Join / Merge Room</div>
              <div style={{ display: "flex", gap: 6 }}>
                <select
                  id="merge-room-target"
                  className="prop-input"
                  style={{ fontSize: 11 }}
                >
                  {vis
                    .filter((r) => r.id !== selRoom.id)
                    .map((other) => (
                      <option key={other.id} value={other.id}>
                        {other.name}
                      </option>
                    ))}
                </select>
                <button
                  className="btn btn-primary"
                  style={{
                    fontSize: 11,
                    padding: "4px 8px",
                    whiteSpace: "nowrap",
                  }}
                  onClick={() => {
                    const targetEl =
                      document.getElementById("merge-room-target");
                    if (targetEl && targetEl.value) {
                      mergeRooms(selRoom.id, targetEl.value);
                    }
                  }}
                >
                  🔗 Merge
                </button>
              </div>
            </div>
          )}

          <button
            className="btn btn-danger w-full"
            style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
            onClick={() => deleteRoom(selRoom.id)}
          >
            🗑 Delete Room
          </button>
        </div>
      )}

      <div
        style={{
          marginTop: 12,
          padding: 10,
          background: "var(--bg-tertiary)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border)",
          fontSize: 11,
          color: "var(--text-muted)",
        }}
      >
        <strong style={{ color: "var(--text-secondary)" }}>Total area:</strong>{" "}
        {vis
          .reduce((a, r) => a + (r.width / 100) * (r.height / 100), 0)
          .toFixed(1)}{" "}
        m²
        {" · "}
        <strong style={{ color: "var(--text-secondary)" }}>
          {vis.length}
        </strong>{" "}
        rooms
      </div>
    </div>
  );
}

function LibraryPanel() {
  const { addFurniture, activeFloor, rooms } = useDesignStore();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  const filtered = LIBRARY_ITEMS.filter((i) => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "all" || i.category === catFilter;
    return matchSearch && matchCat;
  });

  const place = (item) => {
    const r = rooms.find((rm) => rm.floor === activeFloor);
    addFurniture({
      roomId: r?.id ?? null,
      type: item.type,
      x: r ? r.x + 30 : 100,
      y: r ? r.y + 30 : 100,
      width: item.w,
      height: item.h,
      color: item.color,
      label: item.name,
      rotation: 0,
    });
  };

  const categories = [
    { id: "all", label: "All" },
    { id: "doors", label: "🚪 Doors" },
    { id: "windows", label: "🪟 Windows" },
    { id: "seating", label: "Seating" },
    { id: "beds", label: "Beds" },
    { id: "tables", label: "Tables" },
    { id: "storage", label: "Storage" },
    { id: "decor", label: "Bath/Decor" },
  ];

  return (
    <div>
      <div className="section-header">Furniture & Asset Library</div>
      <input
        className="prop-input"
        placeholder="🔍 Search furniture..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 8 }}
      />

      <div
        style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}
      >
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCatFilter(c.id)}
            style={{
              padding: "3px 8px",
              fontSize: 11,
              borderRadius: 99,
              border: "1px solid var(--border)",
              background:
                catFilter === c.id ? "var(--accent)" : "var(--bg-tertiary)",
              color: catFilter === c.id ? "#fff" : "var(--text-secondary)",
              cursor: "pointer",
              fontWeight: catFilter === c.id ? 600 : 400,
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="library-grid">
        {filtered.map((item, i) => (
          <div
            key={i}
            className="lib-item"
            onClick={() => place(item)}
            draggable={true}
            onDragStart={(e) =>
              e.dataTransfer.setData("application/json", JSON.stringify(item))
            }
            title={`Click or Drag to place ${item.name}`}
          >
            <div className="lib-item-icon">{item.icon}</div>
            <div className="lib-item-name">{item.name}</div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && (
        <div
          style={{
            color: "var(--text-muted)",
            fontSize: 12,
            textAlign: "center",
            padding: 20,
          }}
        >
          No furniture found matching your search.
        </div>
      )}
    </div>
  );
}

function ThemePanel() {
  const { theme, setTheme, pbrMaterialTheme, setPBRMaterialTheme } =
    useDesignStore();

  return (
    <div>
      <div className="section-header">Design Theme</div>
      {THEMES.map((t) => (
        <div
          key={t.id}
          className={`theme-card ${theme === t.id ? "active" : ""}`}
          onClick={() => setTheme(t.id)}
        >
          <div className="theme-swatch">
            {t.colors.map((c, i) => (
              <div key={i} className="theme-dot" style={{ background: c }} />
            ))}
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "var(--text-primary)",
            }}
          >
            {t.name}
          </span>
          {theme === t.id && (
            <span
              style={{
                marginLeft: "auto",
                color: "var(--green)",
                fontSize: 12,
              }}
            >
              ✓
            </span>
          )}
        </div>
      ))}

      <div className="section-header" style={{ marginTop: 16 }}>
        PBR Material Engine
      </div>
      <div className="prop-group">
        <div className="prop-label">Floor PBR Texture</div>
        <select
          className="prop-input"
          value={pbrMaterialTheme.floorTexture}
          onChange={(e) =>
            setPBRMaterialTheme({ floorTexture: e.target.value })
          }
        >
          <option value="hardwood_parquet">🪵 Hardwood Parquet</option>
          <option value="marble_tiles">🏛️ Polished Marble Tiles</option>
          <option value="ceramic_tiles">🔲 Ceramic Tiles</option>
          <option value="terracotta">🧱 Terracotta Clay</option>
          <option value="carpet">🧶 Plush Carpet</option>
        </select>
      </div>
      <div className="prop-group">
        <div className="prop-label">Wall PBR Surface</div>
        <select
          className="prop-input"
          value={pbrMaterialTheme.wallTexture}
          onChange={(e) => setPBRMaterialTheme({ wallTexture: e.target.value })}
        >
          <option value="modern_paint">🎨 Smooth Modern Paint</option>
          <option value="brick_stone">🧱 Brick / Stone Accent</option>
          <option value="wood_panel">🪵 Wood Slats / Paneling</option>
          <option value="concrete">🏗️ Industrial Concrete</option>
        </select>
      </div>
    </div>
  );
}

const TABS = [
  { id: "floors", label: "🏢 Floors" },
  { id: "rooms", label: "🏠 Rooms" },
  { id: "library", label: "🛋️ Library" },
  { id: "ai", label: "🤖 AI" },
  { id: "theme", label: "🎨 Theme" },
];

const FURN_COLORS = [
  "#546e7a", "#37474f", "#78909c", "#4e342e", "#6d4c41",
  "#8e24aa", "#ab47bc", "#1e88e5", "#42a5f5", "#2e7d32",
  "#c8923a", "#e53935", "#f9a825", "#00897b", "#212121",
  "#d4b483", "#ffffff", "#f5f5f5", "#b0bec5", "#607d8b",
];

// ─── Exported Furniture Properties Panel ─────────────────────────────────────
export function FurniturePropertiesPanel() {
  const {
    furniture,
    selectedId,
    setSelectedId,
    updateFurniture,
    deleteFurniture,
    addFurniture,
    viewMode,
  } = useDesignStore();

  const selFurn = furniture.find((f) => f.id === selectedId);

  const [wStr, setWStr] = useState("");
  const [hStr, setHStr] = useState("");

  useEffect(() => {
    if (selFurn) {
      setWStr(String(selFurn.width ?? ""));
      setHStr(String(selFurn.height ?? ""));
    }
  }, [selFurn?.id]);

  if (viewMode !== "2d" || !selFurn) return null;

  const rot = selFurn.rotation ?? 0;
  const opacity = selFurn.opacity ?? 1;
  const flipH = selFurn.flipH ?? false;

  const update = (patch) => updateFurniture(selFurn.id, patch);

  const commitWidth = () => {
    const v = parseFloat(wStr);
    if (!isNaN(v) && v > 0) update({ width: v });
    else setWStr(String(selFurn.width));
  };

  const commitHeight = () => {
    const v = parseFloat(hStr);
    if (!isNaN(v) && v > 0) update({ height: v });
    else setHStr(String(selFurn.height));
  };

  const handleDuplicate = () => {
    addFurniture({
      ...selFurn,
      id: undefined,
      x: (selFurn.x ?? 0) + 30,
      y: (selFurn.y ?? 0) + 30,
    });
  };

  const typeIcon = selFurn.type?.startsWith("door")
    ? "🚪"
    : selFurn.type?.startsWith("window")
    ? "🪟"
    : selFurn.type?.startsWith("bed")
    ? "🛏️"
    : selFurn.type?.startsWith("sofa") || selFurn.type === "armchair"
    ? "🛋️"
    : selFurn.type?.startsWith("dining") || selFurn.type?.startsWith("table") || selFurn.type === "desk" || selFurn.type === "nightstand"
    ? "🪑"
    : "📦";

  return (
    <div
      style={{
        position: "absolute",
        right: 0,
        top: 0,
        bottom: 0,
        width: 260,
        background: "var(--bg-secondary)",
        borderLeft: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        zIndex: 200,
        boxShadow: "-8px 0 32px rgba(0,0,0,0.35)",
        animation: "slideInRight 0.22s cubic-bezier(0.22,1,0.36,1)",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          padding: "14px 14px 10px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
          background: "var(--bg-secondary)",
          position: "sticky",
          top: 0,
          zIndex: 1,
        }}
      >
        <span style={{ fontSize: 20 }}>{typeIcon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--accent)",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
            }}
          >
            Properties
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-primary)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {selFurn.label}
          </div>
        </div>
        <button
          onClick={() => setSelectedId(null)}
          style={{
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            width: 26,
            height: 26,
            cursor: "pointer",
            color: "var(--text-muted)",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
          title="Close panel"
        >
          ✕
        </button>
      </div>

      <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div className="prop-label" style={{ marginBottom: 4 }}>Label / Name</div>
          <input
            className="prop-input"
            value={selFurn.label}
            onChange={(e) => update({ label: e.target.value })}
            style={{ width: "100%", boxSizing: "border-box" }}
          />
        </div>

        <div>
          <div className="prop-label" style={{ marginBottom: 6 }}>📐 Size (cm)</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 3 }}>Width</div>
              <input
                className="prop-input"
                type="number"
                value={wStr}
                onChange={(e) => setWStr(e.target.value)}
                onBlur={commitWidth}
                onKeyDown={(e) => e.key === "Enter" && commitWidth()}
                style={{ width: "100%", boxSizing: "border-box" }}
              />
            </div>
            <div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 3 }}>Depth</div>
              <input
                className="prop-input"
                type="number"
                value={hStr}
                onChange={(e) => setHStr(e.target.value)}
                onBlur={commitHeight}
                onKeyDown={(e) => e.key === "Enter" && commitHeight()}
                style={{ width: "100%", boxSizing: "border-box" }}
              />
            </div>
          </div>
        </div>

        <div>
          <div className="prop-label" style={{ marginBottom: 6 }}>🔄 Rotation</div>
          <input
            type="range"
            min={0}
            max={360}
            step={1}
            value={rot}
            onChange={(e) => update({ rotation: +e.target.value })}
            style={{ width: "100%", accentColor: "var(--accent)", marginBottom: 6 }}
          />
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              onClick={() => update({ rotation: ((rot - 90) + 360) % 360 })}
              style={{
                flex: 1, padding: "5px 4px", fontSize: 11,
                background: "var(--bg-tertiary)", border: "1px solid var(--border)",
                borderRadius: 6, cursor: "pointer", color: "var(--text-primary)",
              }}
              title="Rotate -90°"
            >↺ -90°</button>
            <div
              style={{
                flex: 1, textAlign: "center", fontSize: 13, fontWeight: 700,
                color: "var(--accent)",
              }}
            >
              {rot}°
            </div>
            <button
              onClick={() => update({ rotation: (rot + 90) % 360 })}
              style={{
                flex: 1, padding: "5px 4px", fontSize: 11,
                background: "var(--bg-tertiary)", border: "1px solid var(--border)",
                borderRadius: 6, cursor: "pointer", color: "var(--text-primary)",
              }}
              title="Rotate +90°"
            >↻ +90°</button>
          </div>
        </div>

        <div>
          <div className="prop-label" style={{ marginBottom: 6 }}>🎨 Color</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 5,
              marginBottom: 8,
            }}
          >
            {FURN_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => update({ color: c })}
                title={c}
                style={{
                  width: "100%",
                  aspectRatio: "1",
                  borderRadius: 6,
                  background: c,
                  border: selFurn.color === c
                    ? "2.5px solid var(--accent)"
                    : "1.5px solid var(--border)",
                  cursor: "pointer",
                  boxShadow: selFurn.color === c ? "0 0 0 2px var(--accent)" : "none",
                  transition: "transform 0.1s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.15)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              />
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>Custom</label>
            <input
              type="color"
              value={selFurn.color || "#546e7a"}
              onChange={(e) => update({ color: e.target.value })}
              style={{
                width: 36, height: 28, padding: 0, border: "1px solid var(--border)",
                borderRadius: 6, cursor: "pointer", background: "none",
                flexShrink: 0,
              }}
            />
            <input
              className="prop-input"
              value={selFurn.color || ""}
              onChange={(e) => update({ color: e.target.value })}
              placeholder="#hex"
              style={{ flex: 1, fontFamily: "monospace", fontSize: 12, boxSizing: "border-box" }}
            />
          </div>
        </div>

        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <div className="prop-label">💧 Opacity</div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>
              {Math.round(opacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={opacity}
            onChange={(e) => update({ opacity: +e.target.value })}
            style={{ width: "100%", accentColor: "var(--accent)" }}
          />
        </div>

        <div>
          <div className="prop-label" style={{ marginBottom: 6 }}>↔ Transform</div>
          <button
            onClick={() => update({ flipH: !flipH })}
            style={{
              width: "100%",
              padding: "7px",
              fontSize: 12,
              borderRadius: 8,
              border: `1.5px solid ${flipH ? "var(--accent)" : "var(--border)"}`,
              background: flipH ? "rgba(99,102,241,0.15)" : "var(--bg-tertiary)",
              color: flipH ? "var(--accent)" : "var(--text-primary)",
              cursor: "pointer",
              fontWeight: flipH ? 700 : 400,
              transition: "all 0.15s",
            }}
          >
            {flipH ? "↔ Flip ON" : "↔ Flip Horizontal"}
          </button>
        </div>

        <div
          style={{
            padding: "8px 10px",
            background: "var(--bg-tertiary)",
            borderRadius: 8,
            border: "1px solid var(--border)",
            fontSize: 11,
            color: "var(--text-muted)",
            display: "flex",
            gap: 12,
          }}
        >
          <span>📍 X: <strong style={{ color: "var(--text-secondary)" }}>{Math.round(selFurn.x ?? 0)}</strong></span>
          <span>Y: <strong style={{ color: "var(--text-secondary)" }}>{Math.round(selFurn.y ?? 0)}</strong></span>
          <span>Type: <strong style={{ color: "var(--text-secondary)", textTransform: "capitalize" }}>{(selFurn.type ?? "").replace(/_/g, " ")}</strong></span>
        </div>

        <div style={{ height: 1, background: "var(--border)" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <button
            onClick={handleDuplicate}
            style={{
              width: "100%",
              padding: "8px",
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 8,
              border: "1.5px solid var(--border)",
              background: "var(--bg-tertiary)",
              color: "var(--text-primary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-tertiary)")}
          >
            ⧉ Duplicate Item
          </button>
          <button
            onClick={() => {
              deleteFurniture(selFurn.id);
              setSelectedId(null);
            }}
            style={{
              width: "100%",
              padding: "8px",
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 8,
              border: "1.5px solid #ef444455",
              background: "rgba(239,68,68,0.1)",
              color: "#f87171",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.2)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.1)")}
          >
            🗑 Delete Item
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Right Panel Sidebar Export ─────────────────────────────────────────
export default function RightPanel() {
  const { showAIPanel, showLibrary } = useDesignStore();
  const [activeTab, setActiveTab] = useState("floors");

  // Sync header button toggles with active tab
  useEffect(() => {
    if (showAIPanel) setActiveTab("ai");
  }, [showAIPanel]);

  useEffect(() => {
    if (showLibrary) setActiveTab("library");
  }, [showLibrary]);

  return (
    <aside
      className="right-panel"
      style={{
        width: 320,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-secondary)",
        borderLeft: "1px solid var(--border)",
        height: "100%",
        zIndex: 50,
      }}
    >
      {/* Panel Navigation Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-secondary)",
          flexShrink: 0,
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: "11px 4px",
                fontSize: 11,
                fontWeight: isActive ? 700 : 500,
                border: "none",
                background: isActive ? "var(--bg-tertiary)" : "transparent",
                color: isActive ? "var(--accent)" : "var(--text-muted)",
                cursor: "pointer",
                borderBottom: isActive
                  ? "2px solid var(--accent)"
                  : "2px solid transparent",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Body */}
      <div className="panel-body" style={{ flex: 1, overflowY: "auto", padding: 14 }}>
        {activeTab === "floors" && <FloorsPanel />}
        {activeTab === "rooms" && <RoomsPanel />}
        {activeTab === "library" && <LibraryPanel />}
        {activeTab === "ai" && <AIPanel />}
        {activeTab === "theme" && <ThemePanel />}
      </div>
    </aside>
  );
}
