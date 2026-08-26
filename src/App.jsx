import React, { Suspense, useState, useEffect } from 'react';
import './index.css';
import { useDesignStore } from './store/designStore';
import Header from './components/Header';
import Toolbar from './components/Toolbar';
import Canvas2D from './components/Canvas2D';
import RightPanel, { FurniturePropertiesPanel } from './components/RightPanel';
import BottomPanel from './components/BottomPanel';
import LoginPage from './components/LoginPage';

const ThreeDViewer      = React.lazy(() => import('./components/ThreeDViewer'));
const WalkthroughViewer = React.lazy(() => import('./components/WalkthroughViewer'));

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
  const { viewMode, showRightPanel, setShowRightPanel } = useDesignStore();
  const is2D = viewMode === '2d';

  // Auth state: check localStorage or default to null (show login page at start)
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('blueprint_studio_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleLoginSuccess = (userObj) => {
    setUser(userObj);
    try {
      localStorage.setItem('blueprint_studio_user', JSON.stringify(userObj));
    } catch (err) {
      console.warn("Storage error:", err);
    }
  };

  const handleSignOut = () => {
    setUser(null);
    try {
      localStorage.removeItem('blueprint_studio_user');
    } catch (err) {
      console.warn("Storage error:", err);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
         activeEl.tagName === 'TEXTAREA' ||
         activeEl.isContentEditable)
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl) {
        if (e.key.toLowerCase() === 'z') {
          if (e.shiftKey) {
            e.preventDefault();
            const { redo, canRedo } = useDesignStore.getState();
            if (canRedo) redo();
          } else {
            e.preventDefault();
            const { undo, canUndo } = useDesignStore.getState();
            if (canUndo) undo();
          }
        } else if (e.key.toLowerCase() === 'y') {
          e.preventDefault();
          const { redo, canRedo } = useDesignStore.getState();
          if (canRedo) redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Show login page at start if no user is signed in or entered as guest
  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Header spans full width */}
      <Header currentUser={user} onSignOut={handleSignOut} />

      {/* Body row */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Left toolbar — only in 2D */}
        {is2D && <Toolbar />}

        {/* Canvas / viewer area + bottom panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          {/* Canvas viewer */}
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
          </div>

          {/* Bottom panel: Floor manager */}
          <BottomPanel />
        </div>

        {showRightPanel ? (
          <RightPanel />
        ) : (
          <button
            className="right-panel-reopen-tab"
            onClick={() => setShowRightPanel(true)}
            title="Show right panel"
          >
            ‹ Views
          </button>
        )}
      </div>
    </div>
  );
}

