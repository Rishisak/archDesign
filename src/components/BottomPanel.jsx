import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useDesignStore } from '../store/designStore';

const MIN_HEIGHT = 40;   // collapsed – just the title bar
const MAX_HEIGHT = 500;
const DEFAULT_HEIGHT = 340;

export default function BottomPanel() {
  const {
    floors,
    activeFloor,
    setActiveFloor,
    addFloor,
    deleteFloor,
    renameFloor,
  } = useDesignStore();

  const [panelHeight, setPanelHeight] = useState(DEFAULT_HEIGHT);
  const [collapsed, setCollapsed] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  // ── Drag-resize logic ────────────────────────────────────────────────────
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartH = useRef(0);

  const onDragStart = useCallback((e) => {
    isDragging.current = true;
    dragStartY.current = e.clientY;
    dragStartH.current = collapsed ? MIN_HEIGHT : panelHeight;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  }, [collapsed, panelHeight]);

  useEffect(() => {
    const onMove = (e) => {
      if (!isDragging.current) return;
      const delta = dragStartY.current - e.clientY; // dragging UP = increase height
      const next = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, dragStartH.current + delta));
      if (next <= MIN_HEIGHT + 4) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
        setPanelHeight(next);
      }
    };
    const onUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);
  // ────────────────────────────────────────────────────────────────────────


  const handleRenameStart = (floor) => {
    setRenamingId(floor.id);
    setRenameValue(floor.name);
  };

  const handleRenameCommit = () => {
    if (renamingId !== null && renameValue.trim()) {
      renameFloor(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };

  return (
    <div
      className="bottom-panel-wrapper"
      style={{ height: collapsed ? MIN_HEIGHT : panelHeight }}
    >
      {/* ── Drag resize grip ───────────────────────────────────── */}
      <div
        className="bottom-drag-grip"
        onMouseDown={onDragStart}
        title="Drag to resize panel"
      >
        <div className="bottom-drag-dots" />
      </div>

      {/* Toggle / Hide bar */}
      <div className="bottom-panel-toggle-bar" onClick={() => setCollapsed((c) => !c)}>
        <span className="bottom-panel-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6, verticalAlign: 'middle' }}>
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
          Floor Manager
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="bottom-panel-floor-count">{floors.length} floor{floors.length !== 1 ? 's' : ''}</span>
          <button className="bottom-panel-hide-btn" title={collapsed ? 'Show panel' : 'Hide panel'}>
            {collapsed ? '\u25b2' : '\u25bc'}
          </button>
        </div>
      </div>

      {/* Collapsible body */}
      {!collapsed && (
        <div className="bottom-panel-body">
          {/* Floors list section */}
          <div className="bottom-floors-section">
            <div className="bottom-section-label">Floors</div>
            <div className="bottom-floors-list">
              {[...floors].sort((a, b) => a.id - b.id).map((floor) => (
                <div
                  key={floor.id}
                  className={`bottom-floor-item${activeFloor === floor.id ? ' active' : ''}`}
                  onClick={() => setActiveFloor(floor.id)}
                >
                  {renamingId === floor.id ? (
                    <input
                      className="bottom-floor-rename-input"
                      value={renameValue}
                      autoFocus
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={handleRenameCommit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameCommit();
                        if (e.key === 'Escape') setRenamingId(null);
                        e.stopPropagation();
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="bottom-floor-name">{floor.name}</span>
                  )}

                  <div className="bottom-floor-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="bottom-floor-action-btn" title="Toggle visibility">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </button>
                    <button
                      className="bottom-floor-action-btn"
                      title="Rename"
                      onClick={() => handleRenameStart(floor)}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    {floors.length > 1 && (
                      <button
                        className="bottom-floor-action-btn delete"
                        title="Delete floor"
                        onClick={() => deleteFloor(floor.id)}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <button className="bottom-add-floor-btn" onClick={addFloor}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Floor
              </button>
            </div>
          </div>

          {/* Add Floor Plan drop-zone */}
          <div className="bottom-add-plan-section">
            <div className="bottom-section-label">Add Floor Plan</div>
            <div className="bottom-add-plan-zone" onClick={addFloor}>
              <div className="bottom-add-plan-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 2"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              </div>
              <span className="bottom-add-plan-text">Select a floor or add a new floor</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
