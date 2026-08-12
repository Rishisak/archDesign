import React, { useState } from 'react';
import { useDesignStore } from '../store/designStore';

const ROOM_COLORS = [
  '#e8f4f8','#fff4e8','#f0e8ff','#e8ffef','#fff8e8',
  '#ffe8e8','#f5f5f5','#e8f0ff','#ffeeff','#f0fff0',
];

const ROOM_TYPES = ['living','bedroom','kitchen','bathroom','dining','hallway','study','gym','cinema','other'];

export const LIBRARY_ITEMS = [
  // ── Doors & Openings ──
  { category: 'doors', icon: '🚪', name: 'Single Door',       type: 'door_single',    w: 80,  h: 20, color: '#c8923a' },
  { category: 'doors', icon: '🚪', name: 'Double Door',       type: 'door_double',    w: 140, h: 20, color: '#c8923a' },

  // ── Seating ──
  { category: 'seating', icon: '🛋️', name: '3-Seater Sofa',   type: 'sofa',           w: 180, h: 80, color: '#546e7a' },
  { category: 'seating', icon: '🛋️', name: 'Sectional L-Sofa',type: 'sofa_sectional', w: 200, h: 160,color: '#37474f' },
  { category: 'seating', icon: '🪑', name: 'Armchair',        type: 'armchair',       w: 80,  h: 80, color: '#78909c' },

  // ── Beds ──
  { category: 'beds', icon: '🛏️', name: 'Single Bed',        type: 'bed_single',     w: 100, h: 190, color: '#8e24aa' },
  { category: 'beds', icon: '🛏️', name: 'Double Bed',        type: 'bed_double',     w: 140, h: 190, color: '#ab47bc' },
  { category: 'beds', icon: '🛏️', name: 'Queen Bed',         type: 'bed_queen',      w: 160, h: 200, color: '#7b1fa2' },
  { category: 'beds', icon: '🛏️', name: 'King Bed',          type: 'bed_king',       w: 190, h: 200, color: '#673ab7' },
  { category: 'beds', icon: '🛏️', name: 'Bunk Bed',          type: 'bed_bunk',       w: 100, h: 190, color: '#512da8' },

  // ── Tables & Desks ──
  { category: 'tables', icon: '🍽️', name: 'Dining Table (4-Seat)', type: 'dining_4', w: 120, h: 80, color: '#8d6e63' },
  { category: 'tables', icon: '🍽️', name: 'Dining Table (6-Seat)', type: 'dining_6', w: 170, h: 90, color: '#6d4c41' },
  { category: 'tables', icon: '☕', name: 'Coffee Table',     type: 'table_coffee',   w: 100, h: 50, color: '#a1887f' },
  { category: 'tables', icon: '🖥️', name: 'Office Desk',      type: 'desk',           w: 130, h: 65, color: '#5d4037' },
  { category: 'tables', icon: '🛏️', name: 'Bedside Table',    type: 'nightstand',     w: 45,  h: 45, color: '#bcaaa4' },

  // ── Storage & Appliances ──
  { category: 'storage', icon: '🪞', name: 'Wardrobe',       type: 'wardrobe',       w: 160, h: 60, color: '#4e342e' },
  { category: 'storage', icon: '👟', name: 'Shoe Rack',      type: 'shoerack',       w: 90,  h: 35, color: '#3e2723' },
  { category: 'storage', icon: '📺', name: 'TV Unit & Console', type: 'tv_unit',     w: 150, h: 40, color: '#212121' },

  // ── Bath & Decor ──
  { category: 'decor', icon: '🛁', name: 'Bathtub',          type: 'bath',           w: 80,  h: 150, color: '#0288d1' },
  { category: 'decor', icon: '🚿', name: 'Shower Cabinet',   type: 'shower',         w: 90,  h: 90, color: '#03a9f4' },
  { category: 'decor', icon: '🌿', name: 'Plant',           type: 'plant',          w: 40,  h: 40, color: '#2e7d32' },
];

const THEMES = [
  { id: 'modern',        name: 'Modern Minimal',   colors: ['#e2e8f0','#f8f9fa','#cbd5e1'] },
  { id: 'japandi',       name: 'Japandi Wood',      colors: ['#d4b896','#f5f0e8','#a08060'] },
  { id: 'industrial',   name: 'Warm Industrial',   colors: ['#b4a090','#2a2420','#8a7060'] },
  { id: 'scandinavian', name: 'Scandinavian',       colors: ['#f0ece8','#ffffff','#d0c8c0'] },
  { id: 'cyberpunk',    name: 'Cyberpunk Neon',     colors: ['#2a0a3a','#0a1a2a','#bc8cff'] },
];

const AI_RESPONSES = [
  "Your Living Room is well-proportioned at 3.2m × 2.4m. I recommend adding a second window on the east wall for better cross-ventilation.",
  "Based on the current layout, the Kitchen-to-Dining distance is optimal. The traffic flow from the entrance to bedrooms follows a logical path.",
  "The Master Bedroom size (2.4m × 2.0m) is slightly below the recommended 3m × 4m. Consider expanding into the adjacent Hallway space.",
  "Great layout! The hallway provides clear circulation. I suggest adding a coat closet near the entrance — typical size: 1.0m × 0.6m.",
  "The Bathroom has no natural light source. A skylight or frosted window on the north wall would improve ventilation and reduce mold risk.",
  "For a modern open-plan feel, consider removing the wall between Kitchen and Living Room. This would increase natural light by approximately 40%.",
];

function AIPanel() {
  const { aiSuggestions, applySuggestion, dismissSuggestion, rooms } = useDesignStore();
  const [messages, setMessages] = useState([
    { role: 'ai', text: '👋 Hi! I\'m Archie, your AI design copilot. I\'ve analysed your current layout and have some suggestions ready. You can also ask me anything about your design!' }
  ]);
  const [input, setInput] = useState('');

  const send = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(m => [...m, { role: 'user', text: userMsg }]);
    const reply = AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)];
    setTimeout(() => setMessages(m => [...m, { role: 'ai', text: reply }]), 700);
  };

  const pending = aiSuggestions.filter(s => !s.applied);

  return (
    <div className="ai-chat">
      {/* Suggestions */}
      {pending.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div className="section-header">AI Suggestions ({pending.length})</div>
          {pending.map(s => (
            <div key={s.id} className={`ai-card ${s.severity}`}>
              <div className="ai-card-header">
                <div className="ai-severity-dot" />
                <span className="ai-title">{s.title}</span>
              </div>
              <div className="ai-body">{s.description}</div>
              <div className="ai-actions">
                {s.action && (
                  <button className="btn btn-success" onClick={() => applySuggestion(s.id)}>
                    ✓ Apply Fix
                  </button>
                )}
                <button className="btn btn-ghost" onClick={() => dismissSuggestion(s.id)}>
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
          <div key={i} className={`ai-msg ${m.role}`}>{m.text}</div>
        ))}
      </div>

      <div className="ai-input-row">
        <input
          className="ai-input"
          placeholder="Ask about your design..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
        />
        <button className="btn btn-primary" onClick={send}>→</button>
      </div>
    </div>
  );
}

function RoomsPanel() {
  const {
    rooms, doors, windows, furniture, selectedId, setSelectedId,
    updateRoom, deleteRoom, extendRoom, mergeRooms, updateFurniture, deleteFurniture,
    updateDoor, deleteDoor, updateWindow, deleteWindow,
    openDoors, toggleDoor, openWindows, toggleWindow, activeFloor
  } = useDesignStore();
  const vis = rooms.filter(r => r.floor === activeFloor);
  const selRoom = vis.find(r => r.id === selectedId);
  const selFurn = furniture.find(f => f.id === selectedId);
  const selDoor = doors.find(d => d.id === selectedId);
  const selWin  = windows.find(w => w.id === selectedId);

  return (
    <div>
      {/* Inspector for selected item */}
      {selDoor && (
        <div style={{ marginBottom: 12, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent)' }}>
          <div className="section-header">🚪 Selected Door</div>
          <div className="prop-group">
            <div className="prop-label">Status</div>
            <button className={`btn ${openDoors.has(selDoor.id) ? 'btn-success' : 'btn-primary'}`} style={{ width: '100%' }}
              onClick={() => toggleDoor(selDoor.id)}>
              {openDoors.has(selDoor.id) ? '▲ Open (Click to Close)' : '▼ Closed (Click to Open)'}
            </button>
          </div>
          <div className="prop-group">
            <div className="prop-label">Width (cm)</div>
            <input className="prop-input" type="number" value={selDoor.width}
              onChange={e => updateDoor(selDoor.id, { width: +e.target.value })} />
          </div>
          <button className="btn btn-danger w-full" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            onClick={() => deleteDoor(selDoor.id)}>🗑 Delete Door</button>
        </div>
      )}

      {selWin && (
        <div style={{ marginBottom: 12, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent)' }}>
          <div className="section-header">🪟 Selected Window</div>
          <div className="prop-group">
            <div className="prop-label">Status</div>
            <button className={`btn ${openWindows.has(selWin.id) ? 'btn-success' : 'btn-primary'}`} style={{ width: '100%' }}
              onClick={() => toggleWindow(selWin.id)}>
              {openWindows.has(selWin.id) ? '🔓 Unlocked & Open (Click to Lock)' : '🔒 Locked (Click to Unlock & Open)'}
            </button>
          </div>
          <div className="prop-group" style={{ marginTop: 8 }}>
            <div className="prop-label">Kinematic Mode</div>
            <select className="prop-input" value={windowModes[selWin.id] || 'sliding'}
              onChange={() => toggleWindowMode(selWin.id)}>
              <option value="sliding">↔ Sliding Track</option>
              <option value="casement">🚪 Casement Hinge (45° Tilt)</option>
            </select>
          </div>
          <div className="prop-group">
            <div className="prop-label">Width (cm)</div>
            <input className="prop-input" type="number" value={selWin.width}
              onChange={e => updateWindow(selWin.id, { width: +e.target.value })} />
          </div>
          <button className="btn btn-danger w-full" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            onClick={() => deleteWindow(selWin.id)}>🗑 Delete Window</button>
        </div>
      )}

      {selFurn && (
        <div style={{ marginBottom: 12, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent)' }}>
          <div className="section-header">🛋️ Selected Item: {selFurn.label}</div>
          <div className="prop-group">
            <div className="prop-label">Label / Name</div>
            <input className="prop-input" value={selFurn.label}
              onChange={e => updateFurniture(selFurn.id, { label: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div className="prop-group">
              <div className="prop-label">Width (cm)</div>
              <input className="prop-input" type="number" value={selFurn.width}
                onChange={e => updateFurniture(selFurn.id, { width: +e.target.value })} />
            </div>
            <div className="prop-group">
              <div className="prop-label">Depth/Height (cm)</div>
              <input className="prop-input" type="number" value={selFurn.height}
                onChange={e => updateFurniture(selFurn.id, { height: +e.target.value })} />
            </div>
          </div>
          <div className="prop-group">
            <div className="prop-label">Rotation (°)</div>
            <input className="prop-input" type="number" value={selFurn.rotation || 0} step="15"
              onChange={e => updateFurniture(selFurn.id, { rotation: +e.target.value })} />
          </div>
          <button className="btn btn-danger w-full" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            onClick={() => deleteFurniture(selFurn.id)}>🗑 Delete Item</button>
        </div>
      )}

      <div className="section-header">Rooms on This Floor ({vis.length})</div>
      {vis.map(r => (
        <div key={r.id} className={`room-card ${selectedId === r.id ? 'selected' : ''}`}
          onClick={() => setSelectedId(r.id)}>
          <div className="room-swatch" style={{ background: r.color }} />
          <div className="room-info">
            <div className="room-name">{r.name}</div>
            <div className="room-meta">
              {(r.width / 100).toFixed(1)}m × {(r.height / 100).toFixed(1)}m ·{' '}
              {((r.width / 100) * (r.height / 100)).toFixed(1)}m²
            </div>
          </div>
          <div className="room-actions">
            <button className="btn btn-danger" style={{ padding: '3px 7px' }} onClick={e => { e.stopPropagation(); deleteRoom(r.id); }}>✕</button>
          </div>
        </div>
      ))}

      {selRoom && (
        <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <div className="section-header">Edit Room</div>
          <div className="prop-group">
            <div className="prop-label">Name</div>
            <input className="prop-input" value={selRoom.name}
              onChange={e => updateRoom(selRoom.id, { name: e.target.value })} />
          </div>
          <div className="prop-group">
            <div className="prop-label">Type</div>
            <select className="prop-input" value={selRoom.type ?? 'room'}
              onChange={e => updateRoom(selRoom.id, { type: e.target.value })}>
              {ROOM_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div className="prop-group">
            <div className="prop-label">Fill Color</div>
            <div className="color-row">
              {ROOM_COLORS.map(c => (
                <div key={c} className={`color-swatch ${selRoom.color === c ? 'selected' : ''}`}
                  style={{ background: c }} onClick={() => updateRoom(selRoom.id, { color: c })} />
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div className="prop-group">
              <div className="prop-label">Width (cm)</div>
              <input className="prop-input" type="number" value={selRoom.width}
                onChange={e => updateRoom(selRoom.id, { width: +e.target.value })} />
            </div>
            <div className="prop-group">
              <div className="prop-label">Height (cm)</div>
              <input className="prop-input" type="number" value={selRoom.height}
                onChange={e => updateRoom(selRoom.id, { height: +e.target.value })} />
            </div>
          </div>

          {/* Quick Extend Room Buttons */}
          <div className="prop-group" style={{ marginTop: 8 }}>
            <div className="prop-label">📐 Extend Room Dimension</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              <button className="btn btn-secondary" style={{ fontSize: 11, padding: '4px' }} onClick={() => extendRoom(selRoom.id, 'top', 50)}>↑ Top +50cm</button>
              <button className="btn btn-secondary" style={{ fontSize: 11, padding: '4px' }} onClick={() => extendRoom(selRoom.id, 'bottom', 50)}>↓ Bottom +50cm</button>
              <button className="btn btn-secondary" style={{ fontSize: 11, padding: '4px' }} onClick={() => extendRoom(selRoom.id, 'left', 50)}>← Left +50cm</button>
              <button className="btn btn-secondary" style={{ fontSize: 11, padding: '4px' }} onClick={() => extendRoom(selRoom.id, 'right', 50)}>→ Right +50cm</button>
            </div>
          </div>

          {/* Join / Merge Rooms */}
          {vis.filter(r => r.id !== selRoom.id).length > 0 && (
            <div className="prop-group" style={{ marginTop: 8 }}>
              <div className="prop-label">🔗 Join / Merge Room</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <select id="merge-room-target" className="prop-input" style={{ fontSize: 11 }}>
                  {vis.filter(r => r.id !== selRoom.id).map(other => (
                    <option key={other.id} value={other.id}>{other.name}</option>
                  ))}
                </select>
                <button
                  className="btn btn-primary"
                  style={{ fontSize: 11, padding: '4px 8px', whiteSpace: 'nowrap' }}
                  onClick={() => {
                    const targetEl = document.getElementById('merge-room-target');
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

          <button className="btn btn-danger w-full" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            onClick={() => deleteRoom(selRoom.id)}>🗑 Delete Room</button>
        </div>
      )}

      <div style={{ marginTop: 12, padding: 10, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)' }}>
        <strong style={{ color: 'var(--text-secondary)' }}>Total area:</strong>{' '}
        {vis.reduce((a, r) => a + (r.width / 100) * (r.height / 100), 0).toFixed(1)} m²
        {' · '}
        <strong style={{ color: 'var(--text-secondary)' }}>{vis.length}</strong> rooms
      </div>
    </div>
  );
}

function LibraryPanel() {
  const { addFurniture, activeFloor, rooms } = useDesignStore();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');

  const filtered = LIBRARY_ITEMS.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    const matchCat    = catFilter === 'all' || i.category === catFilter;
    return matchSearch && matchCat;
  });

  const place = (item) => {
    const r = rooms.find(rm => rm.floor === activeFloor);
    addFurniture({
      roomId: r?.id ?? null,
      type: item.type,
      x: (r ? r.x + 30 : 100),
      y: (r ? r.y + 30 : 100),
      width: item.w,
      height: item.h,
      color: item.color,
      label: item.name,
      rotation: 0,
    });
  };

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'doors', label: 'Doors' },
    { id: 'seating', label: 'Seating' },
    { id: 'beds', label: 'Beds' },
    { id: 'tables', label: 'Tables' },
    { id: 'storage', label: 'Storage' },
    { id: 'decor', label: 'Bath/Decor' },
  ];

  return (
    <div>
      <div className="section-header">IKEA Furniture & Asset Library</div>
      <input
        className="prop-input" placeholder="🔍 Search furniture..."
        value={search} onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 8 }}
      />

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setCatFilter(c.id)}
            style={{
              padding: '3px 8px', fontSize: 11, borderRadius: 99, border: '1px solid var(--border)',
              background: catFilter === c.id ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: catFilter === c.id ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer', fontWeight: catFilter === c.id ? 600 : 400,
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
            onDragStart={(e) => e.dataTransfer.setData('application/json', JSON.stringify(item))}
            title={`Click or Drag to place ${item.name}`}
          >
            <div className="lib-item-icon">{item.icon}</div>
            <div className="lib-item-name">{item.name}</div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && (
        <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: 20 }}>
          No furniture found matching your search.
        </div>
      )}
    </div>
  );
}

function ThemePanel() {
  const { theme, setTheme, pbrMaterialTheme, setPBRMaterialTheme } = useDesignStore();

  return (
    <div>
      <div className="section-header">Design Theme</div>
      {THEMES.map(t => (
        <div key={t.id} className={`theme-card ${theme === t.id ? 'active' : ''}`} onClick={() => setTheme(t.id)}>
          <div className="theme-swatch">
            {t.colors.map((c, i) => <div key={i} className="theme-dot" style={{ background: c }} />)}
          </div>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{t.name}</span>
          {theme === t.id && <span style={{ marginLeft: 'auto', color: 'var(--green)', fontSize: 12 }}>✓</span>}
        </div>
      ))}

      <div className="section-header" style={{ marginTop: 16 }}>PBR Material Engine</div>
      <div className="prop-group">
        <div className="prop-label">Floor PBR Texture</div>
        <select
          className="prop-input"
          value={pbrMaterialTheme.floorTexture}
          onChange={e => setPBRMaterialTheme({ floorTexture: e.target.value })}
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
          onChange={e => setPBRMaterialTheme({ wallTexture: e.target.value })}
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

const TABS = ['Rooms','AI Copilot','Library','Theme'];

export default function RightPanel() {
  const { viewMode } = useDesignStore();
  const [tab, setTab] = useState(1);

  return (
    <aside style={{
      width: 'var(--panel-width)',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-secondary)',
      borderLeft: '1px solid var(--border)',
      overflow: 'hidden',
    }}>
      <div className="panel-tabs">
        {TABS.map((t, i) => (
          <button key={t} className={`panel-tab ${tab === i ? 'active' : ''}`} onClick={() => setTab(i)}>
            {t}
          </button>
        ))}
      </div>
      <div className="panel-body">
        {tab === 0 && <RoomsPanel />}
        {tab === 1 && <AIPanel />}
        {tab === 2 && <LibraryPanel />}
        {tab === 3 && <ThemePanel />}
      </div>
    </aside>
  );
}
