import React, { useState } from 'react';
import { useDesignStore } from '../store/designStore';
import { LIBRARY_ITEMS } from './RightPanel';

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
  const { activeTool, setActiveTool, viewMode, addFurniture, setSelectedId, setShowLibrary } = useDesignStore();
  const [showFurnishMenu, setShowFurnishMenu] = useState(false);
  const [catFilter, setCatFilter]             = useState('all');
  const [search, setSearch]                   = useState('');

  if (viewMode !== '2d') return null;

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'seating', label: 'Seating' },
    { id: 'beds', label: 'Beds' },
    { id: 'tables', label: 'Tables' },
    { id: 'storage', label: 'Storage' },
    { id: 'doors', label: 'Doors' },
    { id: 'decor', label: 'Decor' },
  ];

  const filteredItems = LIBRARY_ITEMS.filter(item => {
    const matchCat  = catFilter === 'all' || item.category === catFilter;
    const matchText = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchText;
  });

  const handleToolClick = (toolId) => {
    if (toolId === 'furniture') {
      setActiveTool('furniture');
      setShowFurnishMenu(prev => !prev);
    } else {
      setActiveTool(toolId);
      setShowFurnishMenu(false);
    }
  };

  const handlePlaceItem = (item) => {
    addFurniture({
      roomId: null,
      type: item.type,
      x: 220,
      y: 220,
      width: item.w,
      height: item.h,
      color: item.color,
      label: item.name,
      rotation: 0,
    });
    setActiveTool('select');
    setShowFurnishMenu(false);
  };

  return (
    <div style={{ position: 'relative', zIndex: 90 }}>
      <div style={{
        width: 'var(--toolbar-width)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        padding: '12px 8px',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        height: '100%',
        flexShrink: 0,
      }}>
        {TOOLS.map((tool, i) => (
          <React.Fragment key={tool.id}>
            {i === 2 && <div className="toolbar-separator" />}
            <button
              className={`tool-btn ${activeTool === tool.id ? 'active' : ''}`}
              onClick={() => handleToolClick(tool.id)}
              title={tool.label}
            >
              {tool.icon}
              <span>{tool.label}</span>
            </button>
          </React.Fragment>
        ))}

        <div className="toolbar-separator" style={{ marginTop: 'auto' }} />

        {/* Measure tool */}
        <button className="tool-btn" title="Measure">
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 14L14 2"/>
            <path d="M2 14l2-2M14 2l-2 2M8 8l-2 2"/>
          </svg>
          <span>Measure</span>
        </button>
      </div>

      {/* ── Furnish Catalog Popover Menu ── */}
      {showFurnishMenu && (
        <div style={{
          position: 'absolute',
          top: 140,
          left: 'calc(var(--toolbar-width) + 8px)',
          width: 290,
          maxHeight: 460,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--accent)',
          boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
          borderRadius: 'var(--radius-md)',
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          zIndex: 100,
          overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              🛋️ Furnish Catalog Menu
            </span>
            <button
              onClick={() => setShowFurnishMenu(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }}
            >
              ✕
            </button>
          </div>

          <input
            className="prop-input"
            placeholder="🔍 Search furniture..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ fontSize: 12 }}
          />

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setCatFilter(c.id)}
                style={{
                  padding: '2px 7px',
                  fontSize: 10,
                  borderRadius: 99,
                  border: '1px solid var(--border)',
                  background: catFilter === c.id ? 'var(--accent)' : 'var(--bg-tertiary)',
                  color: catFilter === c.id ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Items Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 6,
            overflowY: 'auto',
            maxHeight: 300,
            paddingRight: 2,
          }}>
            {filteredItems.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handlePlaceItem(item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 8px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontSize: 11,
                  color: 'var(--text-primary)',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                title={`Click to place ${item.name}`}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.name}
                </span>
              </div>
            ))}
          </div>

          {/* Direct link to sidebar library */}
          <button
            className="btn btn-secondary w-full"
            style={{ width: '100%', justifyContent: 'center', fontSize: 11, marginTop: 4 }}
            onClick={() => {
              setShowFurnishMenu(false);
              setShowLibrary(true);
            }}
          >
            📚 Open Asset Library Sidebar
          </button>
        </div>
      )}
    </div>
  );
}
