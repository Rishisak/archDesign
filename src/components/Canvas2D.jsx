import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useDesignStore } from '../store/designStore';

const WALL_THICKNESS = 10;

function getOpeningTransform(room, side, position, width) {
  const hw = width / 2;
  switch (side) {
    case 'top':    return { x: room.x + room.width * position - hw,      y: room.y - WALL_THICKNESS / 2,              w: width,          h: WALL_THICKNESS };
    case 'bottom': return { x: room.x + room.width * position - hw,      y: room.y + room.height - WALL_THICKNESS / 2, w: width,          h: WALL_THICKNESS };
    case 'left':   return { x: room.x - WALL_THICKNESS / 2,              y: room.y + room.height * position - hw,      w: WALL_THICKNESS, h: width };
    case 'right':  return { x: room.x + room.width - WALL_THICKNESS / 2, y: room.y + room.height * position - hw,      w: WALL_THICKNESS, h: width };
    default:       return { x: 0, y: 0, w: 0, h: 0 };
  }
}

export default function Canvas2D() {
  const divRef = useRef(null);

  // Use ref-based pan/zoom to avoid stale closures on hot-path events
  const panRef    = useRef({ x: 0, y: 0 });
  const zoomRef   = useRef(1);
  const isPanRef  = useRef(false);
  const panStart  = useRef({ x: 0, y: 0 });

  // Sync from store → refs (for initial load)
  const [renderTick, setRenderTick] = useState(0);
  const rerender = useCallback(() => setRenderTick(t => t + 1), []);

  // Trigger rerender every time pan/zoom refs change
  const [localZoom, setLocalZoom] = useState(1);
  const [localPan,  setLocalPan]  = useState({ x: 0, y: 0 });
  const [mousePos,  setMousePos]  = useState({ x: 0, y: 0 });
  const [centered,  setCentered]  = useState(false);

  const {
    rooms, doors, windows, furniture, activeFloor,
    activeTool, selectedId, setSelectedId,
    isDrawingRoom, drawStart, drawCurrent,
    startDrawing, updateDrawing, finishDrawing, cancelDrawing,
    deleteRoom, deleteFurniture, snap, addDoor, addWindow, addFurniture,
    openDoors, toggleDoor,
  } = useDesignStore();

  // ── Auto-fit rooms into view on first load ──────────────────
  useEffect(() => {
    const div = divRef.current;
    if (!div || centered) return;
    const vis = rooms.filter(r => r.floor === activeFloor);
    if (vis.length === 0) return;

    // Wait for layout to be painted
    requestAnimationFrame(() => {
      const rect = div.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const minX = Math.min(...vis.map(r => r.x));
      const maxX = Math.max(...vis.map(r => r.x + r.width));
      const minY = Math.min(...vis.map(r => r.y));
      const maxY = Math.max(...vis.map(r => r.y + r.height));
      const dw = maxX - minX;
      const dh = maxY - minY;
      const sc = Math.min(2.5, Math.max(0.2, Math.min(rect.width * 0.75 / dw, rect.height * 0.75 / dh)));
      const px = rect.width  / 2 - (minX + dw / 2) * sc;
      const py = rect.height / 2 - (minY + dh / 2) * sc;
      panRef.current  = { x: px, y: py };
      zoomRef.current = sc;
      setLocalPan({ x: px, y: py });
      setLocalZoom(sc);
      setCentered(true);
    });
  }, [rooms, activeFloor, centered]);

  // Reset centering when floor or rooms list change meaningfully
  useEffect(() => { setCentered(false); }, [activeFloor]);

  // ── Coordinate transform ──────────────────────────────────
  const toWorld = useCallback((clientX, clientY) => {
    const rect = divRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - panRef.current.x) / zoomRef.current,
      y: (clientY - rect.top  - panRef.current.y) / zoomRef.current,
    };
  }, []);

  // ── Event handlers ─────────────────────────────────────────
  const onMouseDown = useCallback((e) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      isPanRef.current = true;
      panStart.current = { x: e.clientX - panRef.current.x, y: e.clientY - panRef.current.y };
      e.preventDefault();
      return;
    }
    if (e.button !== 0) return;
    const w = toWorld(e.clientX, e.clientY);
    const visRooms = rooms.filter(r => r.floor === activeFloor);
    const z = zoomRef.current;

    if (activeTool === 'room') { startDrawing({ x: snap(w.x), y: snap(w.y) }); return; }

    if (activeTool === 'furniture') {
      const at = visRooms.find(r => w.x >= r.x && w.x <= r.x + r.width && w.y >= r.y && w.y <= r.y + r.height);
      addFurniture({ roomId: at?.id ?? null, type: 'chair', x: snap(w.x)-30, y: snap(w.y)-30, width: 60, height: 60, color: '#b4c4d4', label: 'Chair' });
      return;
    }

    if (activeTool === 'door' || activeTool === 'window') {
      const thr = 20 / z;
      const room = visRooms.find(r => w.x >= r.x - thr && w.x <= r.x + r.width + thr && w.y >= r.y - thr && w.y <= r.y + r.height + thr);
      if (room) {
        const dists = { top: Math.abs(w.y - room.y), bottom: Math.abs(w.y - room.y - room.height), left: Math.abs(w.x - room.x), right: Math.abs(w.x - room.x - room.width) };
        const wall = Object.entries(dists).reduce((a, b) => a[1] < b[1] ? a : b)[0];
        const isH  = wall === 'top' || wall === 'bottom';
        const pos  = Math.max(0.1, Math.min(0.9, isH ? (w.x - room.x) / room.width : (w.y - room.y) / room.height));
        if (activeTool === 'door') addDoor({ roomId: room.id, wall, position: pos, width: 80 });
        else addWindow({ roomId: room.id, wall, position: pos, width: 70 });
      }
    }
  }, [activeTool, rooms, activeFloor, snap, startDrawing, addFurniture, addDoor, addWindow, toWorld]);

  const onMouseMove = useCallback((e) => {
    if (isPanRef.current) {
      const nx = e.clientX - panStart.current.x;
      const ny = e.clientY - panStart.current.y;
      panRef.current = { x: nx, y: ny };
      setLocalPan({ x: nx, y: ny });
      return;
    }
    const w = toWorld(e.clientX, e.clientY);
    setMousePos(w);
    if (isDrawingRoom) updateDrawing({ x: snap(w.x), y: snap(w.y) });
  }, [isDrawingRoom, toWorld, snap, updateDrawing]);

  const onMouseUp = useCallback(() => {
    if (isPanRef.current) { isPanRef.current = false; return; }
    if (isDrawingRoom) finishDrawing();
  }, [isDrawingRoom, finishDrawing]);

  // Wheel zoom attached non-passively
  useEffect(() => {
    const el = divRef.current;
    if (!el) return;
    const handler = (e) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const f = e.deltaY < 0 ? 1.12 : 0.9;
      const z = zoomRef.current;
      const px = panRef.current.x, py = panRef.current.y;
      const nz = Math.min(5, Math.max(0.08, z * f));
      const sc = nz / z;
      const nx = cx - sc * (cx - px);
      const ny = cy - sc * (cy - py);
      zoomRef.current = nz;
      panRef.current  = { x: nx, y: ny };
      setLocalZoom(nz);
      setLocalPan({ x: nx, y: ny });
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  // Keyboard
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape') cancelDrawing();
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) { deleteRoom(selectedId); deleteFurniture(selectedId); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [cancelDrawing, selectedId, deleteRoom, deleteFurniture]);

  const z   = localZoom;
  const pan = localPan;
  const visRooms     = rooms.filter(r => r.floor === activeFloor);
  const visibleFurn  = furniture.filter(f => f.floor === activeFloor);

  let preview = null;
  if (isDrawingRoom && drawStart && drawCurrent) {
    preview = {
      x: Math.min(drawStart.x, drawCurrent.x),
      y: Math.min(drawStart.y, drawCurrent.y),
      width:  Math.abs(drawCurrent.x - drawStart.x),
      height: Math.abs(drawCurrent.y - drawStart.y),
    };
  }

  const cursor = activeTool === 'room' ? 'crosshair' : isPanRef.current ? 'grabbing' : 'default';

  return (
    <div
      ref={divRef}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', cursor, userSelect: 'none' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {/* Grid background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px),
          linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: `${100*z}px ${100*z}px, ${100*z}px ${100*z}px, ${20*z}px ${20*z}px, ${20*z}px ${20*z}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px, ${pan.x}px ${pan.y}px, ${pan.x}px ${pan.y}px, ${pan.x}px ${pan.y}px`,
        pointerEvents: 'none',
      }} />

      {/* SVG */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} overflow="visible">
        <defs>
          <filter id="room-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="rgba(0,0,0,0.4)" />
          </filter>
        </defs>

        <g transform={`translate(${pan.x},${pan.y}) scale(${z})`}>

          {/* Rooms */}
          {visRooms.map(room => {
            const sel = selectedId === room.id;
            return (
              <g key={room.id} onClick={e => { e.stopPropagation(); if (activeTool === 'select') setSelectedId(room.id); }}
                style={{ cursor: activeTool === 'select' ? 'pointer' : 'default' }}>

                {/* Selection glow */}
                {sel && <rect x={room.x-4/z} y={room.y-4/z} width={room.width+8/z} height={room.height+8/z}
                  fill="none" stroke="rgba(79,142,247,0.4)" strokeWidth={6/z} rx={4} pointerEvents="none" />}

                {/* Room fill + wall stroke */}
                <rect x={room.x} y={room.y} width={room.width} height={room.height}
                  fill={room.color} stroke={sel ? '#4f8ef7' : '#9aaabb'}
                  strokeWidth={sel ? 3/z : WALL_THICKNESS/z} rx={2} filter="url(#room-shadow)" />

                {/* Labels */}
                <text x={room.x+room.width/2} y={room.y+room.height/2-8}
                  textAnchor="middle" fill="rgba(20,30,50,0.75)"
                  fontSize={Math.max(8, 14/z)} fontWeight="600" fontFamily="Inter,sans-serif" pointerEvents="none">
                  {room.name}
                </text>
                <text x={room.x+room.width/2} y={room.y+room.height/2+10}
                  textAnchor="middle" fill="rgba(20,30,50,0.45)"
                  fontSize={Math.max(6, 10/z)} fontFamily="Inter,sans-serif" pointerEvents="none">
                  {((room.width/100)*(room.height/100)).toFixed(1)} m²
                </text>

                {/* Dimension lines */}
                {sel && <>
                  <line x1={room.x} y1={room.y-20/z} x2={room.x+room.width} y2={room.y-20/z}
                    stroke="#4f8ef7" strokeWidth={0.8/z} strokeDasharray={`${3/z} ${2/z}`} />
                  <text x={room.x+room.width/2} y={room.y-24/z} textAnchor="middle"
                    fill="#4f8ef7" fontSize={Math.max(6,9/z)} fontFamily="Inter" pointerEvents="none">
                    {(room.width/100).toFixed(1)} m
                  </text>
                  <line x1={room.x-20/z} y1={room.y} x2={room.x-20/z} y2={room.y+room.height}
                    stroke="#4f8ef7" strokeWidth={0.8/z} strokeDasharray={`${3/z} ${2/z}`} />
                  <text x={room.x-26/z} y={room.y+room.height/2} textAnchor="middle"
                    fill="#4f8ef7" fontSize={Math.max(6,9/z)} fontFamily="Inter" pointerEvents="none"
                    transform={`rotate(-90,${room.x-26/z},${room.y+room.height/2})`}>
                    {(room.height/100).toFixed(1)} m
                  </text>
                </>}
              </g>
            );
          })}

          {/* Doors — clickable to open/close with animated swing */}
          {doors.map(door => {
            const room = rooms.find(r => r.id === door.roomId);
            if (!room || room.floor !== activeFloor) return null;
            const t      = getOpeningTransform(room, door.wall, door.position, door.width);
            const isH    = door.wall === 'top' || door.wall === 'bottom';
            const isOpen = openDoors.has(door.id);
            const arc    = door.width * 0.85;

            // Pivot point of the door leaf (hinge corner)
            let pivotX, pivotY, leafW, leafH;
            if (isH) {
              pivotX = t.x; pivotY = t.y + WALL_THICKNESS / 2;
              leafW = door.width; leafH = WALL_THICKNESS;
            } else {
              pivotX = t.x + WALL_THICKNESS / 2; pivotY = t.y;
              leafW = WALL_THICKNESS; leafH = door.width;
            }

            // Open rotation: 90° swing for horizontal walls, -90° for vertical
            const openAngle = isH ? -90 : 90;
            const angle     = isOpen ? openAngle : 0;

            return (
              <g key={door.id}
                style={{ cursor: activeTool === 'select' ? 'pointer' : 'default' }}
                onClick={e => { e.stopPropagation(); if (activeTool === 'select') toggleDoor(door.id); }}
              >
                {/* Wall gap (always clear) */}
                <rect x={t.x} y={t.y} width={t.w} height={t.h} fill={room.color} />

                {/* Door frame (static) */}
                <rect x={t.x} y={t.y} width={t.w} height={t.h}
                  fill="none" stroke="#7a5030" strokeWidth={1.5/z} />

                {/* Door leaf — rotates around hinge with CSS transition */}
                <g style={{
                  transformOrigin: `${pivotX}px ${pivotY}px`,
                  transform: `rotate(${angle}deg)`,
                  transition: 'transform 0.45s cubic-bezier(0.4,0,0.2,1)',
                  transformBox: 'fill-box',
                }}>
                  <rect
                    x={t.x} y={t.y}
                    width={isH ? door.width : WALL_THICKNESS}
                    height={isH ? WALL_THICKNESS : door.width}
                    fill={isOpen ? '#e8b878' : '#c8923a'}
                    fillOpacity="0.88"
                    stroke="#a06828"
                    strokeWidth={0.6/z}
                    rx={1/z}
                  />
                  {/* Door knob */}
                  <circle
                    cx={isH ? t.x + door.width * 0.78 : t.x + WALL_THICKNESS / 2}
                    cy={isH ? t.y + WALL_THICKNESS / 2 : t.y + door.width * 0.78}
                    r={3/z}
                    fill="#c8a840" stroke="#a08020" strokeWidth={0.4/z}
                  />
                </g>

                {/* Swing arc (shown when closed) */}
                {!isOpen && (
                  <path
                    d={isH
                      ? `M${t.x} ${t.y+WALL_THICKNESS/2} A${arc} ${arc} 0 0 1 ${t.x} ${t.y+WALL_THICKNESS/2-arc}`
                      : `M${t.x+WALL_THICKNESS/2} ${t.y} A${arc} ${arc} 0 0 0 ${t.x+WALL_THICKNESS/2+arc} ${t.y}`
                    }
                    fill="rgba(200,146,58,0.08)"
                    stroke="#a06828" strokeWidth={0.5/z}
                    strokeDasharray={`${2.5/z} ${2/z}`}
                    pointerEvents="none"
                  />
                )}

                {/* Open/close indicator on hover */}
                <text
                  x={isH ? t.x + door.width/2 : t.x + WALL_THICKNESS/2}
                  y={isH ? t.y - 6/z : t.y - 6/z}
                  textAnchor="middle"
                  fill={isOpen ? '#4fa86f' : '#c8923a'}
                  fontSize={Math.max(4, 7/z)}
                  fontFamily="Inter" fontWeight="700"
                  pointerEvents="none"
                >
                  {isOpen ? '▲ OPEN' : '▼ CLOSED'}
                </text>
              </g>
            );
          })}

          {/* Windows */}
          {windows.map((win, idx) => {
            const room = rooms.find(r => r.id === win.roomId);
            if (!room || room.floor !== activeFloor) return null;
            const t   = getOpeningTransform(room, win.wall, win.position, win.width);
            const isH = win.wall === 'top' || win.wall === 'bottom';
            return (
              <g key={`w-${idx}-${win.id}`} pointerEvents="none">
                <rect x={t.x} y={t.y} width={t.w} height={t.h} fill={room.color} />
                <rect x={t.x} y={t.y} width={t.w} height={t.h}
                  fill="#a8d8f0" fillOpacity="0.6" stroke="#5ab0e0" strokeWidth={1.2/z} />
                {isH
                  ? <line x1={t.x+win.width/2} y1={t.y} x2={t.x+win.width/2} y2={t.y+WALL_THICKNESS} stroke="#5ab0e0" strokeWidth={0.7/z} />
                  : <line x1={t.x} y1={t.y+win.width/2} x2={t.x+WALL_THICKNESS} y2={t.y+win.width/2} stroke="#5ab0e0" strokeWidth={0.7/z} />
                }
              </g>
            );
          })}

          {/* Furniture */}
          {visibleFurn.map(f => {
            const sel = selectedId === f.id;
            return (
              <g key={f.id} onClick={e => { e.stopPropagation(); if (activeTool==='select') setSelectedId(f.id); }}
                style={{ cursor: activeTool === 'select' ? 'pointer' : 'default' }}>
                <rect x={f.x} y={f.y} width={f.width} height={f.height}
                  fill={f.color} fillOpacity="0.85" rx={4/z}
                  stroke={sel ? '#4f8ef7' : 'rgba(0,0,0,0.2)'} strokeWidth={sel ? 2/z : 0.8/z} />
                <text x={f.x+f.width/2} y={f.y+f.height/2+4} textAnchor="middle"
                  fill="rgba(0,0,0,0.5)" fontSize={Math.max(6,9/z)} fontFamily="Inter" pointerEvents="none">
                  {f.label}
                </text>
              </g>
            );
          })}

          {/* Draw preview */}
          {preview && preview.width > 5 && preview.height > 5 && (
            <g pointerEvents="none">
              <rect x={preview.x} y={preview.y} width={preview.width} height={preview.height}
                fill="rgba(79,142,247,0.08)" stroke="#4f8ef7" strokeWidth={1.5/z} strokeDasharray={`${6/z} ${3/z}`} rx={2} />
              <text x={preview.x+preview.width/2} y={preview.y-8/z} textAnchor="middle"
                fill="#4f8ef7" fontSize={Math.max(8,12/z)} fontFamily="Inter" fontWeight="600">
                {(preview.width/100).toFixed(1)}m × {(preview.height/100).toFixed(1)}m
              </text>
            </g>
          )}

          {/* Crosshair */}
          {activeTool === 'room' && (
            <g pointerEvents="none" opacity="0.55">
              <line x1={mousePos.x-14/z} y1={mousePos.y} x2={mousePos.x+14/z} y2={mousePos.y} stroke="#4f8ef7" strokeWidth={1/z} />
              <line x1={mousePos.x} y1={mousePos.y-14/z} x2={mousePos.x} y2={mousePos.y+14/z} stroke="#4f8ef7" strokeWidth={1/z} />
              <circle cx={mousePos.x} cy={mousePos.y} r={2.5/z} fill="#4f8ef7" />
            </g>
          )}
        </g>
      </svg>

      {/* Status bar */}
      <div style={{
        position:'absolute', bottom:16, left:'50%', transform:'translateX(-50%)',
        background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:99,
        padding:'5px 18px', fontSize:11, color:'var(--text-muted)',
        display:'flex', alignItems:'center', gap:12, pointerEvents:'none', whiteSpace:'nowrap',
      }}>
        <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--green)', boxShadow:'0 0 6px var(--green)' }} />
        <span>X: {(mousePos.x/100).toFixed(2)} m</span>
        <span>|</span>
        <span>Y: {(mousePos.y/100).toFixed(2)} m</span>
        <span>|</span>
        <span>Zoom: {Math.round(z*100)}%</span>
        <span>|</span>
        <span>{visRooms.length} rooms</span>
        {isDrawingRoom && drawStart && drawCurrent && <>
          <span>|</span>
          <span style={{ color:'#4f8ef7', fontWeight:600 }}>
            {(Math.abs(drawCurrent.x-drawStart.x)/100).toFixed(1)}m × {(Math.abs(drawCurrent.y-drawStart.y)/100).toFixed(1)}m
          </span>
        </>}
      </div>

      {/* Zoom controls */}
      <div style={{
        position:'absolute', bottom:16, left:16,
        display:'flex', flexDirection:'column', gap:0,
        background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', overflow:'hidden',
      }}>
        {[
          { label: '+', action: () => { const nz=Math.min(5,zoomRef.current*1.25); zoomRef.current=nz; setLocalZoom(nz); } },
          { label: '−', action: () => { const nz=Math.max(0.08,zoomRef.current*0.8); zoomRef.current=nz; setLocalZoom(nz); } },
          { label: '⊡', action: () => setCentered(false), title: 'Fit to screen' },
        ].map(btn => (
          <button key={btn.label} onClick={btn.action} style={{
            width:34, height:34, border:'none', borderTop: btn.label!=='+'?'1px solid var(--border)':'none',
            background:'transparent', color:'var(--text-secondary)', fontSize: btn.label==='⊡'?13:17,
            cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
          }}>{btn.label}</button>
        ))}
      </div>

      {/* Tool hint banners */}
      {activeTool === 'room' && <ToolHint>🖊 Click and drag to draw a room · <b>Esc</b> to cancel</ToolHint>}
      {activeTool === 'door' && <ToolHint>Click near a wall to place a door</ToolHint>}
      {activeTool === 'window' && <ToolHint>Click near a wall to place a window</ToolHint>}
      {activeTool === 'furniture' && <ToolHint>Click on canvas to place furniture, or use Library panel →</ToolHint>}

      {/* Empty state */}
      {visRooms.length === 0 && !isDrawingRoom && (
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center', pointerEvents:'none' }}>
          <div style={{ fontSize:48, opacity:0.25, marginBottom:12 }}>🏗️</div>
          <div style={{ fontSize:15, fontWeight:600, color:'var(--text-secondary)', marginBottom:6 }}>Canvas is empty</div>
          <div style={{ fontSize:12, color:'var(--text-muted)', lineHeight:1.7 }}>
            Select <b>Room</b> tool and drag to draw, or click <b>Load Demo</b> ↗
          </div>
        </div>
      )}
    </div>
  );
}

function ToolHint({ children }) {
  return (
    <div style={{
      position:'absolute', top:16, left:'50%', transform:'translateX(-50%)',
      background:'rgba(79,142,247,0.15)', border:'1px solid rgba(79,142,247,0.4)',
      borderRadius:99, padding:'6px 18px', fontSize:12, color:'#4f8ef7',
      backdropFilter:'blur(8px)', pointerEvents:'none', whiteSpace:'nowrap',
    }}>
      {children}
    </div>
  );
}
