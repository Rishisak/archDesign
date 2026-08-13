import React, { Suspense } from 'react';
import './index.css';
import { useDesignStore } from './store/designStore';
import Header from './components/Header';
import Toolbar from './components/Toolbar';
import Canvas2D from './components/Canvas2D';
import RightPanel, { FurniturePropertiesPanel } from './components/RightPanel';

const ThreeDViewer      = React.lazy(() => import('./components/ThreeDViewer'));
const WalkthroughViewer = React.lazy(() => import('./components/WalkthroughViewer'));
const VRViewer          = React.lazy(() => import('./components/VRViewer'));

function ViewerLoading() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0d1117', flexDirection: 'column', gap: 16,
    }}>
      <div className="animate-spin" style={{
        width: 44, height: 44,
        border: '3px solid var(--bg-quaternary)',
        borderTop: '3px solid var(--accent)',
        borderRadius: '50%',
      }} />
      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading Viewer…</span>
    </div>
  );
}

export default function App() {
  const { viewMode } = useDesignStore();
  const is2D = viewMode === '2d';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Header spans full width */}
      <Header />

      {/* Body row */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Left toolbar — only in 2D */}
        {is2D && <Toolbar />}

        {/* Canvas / viewer area */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {/* 2D canvas — always mounted, shown only in 2D mode */}
          <div style={{
            position: 'absolute', inset: 0,
            visibility: is2D ? 'visible' : 'hidden',
            pointerEvents: is2D ? 'auto' : 'none',
          }}>
            <Canvas2D />
            {/* Furniture Properties side panel — overlays from right */}
            <FurniturePropertiesPanel />
          </div>

          {viewMode === '3d' && (
            <div style={{ position: 'absolute', inset: 0 }}>
              <Suspense fallback={<ViewerLoading />}>
                <ThreeDViewer />
              </Suspense>
            </div>
          )}

          {viewMode === 'walkthrough' && (
            <div style={{ position: 'absolute', inset: 0 }}>
              <Suspense fallback={<ViewerLoading />}>
                <WalkthroughViewer />
              </Suspense>
            </div>
          )}

          {viewMode === 'vr' && (
            <div style={{ position: 'absolute', inset: 0 }}>
              <Suspense fallback={<ViewerLoading />}>
                <VRViewer />
              </Suspense>
            </div>
          )}
        </div>

        {/* Right panel */}
        <RightPanel />
      </div>
    </div>
  );
}
