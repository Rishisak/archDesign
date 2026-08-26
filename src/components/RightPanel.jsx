import React, { Suspense } from "react";
import { useDesignStore } from "../store/designStore";

const MiniThreeDPreview = React.lazy(() => import('./MiniThreeDPreview'));

function Mini3DLoading() {
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#1a2030',
    }}>
      <div style={{
        width: 22, height: 22,
        border: '2px solid rgba(255,255,255,0.1)',
        borderTop: '2px solid #4f8ef7',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  );
}

export const LIBRARY_ITEMS = [
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
    category: "tables",
    icon: "🍽️",
    name: "Dining Table",
    type: "dining_4",
    w: 120,
    h: 80,
    color: "#8d6e63",
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
];

const FURN_COLORS = [
  "#546e7a", "#37474f", "#78909c", "#4e342e", "#6d4c41",
  "#8e24aa", "#ab47bc", "#1e88e5", "#42a5f5", "#2e7d32",
  "#c8923a", "#e53935", "#f9a825", "#00897b", "#212121",
  "#d4b483", "#ffffff", "#f5f5f5", "#b0bec5", "#607d8b",
];

function useSelectedFurniture() {
  const furniture = useDesignStore((s) => s.furniture);
  const selectedId = useDesignStore((s) => s.selectedId);
  return furniture.find((f) => f.id === selectedId) || null;
}

function FurniturePropertiesForm({ compact = false }) {
  const selFurn = useSelectedFurniture();
  const setSelectedId = useDesignStore((s) => s.setSelectedId);
  const updateFurniture = useDesignStore((s) => s.updateFurniture);
  const deleteFurniture = useDesignStore((s) => s.deleteFurniture);
  const addFurniture = useDesignStore((s) => s.addFurniture);

  const [wStr, setWStr] = React.useState("");
  const [hStr, setHStr] = React.useState("");

  React.useEffect(() => {
    if (selFurn) {
      setWStr(String(selFurn.width ?? ""));
      setHStr(String(selFurn.height ?? ""));
    }
  }, [selFurn?.id]);

  if (!selFurn) return null;

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

  const typeIcon = selFurn.type?.startsWith("door")
    ? "🚪"
    : selFurn.type?.startsWith("window")
    ? "🪟"
    : selFurn.type?.startsWith("bed")
    ? "🛏️"
    : selFurn.type?.startsWith("sofa") || selFurn.type === "armchair"
    ? "🛋️"
    : selFurn.type?.startsWith("dining") ||
      selFurn.type?.startsWith("table") ||
      selFurn.type === "desk" ||
      selFurn.type === "nightstand"
    ? "🪑"
    : "📦";

  return (
    <div className={compact ? "right-properties-card" : undefined}>
      <div className="properties-card-header" style={compact ? undefined : { padding: "14px 14px 10px", borderBottom: "1px solid var(--border)" }}>
        <span className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>{typeIcon}</span>
          <span>
            Properties
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", textTransform: "none", letterSpacing: 0 }}>
              {selFurn.label || "Furniture"}
            </div>
          </span>
        </span>
        <button
          className="close-btn"
          onClick={() => setSelectedId(null)}
          title="Deselect"
        >
          ✕
        </button>
      </div>

      <div className="properties-form-body" style={compact ? undefined : { padding: 12 }}>
        <div className="form-group">
          <label>Label / Name</label>
          <input
            className="prop-input"
            value={selFurn.label || ""}
            onChange={(e) => update({ label: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Size (cm)</label>
          <div className="input-pair">
            <div className="labeled-input">
              <span className="axis-label">W</span>
              <input
                className="prop-input"
                type="number"
                value={wStr}
                onChange={(e) => setWStr(e.target.value)}
                onBlur={commitWidth}
                onKeyDown={(e) => e.key === "Enter" && commitWidth()}
              />
            </div>
            <div className="labeled-input">
              <span className="axis-label">D</span>
              <input
                className="prop-input"
                type="number"
                value={hStr}
                onChange={(e) => setHStr(e.target.value)}
                onBlur={commitHeight}
                onKeyDown={(e) => e.key === "Enter" && commitHeight()}
              />
            </div>
          </div>
        </div>

        <div className="form-group">
          <div className="slider-label-line">
            <label>Rotation</label>
            <span>{rot}°</span>
          </div>
          <input
            className="prop-slider"
            type="range"
            min={0}
            max={360}
            step={1}
            value={rot}
            onChange={(e) => update({ rotation: +e.target.value })}
          />
          <div className="input-pair" style={{ marginTop: 6 }}>
            <button type="button" className="btn btn-ghost" onClick={() => update({ rotation: (rot - 90 + 360) % 360 })}>
              ↺ -90°
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => update({ rotation: (rot + 90) % 360 })}>
              ↻ +90°
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>Color</label>
          <div className="color-row">
            {FURN_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`color-swatch${selFurn.color === c ? " selected" : ""}`}
                style={{ background: c }}
                title={c}
                onClick={() => update({ color: c })}
              />
            ))}
          </div>
          <div className="color-picker-box" style={{ marginTop: 8 }}>
            <input
              className="color-swatch-picker"
              type="color"
              value={selFurn.color || "#546e7a"}
              onChange={(e) => update({ color: e.target.value })}
            />
            <input
              className="prop-input"
              value={selFurn.color || ""}
              onChange={(e) => update({ color: e.target.value })}
              placeholder="#hex"
              style={{ fontFamily: "monospace" }}
            />
          </div>
        </div>

        <div className="form-group">
          <div className="slider-label-line">
            <label>Opacity</label>
            <span>{Math.round(opacity * 100)}%</span>
          </div>
          <input
            className="prop-slider"
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={opacity}
            onChange={(e) => update({ opacity: +e.target.value })}
          />
        </div>

        <button
          type="button"
          className="btn btn-ghost w-full"
          onClick={() => update({ flipH: !flipH })}
          style={{
            borderColor: flipH ? "var(--accent)" : undefined,
            color: flipH ? "var(--accent)" : undefined,
          }}
        >
          {flipH ? "↔ Flip ON" : "↔ Flip Horizontal"}
        </button>

        <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", gap: 12 }}>
          <span>X: {Math.round(selFurn.x ?? 0)}</span>
          <span>Y: {Math.round(selFurn.y ?? 0)}</span>
        </div>

        <button
          type="button"
          className="btn btn-ghost w-full"
          onClick={() =>
            addFurniture({
              ...selFurn,
              id: undefined,
              x: (selFurn.x ?? 0) + 30,
              y: (selFurn.y ?? 0) + 30,
            })
          }
        >
          Duplicate Item
        </button>
        <button
          type="button"
          className="btn btn-danger w-full"
          onClick={() => {
            deleteFurniture(selFurn.id);
            setSelectedId(null);
          }}
        >
          Delete Item
        </button>
      </div>
    </div>
  );
}

/** Overlay used when the right column is hidden so properties stay reachable. */
export function FurniturePropertiesPanel() {
  const viewMode = useDesignStore((s) => s.viewMode);
  const showRightPanel = useDesignStore((s) => s.showRightPanel);
  const selFurn = useSelectedFurniture();

  if (viewMode !== "2d" || !selFurn || showRightPanel) return null;

  return (
    <div
      style={{
        position: "absolute",
        right: 0,
        top: 0,
        bottom: 0,
        width: 280,
        background: "var(--bg-secondary)",
        borderLeft: "1px solid var(--border)",
        zIndex: 200,
        boxShadow: "-8px 0 32px rgba(0,0,0,0.35)",
        animation: "slideInRight 0.22s cubic-bezier(0.22,1,0.36,1)",
        overflowY: "auto",
      }}
    >
      <FurniturePropertiesForm />
    </div>
  );
}

export default function RightPanel() {
  const {
    viewMode = "2d",
    showAllFloorsIn3D = false,
    setViewMode = () => {},
    floors = [],
    setShowRightPanel = () => {},
  } = useDesignStore() || {};

  const selFurn = useSelectedFurniture();
  const open3DView = (allFloors) => setViewMode("3d", { allFloors });
  const isSingleFloor3D = viewMode === "3d" && !showAllFloorsIn3D;
  const isAllFloors3D = viewMode === "3d" && showAllFloorsIn3D;
  const floorCount = floors.length;

  return (
    <aside className="right-views-properties-column">
      <div className="right-panel-toolbar">
        <span className="right-panel-toolbar-title">
          {selFurn ? "Properties" : "Views"}
        </span>
        <button
          className="expand-btn"
          title="Hide right panel"
          onClick={() => setShowRightPanel(false)}
        >
          »
        </button>
      </div>
      <div className="right-column-scroll">
        {viewMode === "2d" && selFurn && <FurniturePropertiesForm compact />}
        {/* Card 1: 2D View (This Floor) */}
        <div
          className={`right-preview-card ${viewMode === "2d" ? "active-view" : ""}`}
        >
          <div className="preview-card-header">
            <span className="card-title">
              2D View <span className="floor-tag">(This Floor)</span>
            </span>
            <button
              className="expand-btn"
              onClick={() => setViewMode("2d")}
              title="Expand 2D View"
            >
              ⤢
            </button>
          </div>
          <div
            className="preview-thumbnail-container"
            onClick={() => setViewMode("2d")}
          >
            <svg viewBox="0 0 200 140" className="preview-svg-floorplan">
              <rect
                x="10"
                y="10"
                width="180"
                height="120"
                fill="#ffffff"
                stroke="#333"
                strokeWidth="2"
              />
              <rect
                x="25"
                y="25"
                width="70"
                height="50"
                fill="#f8fafc"
                stroke="#475569"
                strokeWidth="1.5"
              />
              <rect
                x="105"
                y="25"
                width="70"
                height="40"
                fill="#f1f5f9"
                stroke="#475569"
                strokeWidth="1.5"
              />
              <rect
                x="25"
                y="85"
                width="70"
                height="35"
                fill="#f8fafc"
                stroke="#475569"
                strokeWidth="1.5"
              />
              <rect
                x="105"
                y="75"
                width="70"
                height="45"
                fill="#f1f5f9"
                stroke="#475569"
                strokeWidth="1.5"
              />
              <text
                x="35"
                y="55"
                fontSize="8"
                fill="#64748b"
                fontFamily="sans-serif"
              >
                BEDROOM 1
              </text>
              <text
                x="115"
                y="48"
                fontSize="8"
                fill="#64748b"
                fontFamily="sans-serif"
              >
                KITCHEN
              </text>
              <text
                x="115"
                y="100"
                fontSize="8"
                fill="#64748b"
                fontFamily="sans-serif"
              >
                DINING
              </text>
            </svg>
            <div className="preview-overlay-hover">
              {viewMode === "2d"
                ? "✓ Currently Active View"
                : "Click to Switch to 2D Plan"}
            </div>
          </div>
        </div>

        {/* Card 2: 3D View (This Floor) */}
        <div
          className={`right-preview-card ${isSingleFloor3D ? "active-view" : ""}`}
        >
          <div className="preview-card-header">
            <span className="card-title">
              3D View <span className="floor-tag">(This Floor)</span>
            </span>
            <button
              className="expand-btn"
              onClick={() => open3DView(false)}
              title="Expand 3D Floor View"
            >
              ⤢
            </button>
          </div>
          <div
            className="preview-thumbnail-container"
            onClick={() => open3DView(false)}
            style={{ position: 'relative', overflow: 'hidden' }}
          >
            <Suspense fallback={<Mini3DLoading />}>
              <MiniThreeDPreview showAllFloors={false} />
            </Suspense>
            <div className="preview-overlay-hover" style={{ pointerEvents: 'none' }}>
              {isSingleFloor3D
                ? "✓ Currently Active View"
                : "Click to Switch to 3D Floor View"}
            </div>
          </div>
        </div>

        {/* Card 3: 3D View (All Floors) */}
        <div
          className={`right-preview-card ${isAllFloors3D ? "active-view" : ""}`}
        >
          <div className="preview-card-header">
            <span className="card-title">
              3D View <span className="floor-tag">(All Floors)</span>
            </span>
            <button
              className="expand-btn"
              onClick={() => open3DView(true)}
              title="Expand Full Building 3D View"
            >
              ⤢
            </button>
          </div>
          <div
            className="preview-thumbnail-container"
            onClick={() => open3DView(true)}
            style={{ position: 'relative', overflow: 'hidden' }}
          >
            <Suspense fallback={<Mini3DLoading />}>
              <MiniThreeDPreview showAllFloors={true} />
            </Suspense>
            {floorCount > 1 && (
              <span
                className="floor-count-badge"
                style={{ position: 'absolute', bottom: 8, right: 8, zIndex: 10, pointerEvents: 'none' }}
              >
                {floorCount} floors
              </span>
            )}
            <div className="preview-overlay-hover" style={{ pointerEvents: 'none' }}>
              {isAllFloors3D
                ? "✓ Currently Active View"
                : "Click to View Entire Building in 3D"}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
