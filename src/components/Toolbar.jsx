import React from 'react';
import { useDesignStore } from '../store/designStore';

const TOOLS = [
  { id: 'select',    label: 'Select',   icon: <PointerIcon /> },
  { id: 'room',      label: 'Room',     icon: <RoomIcon /> },
  { id: 'door',      label: 'Door',     icon: <DoorIcon /> },
  { id: 'window',    label: 'Window',   icon: <WindowIcon /> },
  { id: 'furniture', label: 'Furnish',  icon: <FurnitureIcon /> },
];

function PointerIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 2L4 13l3-3 2 4 2-1-2-4h4z"/>
    </svg>
  );
}
function RoomIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="12" height="12" rx="1"/>
      <path d="M3 9h12M9 3v12" strokeDasharray="2 2"/>
    </svg>
  );
}
function DoorIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="2" width="8" height="14" rx="1"/>
      <circle cx="11" cy="9" r="1" fill="currentColor"/>
      <path d="M4 9 Q9 5 12 9" strokeDasharray="2 1"/>
    </svg>
  );
}
function WindowIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="6" width="14" height="6" rx="1"/>
      <path d="M9 6v6M2 9h14"/>
    </svg>
  );
}
function FurnitureIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="10" width="12" height="5" rx="1"/>
      <rect x="5" y="6" width="8" height="4" rx="1"/>
      <path d="M6 10V15M12 10v5"/>
    </svg>
  );
}

export default function Toolbar() {
  const { activeTool, setActiveTool, viewMode } = useDesignStore();

  if (viewMode !== '2d') return null;

  return (
    <div style={{
      width: 'var(--toolbar-width)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
      padding: '12px 8px',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      flexShrink: 0,
    }}>
      {TOOLS.map((tool, i) => (
        <React.Fragment key={tool.id}>
          {i === 2 && <div className="toolbar-separator" />}
          <button
            className={`tool-btn ${activeTool === tool.id ? 'active' : ''}`}
            onClick={() => setActiveTool(tool.id)}
            title={tool.label}
          >
            {tool.icon}
            <span>{tool.label}</span>
          </button>
        </React.Fragment>
      ))}

      <div className="toolbar-separator" style={{ marginTop: 'auto' }} />

      {/* Measure tool */}
      <button className="tool-btn" title="Measure" style={{ marginTop: 'auto' }}>
        <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 14L14 2"/>
          <path d="M2 14l2-2M14 2l-2 2M8 8l-2 2"/>
        </svg>
        <span>Measure</span>
      </button>
    </div>
  );
}
