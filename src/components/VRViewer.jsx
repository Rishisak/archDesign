import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useDesignStore } from '../store/designStore';

const SCALE = 0.008;
const WALL_H = 2.8;

export default function VRViewer() {
  const leftRef  = useRef(null);
  const rightRef = useRef(null);
  const animRef  = useRef(null);
  const stateRef = useRef({ yaw: 0.3, pitch: -0.1, dragging: false, lastX: 0, lastY: 0 });
  const [gyro, setGyro] = useState(false);

  const { rooms, furniture, activeFloor } = useDesignStore();

  function renderEye(canvas, yawOffset) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const st = stateRef.current;
    const vis = rooms.filter(r => r.floor === activeFloor);

    let cx = 0, cz = 0;
    if (vis.length) {
      const minX = Math.min(...vis.map(r => r.x));
      const maxX = Math.max(...vis.map(r => r.x + r.width));
      const minY = Math.min(...vis.map(r => r.y));
      const maxY = Math.max(...vis.map(r => r.y + r.height));
      cx = ((minX + maxX) / 2) * SCALE;
      cz = ((minY + maxY) / 2) * SCALE;
    }

    const eyeX = cx, eyeZ = cz - 2;

    // Build walls
    const walls = [];
    vis.forEach(room => {
      const x0 = room.x * SCALE - cx, x1 = (room.x + room.width) * SCALE - cx;
      const z0 = room.y * SCALE - cz, z1 = (room.y + room.height) * SCALE - cz;
      walls.push({ x0, z0, x1, z1: z0, color: room.color });
      walls.push({ x0, z0: z1, x1, z1, color: room.color });
      walls.push({ x0, z0, x1: x0, z1, color: room.color });
      walls.push({ x0: x1, z0, x1, z1, color: room.color });
    });

    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.55);
    sky.addColorStop(0, '#050a14');
    sky.addColorStop(1, '#0d1824');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H * 0.55);

    // Floor
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, H * 0.55, W, H * 0.45);

    // Raycast
    const FOV = Math.PI * 0.6;
    const COLS = Math.floor(W / 2);
    const yaw = st.yaw + yawOffset;

    for (let col = 0; col < COLS; col++) {
      const angle = yaw - FOV/2 + (col / COLS) * FOV;
      const dx = Math.cos(angle), dz = Math.sin(angle);
      let best = 20;
      let bestColor = '#1e2530';

      walls.forEach(w => {
        const lx = w.x1 - w.x0, lz = w.z1 - w.z0;
        const denom = dx * lz - dz * lx;
        if (Math.abs(denom) < 0.0001) return;
        const tx = w.x0 - eyeX, tz = w.z0 - (eyeZ - cz);
        const t = (tx * lz - tz * lx) / denom;
        const u = (tx * dz - tz * dx) / denom;
        if (t > 0 && t < best && u >= 0 && u <= 1) {
          best = t;
          bestColor = w.color;
        }
      });

      const fishEye = best * Math.cos(angle - yaw);
      const wallH = Math.min(H, (WALL_H / fishEye) * (H * 0.35));
      const wallTop = (H * 0.5 - wallH / 2) - st.pitch * H * 0.3;

      const bright = Math.max(0.1, Math.min(1, 1.2 / (fishEye + 0.3)));
      const hex = bestColor.startsWith('#') ? bestColor : '#c0c8d4';
      const r = parseInt(hex.slice(1,3), 16);
      const g = parseInt(hex.slice(3,5), 16);
      const b = parseInt(hex.slice(5,7), 16);

      ctx.fillStyle = `rgba(${(r*bright)|0},${(g*bright)|0},${(b*bright)|0},1)`;
      ctx.fillRect(col * 2, wallTop, 2, wallH);
    }

    // Lens vignette
    const vig = ctx.createRadialGradient(W/2, H/2, H*0.2, W/2, H/2, H*0.8);
    vig.addColorStop(0, 'transparent');
    vig.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  }

  useEffect(() => {
    function resize() {
      const c1 = leftRef.current, c2 = rightRef.current;
      if (!c1 || !c2) return;
      const w = c1.offsetWidth, h = c1.offsetHeight;
      c1.width = w; c1.height = h;
      c2.width = w; c2.height = h;
    }
    resize();
    const ro = new ResizeObserver(resize);
    if (leftRef.current) ro.observe(leftRef.current);

    function frame() {
      renderEye(leftRef.current,  -0.032);
      renderEye(rightRef.current,  0.032);
      animRef.current = requestAnimationFrame(frame);
    }
    frame();
    return () => { ro.disconnect(); cancelAnimationFrame(animRef.current); };
  }, [rooms, activeFloor]);

  // Gyroscope
  useEffect(() => {
    if (!gyro) return;
    const handler = (e) => {
      stateRef.current.yaw   += e.gamma * 0.004;
      stateRef.current.pitch  = Math.max(-0.8, Math.min(0.8, -e.beta * 0.015));
    };
    window.addEventListener('deviceorientation', handler);
    return () => window.removeEventListener('deviceorientation', handler);
  }, [gyro]);

  const onMouseDown = useCallback((e) => { stateRef.current.dragging = true; stateRef.current.lastX = e.clientX; stateRef.current.lastY = e.clientY; }, []);
  const onMouseMove = useCallback((e) => {
    if (!stateRef.current.dragging) return;
    stateRef.current.yaw   += (e.clientX - stateRef.current.lastX) * 0.004;
    stateRef.current.pitch  = Math.max(-0.8, Math.min(0.8, stateRef.current.pitch + (e.clientY - stateRef.current.lastY) * 0.003));
    stateRef.current.lastX = e.clientX; stateRef.current.lastY = e.clientY;
  }, []);
  const onMouseUp = useCallback(() => { stateRef.current.dragging = false; }, []);

  return (
    <div
      style={{ position: 'absolute', inset: 0, background: '#000', display: 'flex', cursor: 'grab' }}
      onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
    >
      {/* Left eye */}
      <div style={{ flex: 1, position: 'relative', borderRight: '2px solid #000' }}>
        <canvas ref={leftRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>◉ LEFT</div>
      </div>
      {/* Right eye */}
      <div style={{ flex: 1, position: 'relative' }}>
        <canvas ref={rightRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', top: 10, right: 10, fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>◉ RIGHT</div>
      </div>

      <div className="vr-badge">VR MODE</div>

      {/* Controls */}
      <div style={{
        position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 8, zIndex: 20,
      }}>
        <button
          className="btn btn-ghost"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', color: gyro ? '#4f8ef7' : 'var(--text-muted)' }}
          onClick={() => { if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) DeviceOrientationEvent.requestPermission(); setGyro(!gyro); }}
        >
          {gyro ? '📱 Gyro ON' : '📱 Enable Gyro'}
        </button>
        <button
          className="btn btn-ghost"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => { document.documentElement.requestFullscreen?.(); }}
        >
          ⛶ Fullscreen
        </button>
      </div>

      {/* Cardboard prompt */}
      <div style={{
        position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
        border: '1px solid var(--border)', borderRadius: 99,
        padding: '5px 16px', fontSize: 11, color: 'var(--text-muted)',
        whiteSpace: 'nowrap',
      }}>
        🥽 Place phone in Google Cardboard · Drag to look around
      </div>
    </div>
  );
}
