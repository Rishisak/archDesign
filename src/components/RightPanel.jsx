import React, { useState } from 'react';
import { useDesignStore } from '../store/designStore';

const ROOM_COLORS = [
  '#e8f4f8','#fff4e8','#f0e8ff','#e8ffef','#fff8e8',
  '#ffe8e8','#f5f5f5','#e8f0ff','#ffeeff','#f0fff0',
];

const ROOM_TYPES = ['living','bedroom','kitchen','bathroom','dining','hallway','study','gym','cinema','other'];

const LIBRARY_ITEMS = [
  { icon: '🛋️', name: 'Sofa',        type: 'sofa',    w: 160, h: 70,  color: '#b4c4d4' },
  { icon: '🛏️', name: 'Queen Bed',   type: 'bed',     w: 150, h: 190, color: '#c4a0d4' },
  { icon: '🛏️', name: 'Twin Bed',    type: 'bed',     w: 110, h: 160, color: '#a0c4d4' },
  { icon: '🚿', name: 'Bathtub',     type: 'bath',    w: 70,  h: 130, color: '#a8d4f0' },
  { icon: '🪑', name: 'Chair',       type: 'chair',   w: 60,  h: 60,  color: '#d4c4a0' },
  { icon: '🍽️', name: 'Dining Table',type: 'table',   w: 120, h: 80,  color: '#d4b483' },
  { icon: '📺', name: 'TV Console',  type: 'tv',      w: 130, h: 25,  color: '#333'    },
  { icon: '🪞', name: 'Wardrobe',    type: 'wardrobe',w: 180, h: 50,  color: '#8b6c52' },
  { icon: '🖥️', name: 'Desk',        type: 'desk',    w: 120, h: 60,  color: '#a0b4c8' },
  { icon: '🌿', name: 'Plant',       type: 'plant',   w: 35,  h: 35,  color: '#5a9a5a' },
  { icon: '🛁', name: 'Shower',      type: 'shower',  w: 80,  h: 80,  color: '#c0ddf0' },
  { icon: '🍳', name: 'Kitchen Isle',type: 'island',  w: 120, h: 70,  color: '#d4cfc0' },
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
  const { rooms, selectedId, setSelectedId, updateRoom, deleteRoom, activeFloor } = useDesignStore();
  const vis = rooms.filter(r => r.floor === activeFloor);
  const sel = vis.find(r => r.id === selectedId);

  return (
    <div>
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

      {sel && (
        <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <div className="section-header">Edit Room</div>
          <div className="prop-group">
            <div className="prop-label">Name</div>
            <input className="prop-input" value={sel.name}
              onChange={e => updateRoom(sel.id, { name: e.target.value })} />
          </div>
          <div className="prop-group">
            <div className="prop-label">Type</div>
            <select className="prop-input" value={sel.type ?? 'room'}
              onChange={e => updateRoom(sel.id, { type: e.target.value })}>
              {ROOM_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div className="prop-group">
            <div className="prop-label">Fill Color</div>
            <div className="color-row">
              {ROOM_COLORS.map(c => (
                <div key={c} className={`color-swatch ${sel.color === c ? 'selected' : ''}`}
                  style={{ background: c }} onClick={() => updateRoom(sel.id, { color: c })} />
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div className="prop-group">
              <div className="prop-label">Width (cm)</div>
              <input className="prop-input" type="number" value={sel.width}
                onChange={e => updateRoom(sel.id, { width: +e.target.value })} />
            </div>
            <div className="prop-group">
              <div className="prop-label">Height (cm)</div>
              <input className="prop-input" type="number" value={sel.height}
                onChange={e => updateRoom(sel.id, { height: +e.target.value })} />
            </div>
          </div>
          <button className="btn btn-danger w-full" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
            onClick={() => deleteRoom(sel.id)}>🗑 Delete Room</button>
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

  const filtered = LIBRARY_ITEMS.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  const place = (item) => {
    const r = rooms.find(rm => rm.floor === activeFloor);
    addFurniture({
      roomId: r?.id ?? null,
      type: item.type,
      x: (r ? r.x + 20 : 100),
      y: (r ? r.y + 20 : 100),
      width: item.w,
      height: item.h,
      color: item.color,
      label: item.name,
    });
  };

  return (
    <div>
      <div className="section-header">3D Asset Library</div>
      <input
        className="prop-input" placeholder="🔍 Search furniture..."
        value={search} onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 10 }}
      />
      <div className="library-grid">
        {filtered.map((item, i) => (
          <div key={i} className="lib-item" onClick={() => place(item)} title={`Add ${item.name} to canvas`}>
            <div className="lib-item-icon">{item.icon}</div>
            <div className="lib-item-name">{item.name}</div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && (
        <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: 20 }}>
          No items found. Try a different search.
        </div>
      )}

      {/* Web search hint */}
      <div style={{ marginTop: 12, padding: 12, background: 'var(--accent-glow)', border: '1px solid rgba(79,142,247,0.3)', borderRadius: 'var(--radius-md)' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', marginBottom: 4 }}>🌐 Web Model Search</div>
        <input className="prop-input" placeholder="Search web for 3D models..." style={{ marginBottom: 8 }} />
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Search Models</button>
      </div>
    </div>
  );
}

function ThemePanel() {
  const { theme, setTheme } = useDesignStore();

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

      <div className="section-header" style={{ marginTop: 16 }}>Custom Colors</div>
      <div className="prop-group">
        <div className="prop-label">Wall Color</div>
        <div className="color-row">
          {['#e2e8f0','#f5f0e8','#2a2420','#f0ece8','#2a0a3a'].map(c => (
            <div key={c} className="color-swatch" style={{ background: c }}
              onClick={() => { /* apply wall color */ }} />
          ))}
        </div>
      </div>
      <div className="prop-group">
        <div className="prop-label">Floor Material</div>
        <select className="prop-input">
          <option>Hardwood Parquet</option>
          <option>Polished Concrete</option>
          <option>Marble Tiles</option>
          <option>Ceramic Tiles</option>
          <option>Carpet</option>
          <option>Terracotta</option>
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
