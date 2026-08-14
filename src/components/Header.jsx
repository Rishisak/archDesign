import React from 'react';
import { useDesignStore } from '../store/designStore';

const VIEWS = [
  { id: '2d',          label: '2D Plan',    icon: '⊞' },
  { id: '3d',          label: '3D View',    icon: '◈' },
  { id: 'walkthrough', label: 'Walkthrough', icon: '▶' },
];

export default function Header() {
  const {
    viewMode, setViewMode,
    showAIPanel, setShowAIPanel,
    showLibrary, setShowLibrary,
    snapToGrid, setSnapToGrid,
    clearDesign, loadDemo,
    exportProjectJSON
  } = useDesignStore();

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

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Actions */}
      <div className="header-actions">
        {/* Save File */}
        <button
          className="btn btn-primary"
          onClick={exportProjectJSON}
          title="Save Design File (.json)"
          style={{ gap: 6, fontSize: 12, padding: '5px 12px' }}
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

        {/* Reset / Demo */}
        <button className="icon-btn" onClick={loadDemo} title="Load Demo Project">
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
