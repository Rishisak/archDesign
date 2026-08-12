import React from 'react';
import { useDesignStore } from '../store/designStore';

const VIEWS = [
  { id: '2d',          label: '2D Plan',    icon: '⊞' },
  { id: '3d',          label: '3D View',    icon: '◈' },
  { id: 'walkthrough', label: 'Walkthrough', icon: '▶' },
  { id: 'vr',          label: 'VR',         icon: '◉' },
];

export default function Header() {
  const { viewMode, setViewMode, activeFloor, setActiveFloor, floors,
          showAIPanel, setShowAIPanel, showLibrary, setShowLibrary,
          snapToGrid, setSnapToGrid, clearDesign, loadDemo,
          exportProjectJSON, importProjectJSON } = useDesignStore();

  const fileInputRef = React.useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        importProjectJSON(evt.target.result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

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

      {/* Floor Selector */}
      <div className="floor-selector" style={{ marginLeft: 0 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>FLOOR</span>
        {floors.map(f => (
          <button
            key={f.id}
            className={`floor-btn ${activeFloor === f.id ? 'active' : ''}`}
            onClick={() => setActiveFloor(f.id)}
          >
            {f.name}
          </button>
        ))}
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

        {/* Open Project File */}
        <button
          className="btn btn-secondary"
          onClick={() => fileInputRef.current?.click()}
          title="Open Saved Project File (.json)"
          style={{ gap: 6, fontSize: 12, padding: '4px 10px' }}
        >
          <span>📂</span>
          <span>Open File</span>
        </button>

        {/* Save Project File */}
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

        {/* Snap to grid */}
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

        {/* AI Panel */}
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

        {/* Library */}
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

        {/* Reset */}
        <button className="icon-btn" onClick={loadDemo} title="Load Demo">
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 8a6 6 0 0 1 10-4.5L14 6"/>
            <path d="M14 2v4h-4"/>
          </svg>
        </button>

        {/* Clear */}
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
