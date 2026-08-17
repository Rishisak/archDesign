import React, { useState } from 'react';
import { useDesignStore } from '../store/designStore';

export const LIBRARY_ITEMS = [
  { category: "doors", icon: "🚪", name: "Single Door", type: "door_single", w: 80, h: 20, color: "#c8923a" },
  { category: "doors", icon: "🚪", name: "Double Door", type: "door_double", w: 140, h: 20, color: "#c8923a" },
  { category: "doors", icon: "🚪", name: "Sliding Door", type: "door_sliding", w: 120, h: 20, color: "#b07a30" },
  { category: "windows", icon: "🪟", name: "Single Window", type: "window_single", w: 80, h: 15, color: "#64b5f6" },
  { category: "windows", icon: "🪟", name: "Double Window", type: "window_double", w: 140, h: 15, color: "#42a5f5" },
  { category: "seating", icon: "🛋️", name: "3-Seater Sofa", type: "sofa", w: 180, h: 80, color: "#546e7a" },
  { category: "seating", icon: "🛋️", name: "Sectional L-Sofa", type: "sofa_sectional", w: 200, h: 160, color: "#37474f" },
  { category: "seating", icon: "🪑", name: "Armchair", type: "armchair", w: 80, h: 80, color: "#78909c" },
  { category: "beds", icon: "🛏️", name: "Single Bed", type: "bed_single", w: 100, h: 190, color: "#8e24aa" },
  { category: "beds", icon: "🛏️", name: "Double Bed", type: "bed_double", w: 140, h: 190, color: "#ab47bc" },
  { category: "tables", icon: "🍽️", name: "Dining Table", type: "dining_4", w: 120, h: 80, color: "#8d6e63" },
  { category: "tables", icon: "☕", name: "Coffee Table", type: "table_coffee", w: 100, h: 50, color: "#a1887f" },
  { category: "tables", icon: "🖥️", name: "Office Desk", type: "desk", w: 130, h: 65, color: "#5d4037" },
];

export function FurniturePropertiesPanel() {
  return null;
}

export default function RightPanel() {
  const store = useDesignStore();
  const {
    viewMode = '2d',
    setViewMode = () => {},
    selectedId = null,
    rooms = [],
    updateRoom = () => {},
    furniture = [],
    updateFurniture = () => {}
  } = store || {};

  const selectedRoom = rooms.find((r) => r && r.id === selectedId);
  const selectedFurn = furniture.find((f) => f && f.id === selectedId);

  const objectType = selectedRoom ? 'Room' : selectedFurn ? 'Furniture' : 'Wall';
  const posX = selectedRoom ? (selectedRoom.x / 50).toFixed(2) : selectedFurn ? (selectedFurn.x / 50).toFixed(2) : '4.20';
  const posY = selectedRoom ? (selectedRoom.y / 50).toFixed(2) : selectedFurn ? (selectedFurn.y / 50).toFixed(2) : '3.10';
  
  const lengthVal = selectedRoom ? (selectedRoom.width / 50).toFixed(2) : selectedFurn ? (selectedFurn.width / 50).toFixed(2) : '4.00';
  const widthVal = selectedRoom ? (selectedRoom.height / 50).toFixed(2) : selectedFurn ? (selectedFurn.height / 50).toFixed(2) : '0.20';
  const heightVal = selectedRoom?.wallHeight ? selectedRoom.wallHeight.toFixed(2) : '3.00';

  const colorVal = selectedRoom ? selectedRoom.color : selectedFurn ? selectedFurn.color : '#F5F5F5';

  const [opacity, setOpacity] = useState(100);
  const [visible, setVisible] = useState(true);
  const [material, setMaterial] = useState('Wall Paint');

  const handleColorChange = (e) => {
    const newCol = e.target.value;
    if (selectedRoom) {
      updateRoom(selectedRoom.id, { color: newCol });
    } else if (selectedFurn) {
      updateFurniture(selectedFurn.id, { color: newCol });
    }
  };

  const handleHeightChange = (e) => {
    const val = parseFloat(e.target.value) || 3.0;
    if (selectedRoom) {
      updateRoom(selectedRoom.id, { wallHeight: val });
    }
  };

  return (
    <aside className="right-views-properties-column">
      <div className="right-column-scroll">
        {/* Card 1: 2D View (This Floor) */}
        <div className={`right-preview-card ${viewMode === '2d' ? 'active-view' : ''}`}>
          <div className="preview-card-header">
            <span className="card-title">2D View <span className="floor-tag">(This Floor)</span></span>
            <button
              className="expand-btn"
              onClick={() => setViewMode('2d')}
              title="Expand 2D View"
            >
              ⤢
            </button>
          </div>
          <div className="preview-thumbnail-container" onClick={() => setViewMode('2d')}>
            <svg viewBox="0 0 200 140" className="preview-svg-floorplan">
              <rect x="10" y="10" width="180" height="120" fill="#ffffff" stroke="#333" strokeWidth="2" />
              <rect x="25" y="25" width="70" height="50" fill="#f8fafc" stroke="#475569" strokeWidth="1.5" />
              <rect x="105" y="25" width="70" height="40" fill="#f1f5f9" stroke="#475569" strokeWidth="1.5" />
              <rect x="25" y="85" width="70" height="35" fill="#f8fafc" stroke="#475569" strokeWidth="1.5" />
              <rect x="105" y="75" width="70" height="45" fill="#f1f5f9" stroke="#475569" strokeWidth="1.5" />
              <text x="35" y="55" fontSize="8" fill="#64748b" fontFamily="sans-serif">BEDROOM 1</text>
              <text x="115" y="48" fontSize="8" fill="#64748b" fontFamily="sans-serif">KITCHEN</text>
              <text x="115" y="100" fontSize="8" fill="#64748b" fontFamily="sans-serif">DINING</text>
            </svg>
            <div className="preview-overlay-hover">
              {viewMode === '2d' ? '✓ Currently Active View' : 'Click to Switch to 2D Plan'}
            </div>
          </div>
        </div>

        {/* Card 2: 3D View (This Floor) */}
        <div className={`right-preview-card ${viewMode === '3d' ? 'active-view' : ''}`}>
          <div className="preview-card-header">
            <span className="card-title">3D View <span className="floor-tag">(This Floor)</span></span>
            <button
              className="expand-btn"
              onClick={() => setViewMode('3d')}
              title="Expand 3D Floor View"
            >
              ⤢
            </button>
          </div>
          <div className="preview-thumbnail-container" onClick={() => setViewMode('3d')}>
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
              {viewMode === '3d' ? '✓ Currently Active View' : 'Click to Switch to 3D Floor View'}
            </div>
          </div>
        </div>

        {/* Card 3: 3D View (Full Building) */}
        <div className={`right-preview-card ${viewMode === 'walkthrough' ? 'active-view' : ''}`}>
          <div className="preview-card-header">
            <span className="card-title">3D View <span className="floor-tag">(Full Building)</span></span>
            <button
              className="expand-btn"
              onClick={() => setViewMode('walkthrough')}
              title="Expand Full Building View"
            >
              ⤢
            </button>
          </div>
          <div className="preview-thumbnail-container" onClick={() => setViewMode('walkthrough')}>
            <div className="preview-building-render-graphic">
              <div className="building-façade">
                <div className="balcony-glass" />
                <div className="balcony-glass lower" />
                <div className="car-parked" />
              </div>
            </div>
            <div className="preview-overlay-hover">
              {viewMode === 'walkthrough' ? '✓ Currently Active View' : 'Click to Switch to Full Building View'}
            </div>
          </div>
        </div>

        {/* Card 4: Properties Inspector Panel */}
        <div className="right-properties-card">
          <div className="properties-card-header">
            <span className="card-title">Properties</span>
            <button className="close-btn" onClick={() => {}}>✕</button>
          </div>

          <div className="properties-form-body">
            {/* Object selector */}
            <div className="form-group">
              <label>Object</label>
              <select className="prop-select" value={objectType} onChange={() => {}}>
                <option value="Wall">Wall</option>
                <option value="Room">Room</option>
                <option value="Furniture">Furniture</option>
              </select>
            </div>

            {/* Position inputs */}
            <div className="form-group">
              <label>Position</label>
              <div className="input-pair">
                <div className="labeled-input">
                  <span className="axis-label">X</span>
                  <input className="prop-input" value={`${posX} m`} readOnly />
                </div>
                <div className="labeled-input">
                  <span className="axis-label">Y</span>
                  <input className="prop-input" value={`${posY} m`} readOnly />
                </div>
              </div>
            </div>

            {/* Dimensions inputs */}
            <div className="form-group">
              <label>Dimensions</label>
              <div className="dimensions-stack">
                <div className="dimension-row">
                  <span className="dim-name">Length</span>
                  <input className="prop-input" value={`${lengthVal} m`} readOnly />
                </div>
                <div className="dimension-row">
                  <span className="dim-name">Width</span>
                  <input className="prop-input" value={`${widthVal} m`} readOnly />
                </div>
                <div className="dimension-row">
                  <span className="dim-name">Height</span>
                  <input
                    className="prop-input"
                    value={`${heightVal} m`}
                    onChange={handleHeightChange}
                  />
                </div>
              </div>
            </div>

            {/* Material dropdown */}
            <div className="form-group">
              <label>Material</label>
              <div className="material-picker-box">
                <select
                  className="prop-select"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                >
                  <option value="Wall Paint">Wall Paint</option>
                  <option value="Wood Finish">Wood Finish</option>
                  <option value="Concrete">Concrete</option>
                  <option value="Marble Tile">Marble Tile</option>
                </select>
                <div className="material-color-chip" style={{ background: colorVal }} />
              </div>
            </div>

            {/* Color picker */}
            <div className="form-group">
              <label>Color</label>
              <div className="color-picker-box">
                <input
                  type="text"
                  className="prop-input"
                  value={typeof colorVal === 'string' ? colorVal.toUpperCase() : '#F5F5F5'}
                  onChange={handleColorChange}
                />
                <input
                  type="color"
                  className="color-swatch-picker"
                  value={typeof colorVal === 'string' && colorVal.startsWith('#') ? colorVal : '#F5F5F5'}
                  onChange={handleColorChange}
                />
              </div>
            </div>

            {/* Other section: Opacity slider & Visible toggle */}
            <div className="form-group">
              <label>Other</label>
              <div className="other-controls-stack">
                <div className="slider-row">
                  <div className="slider-label-line">
                    <span>Opacity</span>
                    <span>{opacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={opacity}
                    className="prop-slider"
                    onChange={(e) => setOpacity(e.target.value)}
                  />
                </div>

                <div className="visible-toggle-row">
                  <span>Visible</span>
                  <div
                    className={`toggle-switch ${visible ? 'active' : ''}`}
                    onClick={() => setVisible(!visible)}
                  >
                    <div className="toggle-handle" />
                  </div>
                </div>
              </div>
            </div>

            {/* More Properties Button */}
            <button
              className="more-properties-btn"
              onClick={() => {
                if (selectedId) {
                  alert(`Properties for selected object (${selectedId}) are active.`);
                } else {
                  alert('Click on any room or furniture item on the canvas to inspect detailed properties.');
                }
              }}
            >
              More Properties
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
