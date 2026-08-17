import React from "react";
import { useDesignStore } from "../store/designStore";

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

export function FurniturePropertiesPanel() {
  return null;
}

export default function RightPanel() {
  const {
    viewMode = "2d",
    showAllFloorsIn3D = false,
    setViewMode = () => {},
    floors = [],
  } = useDesignStore() || {};

  const open3DView = (allFloors) => setViewMode("3d", { allFloors });
  const isSingleFloor3D = viewMode === "3d" && !showAllFloorsIn3D;
  const isAllFloors3D = viewMode === "3d" && showAllFloorsIn3D;
  const floorCount = floors.length;

  return (
    <aside className="right-views-properties-column">
      <div className="right-column-scroll">
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
          >
            <div className="preview-3d-iso-graphic">
              <div className="iso-building-box">
                <div className="iso-wall front" />
                <div className="iso-wall side" />
                <div className="iso-roof-top">
                  <div className="room-layout-3d-mini">
                    <div className="mini-bed" />
                    <div className="mini-sofa" />
                    <div className="mini-table" />
                  </div>
                </div>
              </div>
            </div>
            <div className="preview-overlay-hover">
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
          >
            <div className="preview-all-floors-graphic">
              <div className="stacked-building">
                <div className="stacked-floor upper">
                  <div className="stacked-window" />
                  <div className="stacked-window" />
                </div>
                <div className="stacked-floor ground">
                  <div className="stacked-window wide" />
                  <div className="stacked-door" />
                </div>
              </div>
              {floorCount > 1 && (
                <span className="floor-count-badge">{floorCount} floors</span>
              )}
            </div>
            <div className="preview-overlay-hover">
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
