import React, { useState, useRef } from 'react';
import { useDesignStore } from '../store/designStore';

const VIEWS = [
  { id: '2d',          label: '2D Plan',    icon: '⊞' },
  { id: '3d',          label: '3D View',    icon: '◈' },
  { id: 'walkthrough', label: 'Walkthrough', icon: '▶' },
  { id: 'vr',          label: 'VR',         icon: '◉' },
];

export default function Header() {
  const {
    viewMode, setViewMode,
    activeFloor, setActiveFloor,
    floors, addFloor, deleteFloor, renameFloor,
    showAIPanel, setShowAIPanel,
    showLibrary, setShowLibrary,
    snapToGrid, setSnapToGrid,
    clearDesign, loadDemo,
    exportProjectJSON, importProjectJSON,
    grounds,
  } = useDesignStore();

  const fileInputRef = useRef(null);
  const [editingFloorId, setEditingFloorId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) importProjectJSON(evt.target.result);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

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

  // Sort floors by creation order (id ascending — ground=0 is first)
  const sortedFloors = [...floors].sort((a, b) => a.id - b.id);

  // Ground floor is always the one with id === 0 (or smallest id)
  const groundFloorId = sortedFloors[0]?.id;

  // Is ground floor drawn?
  const groundFloorHasOutline = grounds.some((g) => g.floor === groundFloorId);

  return (
    <header style={{
      height: 'var(--header-height)',
      display: 'flex',
      alignItems: 'center',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      padding: '0 16px',
      flexShrink: 0,
      zIndex: 100,
      gap: 0,
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div className="header-logo">
        <div className="header-logo-icon">🏠</div>
        <span className="header-logo-name">ArchDesign</span>
        <span className="header-logo-badge">PRO</span>
      </div>

      <div className="header-divider" />

      {/* View Switcher */}
      <div className="view-switcher">
        {VIEWS.map(v => (
          <button
            key={v.id}
            className={`view-btn ${viewMode === v.id ? 'active' : ''}`}
            onClick={() => setViewMode(v.id)}
            title={v.label}
          >
            <span>{v.icon}</span>
            <span>{v.label}</span>
          </button>
        ))}
      </div>

      <div className="header-divider" />

      {/* ── Floor Manager ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          flexShrink: 0,
          minWidth: 0,
          overflowX: 'auto',
          maxWidth: 480,
          scrollbarWidth: 'none',
        }}
      >
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em', marginRight: 2, whiteSpace: 'nowrap' }}>
          FLOORS
        </span>

        {sortedFloors.map((f) => {
          const isActive = activeFloor === f.id;
          const isGroundFloor = f.id === groundFloorId;
          const isEditing = editingFloorId === f.id;

          return (
            <div
              key={f.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 0,
                borderRadius: 6,
                background: isActive ? 'var(--accent)' : 'transparent',
                border: isActive ? '1px solid var(--accent)' : '1px solid var(--border)',
                transition: 'all 0.15s',
                flexShrink: 0,
              }}
            >
              {isEditing ? (
                <input
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename();
                    if (e.key === 'Escape') setEditingFloorId(null);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--text-primary)',
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '3px 6px',
                    width: Math.max(60, editingName.length * 8),
                  }}
                />
              ) : (
                <button
                  className={`floor-btn ${isActive ? 'active' : ''}`}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    borderRadius: isGroundFloor || sortedFloors.length <= 1 ? 6 : '6px 0 0 6px',
                    paddingRight: isGroundFloor || sortedFloors.length <= 1 ? undefined : 6,
                  }}
                  onClick={() => setActiveFloor(f.id)}
                  onDoubleClick={(e) => startRename(f, e)}
                  title={`Switch to ${f.name} (double-click to rename)`}
                >
                  {isGroundFloor ? '🏠' : '🏢'} {f.name}
                </button>
              )}

              {/* Delete button — not shown for ground floor or if only 1 floor */}
              {!isGroundFloor && sortedFloors.length > 1 && !isEditing && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Delete "${f.name}" and all its content?`)) {
                      deleteFloor(f.id);
                    }
                  }}
                  title={`Delete ${f.name}`}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderLeft: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '0 6px 6px 0',
                    color: isActive ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: 11,
                    lineHeight: 1,
                    padding: '4px 5px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}

        {/* + Add Floor */}
        <button
          onClick={() => {
            if (!groundFloorHasOutline) {
              alert('Please draw the Ground Floor outline first before adding upper floors.');
              return;
            }
            addFloor();
          }}
          title="Add a new floor (ground outline auto-copied)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 9px',
            fontSize: 11,
            fontWeight: 600,
            background: 'transparent',
            border: '1px dashed var(--border)',
            borderRadius: 6,
            color: 'var(--text-muted)',
            cursor: groundFloorHasOutline ? 'pointer' : 'not-allowed',
            opacity: groundFloorHasOutline ? 1 : 0.45,
            flexShrink: 0,
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          + Add Floor
        </button>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Actions */}
      <div className="header-actions">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />

        <button
          className="btn btn-secondary"
          onClick={() => fileInputRef.current?.click()}
          title="Open Saved Project File (.json)"
          style={{ gap: 6, fontSize: 12, padding: '4px 10px' }}
        >
          <span>📂</span>
          <span>Open File</span>
        </button>

        <button
          className="btn btn-primary"
          onClick={exportProjectJSON}
          title="Save Design File (.json)"
          style={{ gap: 6, fontSize: 12, padding: '4px 10px' }}
        >
          <span>💾</span>
          <span>Save File</span>
        </button>

        <div className="header-divider" style={{ margin: '0 4px' }} />

        <button
          className={`icon-btn ${snapToGrid ? 'active' : ''}`}
          onClick={() => setSnapToGrid(!snapToGrid)}
          title="Snap to Grid"
        >
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="2" width="5" height="5" rx="1"/>
            <rect x="9" y="2" width="5" height="5" rx="1"/>
            <rect x="2" y="9" width="5" height="5" rx="1"/>
            <rect x="9" y="9" width="5" height="5" rx="1"/>
          </svg>
        </button>

        <button
          className={`icon-btn ${showAIPanel ? 'active' : ''}`}
          onClick={() => setShowAIPanel(!showAIPanel)}
          title="AI Copilot"
        >
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="6" r="3"/>
            <path d="M2 14c0-3 2.7-5 6-5s6 2 6 5"/>
            <path d="M8 1v1M1 6h1M15 6h-1M3 3l.7.7M13 3l-.7.7"/>
          </svg>
        </button>

        <button
          className={`icon-btn ${showLibrary ? 'active' : ''}`}
          onClick={() => setShowLibrary(!showLibrary)}
          title="Asset Library"
        >
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 3h12v2H2z"/>
            <path d="M2 7h12v2H2z"/>
            <path d="M2 11h12v2H2z"/>
          </svg>
        </button>

        <div className="header-divider" style={{ margin: '0 4px' }} />

        <button className="icon-btn" onClick={loadDemo} title="Load Demo">
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 8a6 6 0 0 1 10-4.5L14 6"/>
            <path d="M14 2v4h-4"/>
          </svg>
        </button>

        <button className="icon-btn" onClick={clearDesign} title="Clear Canvas"
          style={{ borderColor: 'rgba(248,81,73,0.3)', color: 'var(--red)' }}>
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 3l10 10M13 3 3 13"/>
          </svg>
        </button>
      </div>
    </header>
  );
}
