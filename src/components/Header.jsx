import React, { useState } from 'react';
import { useDesignStore } from '../store/designStore';
import { saveUserProject } from '../lib/supabase';
import FurnishPanel from './FurnishPanel';

const VIEWS = [
  { id: '2d', label: '2D Plan', icon: '⊞' },
  { id: '3d', label: '3D View', icon: '◈' },
];

export default function Header({ currentUser, onSignOut, onBackToDashboard }) {
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(false);
  const [showFurnish, setShowFurnish] = useState(false);

  const {
    currentProjectId,
    projectName,
    setProjectName,
    getProjectSnapshot,
    viewMode,
    setViewMode,
    showAIPanel,
    setShowAIPanel,
    showRightPanel,
    toggleRightPanel,
    snapToGrid,
    setSnapToGrid,
    clearDesign,
    loadDemo,
    exportProjectJSON,
    undo,
    redo,
    canUndo,
    canRedo,
    rooms = [],
    floors = []
  } = useDesignStore();

  const userInitials = (currentUser?.full_name || currentUser?.email || 'U')
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const userId = currentUser?.id || currentUser?.email || 'guest_user';

  // Save project into Supabase & localStorage
  const handleSaveProject = async () => {
    try {
      const snapshot = getProjectSnapshot();
      await saveUserProject(currentUser || userId, {
        id: currentProjectId || `proj_${Date.now()}`,
        name: projectName || "My Project",
        data: snapshot,
      });
      setSaveSuccessMessage(true);
      setTimeout(() => setSaveSuccessMessage(false), 3000);
      return true;
    } catch (err) {
      console.error("Save error:", err);
      alert("Could not save project: " + err.message);
      return false;
    }
  };

  // Exit to dashboard with save prompt
  const handleExitClick = () => {
    setShowExitModal(true);
  };

  const handleSaveAndExit = async () => {
    await handleSaveProject();
    setShowExitModal(false);
    if (onBackToDashboard) onBackToDashboard();
  };

  const handleExitWithoutSave = () => {
    setShowExitModal(false);
    if (onBackToDashboard) onBackToDashboard();
  };

  return (
    <>
    <header style={{
      height: 'var(--header-height)',
      display: 'flex',
      alignItems: 'center',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      padding: '0 16px',
      flexShrink: 0,
      zIndex: 100,
      gap: 12,
      overflow: 'visible',
      position: 'relative',
    }}>
      {/* Back to Dashboard Button */}
      {onBackToDashboard && (
        <button
          onClick={handleExitClick}
          className="btn btn-secondary"
          style={{ gap: 6, fontSize: 12, padding: '5px 12px', fontWeight: 600 }}
          title="Return to Dashboard"
        >
          <span>←</span>
          <span>Dashboard</span>
        </button>
      )}

      {/* Logo */}
      <div className="header-logo">
        <div className="header-logo-icon">🏠</div>
        <span className="header-logo-name">ArchDesign</span>
        <span className="header-logo-badge">PRO</span>
      </div>

      <div className="header-divider" />

      {/* Editable Project Name Input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type="text"
          value={projectName || ''}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="Untitled Project"
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontSize: 13,
            fontWeight: 600,
            padding: '4px 10px',
            width: 210,
            outline: 'none',
          }}
          title="Click to rename project"
        />
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>✏️</span>
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

      {/* Furnish Button */}
      <button
        className="furnish-header-btn"
        onClick={() => setShowFurnish(true)}
        title="Shop furniture from Amazon India"
      >
        <span>Furnish</span>
      </button>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Save Success Toast */}
      {saveSuccessMessage && (
        <div style={{
          background: 'rgba(34,197,94,0.15)',
          border: '1px solid rgba(34,197,94,0.4)',
          color: '#4ade80',
          padding: '4px 12px',
          borderRadius: 99,
          fontSize: 12,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          animation: 'fadeIn 0.2s ease',
        }}>
          <span>✓</span>
          <span>Project Saved!</span>
        </div>
      )}

      {/* Actions */}
      <div className="header-actions">
        {/* Save Project Button */}
        <button
          className="btn btn-primary"
          onClick={handleSaveProject}
          title="Save project to database & dashboard"
          style={{ gap: 6, fontSize: 12, padding: '5px 14px', fontWeight: 600 }}
        >
          <span>💾</span>
          <span>Save Project</span>
        </button>

        <div className="header-divider" style={{ margin: '0 4px' }} />

        {/* Undo */}
        <button
          className="icon-btn"
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
        >
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7h6.5a3.5 3.5 0 0 1 0 7H8" />
            <path d="M6.5 4.5L4 7l2.5 2.5" />
          </svg>
        </button>

        {/* Redo */}
        <button
          className="icon-btn"
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          aria-label="Redo"
        >
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 7H5.5a3.5 3.5 0 0 0 0 7H8" />
            <path d="M9.5 4.5L12 7l-2.5 2.5" />
          </svg>
        </button>

        <div className="header-divider" style={{ margin: '0 4px' }} />

        {/* Reset Demo */}
        <button className="icon-btn" onClick={loadDemo} title="Load Demo Blueprint">
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

        {/* User profile */}
        {currentUser && (
          <>
            <div className="header-divider" style={{ margin: '0 4px' }} />
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowProfileCard(!showProfileCard)}
                className="user-profile-trigger-btn"
                title="View Profile & Dashboard"
              >
                <div className="user-avatar-circle">
                  {currentUser.is_guest ? '👤' : userInitials}
                </div>
                <span className="user-profile-name">
                  {currentUser.full_name || currentUser.email || 'Architect'}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>▾</span>
              </button>

              {/* ── PROFILE CARD DROPDOWN ── */}
              {showProfileCard && (
                <div className="user-profile-dropdown-card">
                  <div className="profile-card-header">
                    <div className="user-avatar-circle large">
                      {currentUser.is_guest ? '👤' : userInitials}
                    </div>
                    <div className="profile-card-title-block">
                      <div className="profile-card-name">
                        {currentUser.full_name || 'Architect'}
                      </div>
                      <div className="profile-card-email">
                        {currentUser.email || 'guest@blueprint.studio'}
                      </div>
                      <div className="profile-card-role-tag">
                        {currentUser.is_guest ? 'Guest Session' : 'Registered Architect'}
                      </div>
                    </div>
                  </div>

                  <div className="profile-card-divider" />

                  <div className="profile-card-stats">
                    <div className="profile-stat-item">
                      <span className="stat-label">Rooms</span>
                      <span className="stat-val">{rooms.length}</span>
                    </div>
                    <div className="profile-stat-item">
                      <span className="stat-label">Floors</span>
                      <span className="stat-val">{floors.length}</span>
                    </div>
                    <div className="profile-stat-item">
                      <span className="stat-label">Storage</span>
                      <span className="stat-val" style={{ color: '#60a5fa' }}>Supabase</span>
                    </div>
                  </div>

                  <div className="profile-card-divider" />

                  {onBackToDashboard && (
                    <button
                      className="profile-card-logout-btn"
                      style={{ marginBottom: 6, background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                      onClick={() => {
                        setShowProfileCard(false);
                        handleExitClick();
                      }}
                    >
                      <span>📋 My Dashboard & Projects</span>
                    </button>
                  )}

                  <button
                    className="profile-card-logout-btn"
                    onClick={() => {
                      setShowProfileCard(false);
                      onSignOut();
                    }}
                  >
                    <span>🚪 Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── EXIT / SAVE CONFIRMATION MODAL ── */}
      {showExitModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 300,
          padding: 20,
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-heavy)',
            borderRadius: 16,
            padding: 28,
            maxWidth: 420,
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>💾</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px 0' }}>
              Save Project Changes?
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 24px 0', lineHeight: 1.5 }}>
              Do you want to save <b>"{projectName || 'My Project'}"</b> to your dashboard before exiting?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                className="btn btn-primary"
                onClick={handleSaveAndExit}
                style={{ padding: '10px', fontSize: 13, justifyContent: 'center', fontWeight: 600 }}
              >
                💾 Save & Exit to Dashboard
              </button>

              <button
                className="btn btn-secondary"
                onClick={handleExitWithoutSave}
                style={{ padding: '9px', fontSize: 13, justifyContent: 'center' }}
              >
                Exit Without Saving
              </button>

              <button
                onClick={() => setShowExitModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: 12,
                  cursor: 'pointer',
                  padding: '6px',
                  marginTop: 4,
                }}
              >
                Cancel & Stay in Studio
              </button>
            </div>
          </div>
        </div>
      )}
    </header>

    {/* Furnish Panel */}
    <FurnishPanel open={showFurnish} onClose={() => setShowFurnish(false)} />
    </>
  );
}
