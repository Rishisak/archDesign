import React, { useState, useEffect, useMemo } from "react";
import { useDesignStore } from "../store/designStore";
import { fetchUserProjects, saveUserProject, deleteUserProject } from "../lib/supabase";

export default function Dashboard({ user, onSignOut, onOpenStudio }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [templateType, setTemplateType] = useState("demo"); // 'demo' | 'blank'
  const [deletingId, setDeletingId] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const { initNewProject, loadProjectData } = useDesignStore();

  const userId = user?.id || user?.email || "guest_user";
  const userName = user?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Architect";
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  // Load user's saved projects
  const loadProjects = async () => {
    setLoading(true);
    try {
      const list = await fetchUserProjects(userId);
      setProjects(list || []);
    } catch (err) {
      console.warn("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [userId]);

  // Filter projects by search
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter((p) => (p.name || "Untitled Project").toLowerCase().includes(q));
  }, [projects, searchQuery]);

  // Create & launch project
  const handleCreateProject = async (e) => {
    if (e) e.preventDefault();
    const finalName = newProjectName.trim() || `Project #${projects.length + 1}`;
    
    // Initialize store
    initNewProject({ name: finalName, withDemo: templateType === "demo" });

    // Instantly save to user's saved projects list
    const snapshot = useDesignStore.getState().getProjectSnapshot();
    const currentId = useDesignStore.getState().currentProjectId;
    
    await saveUserProject(userId, {
      id: currentId,
      name: finalName,
      data: snapshot,
    });

    setShowCreateModal(false);
    setNewProjectName("");
    onOpenStudio();
  };

  // Quick launch demo
  const handleQuickDemo = async () => {
    const demoName = `Demo Villa #${projects.length + 1}`;
    initNewProject({ name: demoName, withDemo: true });

    const snapshot = useDesignStore.getState().getProjectSnapshot();
    const currentId = useDesignStore.getState().currentProjectId;

    await saveUserProject(userId, {
      id: currentId,
      name: demoName,
      data: snapshot,
    });

    onOpenStudio();
  };

  // Open existing project
  const handleOpenProject = (projRecord) => {
    loadProjectData(projRecord);
    onOpenStudio();
  };

  // Delete project
  const handleDeleteProject = async (projectId) => {
    await deleteUserProject(userId, projectId);
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    setDeletingId(null);
  };

  // Helper date formatting
  const formatDate = (isoString) => {
    if (!isoString) return "Recently";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Recently";
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-primary)",
      color: "var(--text-primary)",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Space Grotesk', Inter, sans-serif",
    }}>
      {/* ── Navbar ── */}
      <header style={{
        height: "var(--header-height)",
        background: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border)",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: "linear-gradient(135deg, var(--accent), #2563eb)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            boxShadow: "0 2px 8px rgba(79,142,247,0.3)",
          }}>
            🏠
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>
            ArchDesign
          </span>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            background: "rgba(79,142,247,0.15)",
            color: "var(--accent)",
            padding: "2px 8px",
            borderRadius: 99,
            border: "1px solid rgba(79,142,247,0.3)",
          }}>
            PRO DASHBOARD
          </span>
        </div>

        {/* Search */}
        <div style={{ position: "relative", width: 320 }}>
          <span style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-muted)",
            fontSize: 14,
          }}>
            🔍
          </span>
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "7px 12px 7px 36px",
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-primary)",
              fontSize: 13,
              outline: "none",
            }}
          />
        </div>

        {/* User profile dropdown */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border)",
              borderRadius: 99,
              padding: "4px 12px 4px 6px",
              cursor: "pointer",
              color: "var(--text-primary)",
            }}
          >
            <div style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "var(--accent)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              {user?.is_guest ? "👤" : userInitials}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{userName}</span>
            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>▾</span>
          </button>

          {showProfileMenu && (
            <div style={{
              position: "absolute",
              right: 0,
              top: 44,
              width: 240,
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
              padding: 12,
              zIndex: 100,
            }}>
              <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{userName}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{user?.email || "guest@blueprint.studio"}</div>
                <div style={{
                  display: "inline-block",
                  marginTop: 6,
                  fontSize: 10,
                  padding: "2px 6px",
                  borderRadius: 4,
                  background: "var(--bg-quaternary)",
                  color: "var(--text-secondary)",
                }}>
                  {user?.is_guest ? "Guest Account" : "Registered Architect"}
                </div>
              </div>
              <button
                onClick={onSignOut}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "rgba(248,81,73,0.1)",
                  border: "1px solid rgba(248,81,73,0.3)",
                  color: "var(--red)",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                🚪 Log Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Main Content Container ── */}
      <main style={{ flex: 1, padding: "36px 40px", maxWidth: 1280, margin: "0 auto", width: "100%" }}>
        {/* Hero Section */}
        <div style={{
          background: "linear-gradient(135deg, rgba(79,142,247,0.12) 0%, rgba(37,99,235,0.04) 100%)",
          border: "1px solid rgba(79,142,247,0.25)",
          borderRadius: 16,
          padding: "32px 36px",
          marginBottom: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
        }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8, letterSpacing: "-0.02em" }}>
              Welcome back, {userName}! 👋
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: 0, maxWidth: 540, lineHeight: 1.5 }}>
              Create 2D blueprints, inspect real-time 3D models, and manage all your architectural projects in one place.
            </p>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              className="btn btn-secondary"
              onClick={handleQuickDemo}
              style={{ padding: "10px 18px", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}
            >
              <span>⚡</span>
              <span>Quick Demo</span>
            </button>

            <button
              className="btn btn-primary"
              onClick={() => {
                setNewProjectName(`Project #${projects.length + 1}`);
                setShowCreateModal(true);
              }}
              style={{
                padding: "10px 22px",
                fontSize: 13,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 4px 14px rgba(79,142,247,0.4)",
              }}
            >
              <span>+</span>
              <span>Create Project</span>
            </button>
          </div>
        </div>

        {/* Section Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h2 style={{ fontSize: 19, fontWeight: 700, margin: 0 }}>
              Your Saved Projects
            </h2>
            <span style={{
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border)",
              padding: "2px 10px",
              borderRadius: 99,
              fontSize: 12,
              color: "var(--text-secondary)",
              fontWeight: 600,
            }}>
              {projects.length}
            </span>
          </div>
        </div>

        {/* ── Projects Grid ── */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
            <div className="animate-spin" style={{
              width: 36,
              height: 36,
              border: "3px solid var(--border)",
              borderTop: "3px solid var(--accent)",
              borderRadius: "50%",
              margin: "0 auto 16px",
            }} />
            <span>Loading your projects from database...</span>
          </div>
        ) : filteredProjects.length === 0 ? (
          /* Empty State */
          <div style={{
            background: "var(--bg-secondary)",
            border: "1px dashed var(--border-heavy)",
            borderRadius: 16,
            padding: "54px 24px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.8 }}>📐</div>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>
              {searchQuery ? "No matching projects found" : "No saved projects yet!"}
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: 13, maxWidth: 420, margin: "0 auto 20px", lineHeight: 1.6 }}>
              {searchQuery
                ? `No project matches "${searchQuery}". Try a different search query.`
                : "Create your first project to design floor plans, test furniture arrangements, and view 3D walkthroughs."}
            </p>
            <button
              className="btn btn-primary"
              onClick={() => {
                setNewProjectName("My Villa Blueprint");
                setShowCreateModal(true);
              }}
              style={{ padding: "10px 20px", fontSize: 13 }}
            >
              + Create Your First Project
            </button>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 24,
          }}>
            {filteredProjects.map((proj) => {
              const data = proj.data || {};
              const roomsCount = data.rooms ? data.rooms.length : 0;
              const floorsCount = data.floors ? data.floors.length : 1;
              const groundsCount = data.grounds ? data.grounds.length : 0;

              return (
                <div
                  key={proj.id}
                  style={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    borderRadius: 14,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
                  }}
                  className="project-card"
                >
                  {/* Card Thumbnail / Blueprint graphic preview */}
                  <div
                    onClick={() => handleOpenProject(proj)}
                    style={{
                      height: 160,
                      background: "linear-gradient(135deg, #0d1117 0%, #161b22 100%)",
                      borderBottom: "1px solid var(--border)",
                      position: "relative",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    {/* Grid Pattern overlay */}
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      backgroundImage: `radial-gradient(circle, rgba(79,142,247,0.15) 1px, transparent 1px)`,
                      backgroundSize: "16px 16px",
                    }} />

                    {/* Architectural Icon Preview */}
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                      zIndex: 2,
                    }}>
                      <div style={{
                        width: 54,
                        height: 54,
                        borderRadius: 12,
                        background: "rgba(79,142,247,0.15)",
                        border: "1px solid rgba(79,142,247,0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 26,
                      }}>
                        🏢
                      </div>
                      <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600 }}>
                        Click to Open Blueprint
                      </span>
                    </div>

                    {/* Room count pill badge */}
                    <div style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      background: "rgba(0,0,0,0.6)",
                      backdropFilter: "blur(4px)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 99,
                      padding: "3px 10px",
                      fontSize: 11,
                      color: "#fff",
                      fontWeight: 600,
                    }}>
                      {roomsCount} Rooms · {floorsCount} Floor{floorsCount > 1 ? "s" : ""}
                    </div>
                  </div>

                  {/* Card Info */}
                  <div style={{ padding: 18, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <h4 style={{
                        fontSize: 16,
                        fontWeight: 700,
                        margin: "0 0 6px 0",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}>
                        {proj.name || "Untitled Project"}
                      </h4>

                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
                        Saved {formatDate(proj.updated_at)}
                      </div>

                      {/* Stats badge list */}
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
                        <span style={{
                          fontSize: 11,
                          background: "var(--bg-tertiary)",
                          border: "1px solid var(--border)",
                          padding: "3px 8px",
                          borderRadius: 6,
                          color: "var(--text-secondary)",
                        }}>
                          🛋️ {roomsCount} Rooms
                        </span>
                        <span style={{
                          fontSize: 11,
                          background: "var(--bg-tertiary)",
                          border: "1px solid var(--border)",
                          padding: "3px 8px",
                          borderRadius: 6,
                          color: "var(--text-secondary)",
                        }}>
                          🌍 {groundsCount} Footprint{groundsCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div style={{ display: "flex", gap: 10, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleOpenProject(proj)}
                        style={{ flex: 1, padding: "7px 12px", fontSize: 12, justifyContent: "center" }}
                      >
                        Open Studio ➔
                      </button>

                      <button
                        onClick={() => setDeletingId(proj.id)}
                        style={{
                          background: "rgba(248,81,73,0.1)",
                          border: "1px solid rgba(248,81,73,0.3)",
                          color: "var(--red)",
                          borderRadius: "var(--radius-sm)",
                          padding: "0 12px",
                          cursor: "pointer",
                          fontSize: 13,
                        }}
                        title="Delete project"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── CREATE PROJECT MODAL ── */}
      {showCreateModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 200,
          padding: 20,
        }}>
          <div style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-heavy)",
            borderRadius: 16,
            width: "100%",
            maxWidth: 480,
            padding: 28,
            boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
          }}>
            <h3 style={{ fontSize: 19, fontWeight: 700, margin: "0 0 6px 0" }}>
              Create New Project
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: 13, margin: "0 0 20px 0" }}>
              Set a name for your project and select how you want to start designing.
            </p>

            <form onSubmit={handleCreateProject}>
              {/* Project Name Input */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                  PROJECT NAME
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Modern Residential Villa"
                  required
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-primary)",
                    fontSize: 14,
                    outline: "none",
                  }}
                />
              </div>

              {/* Template Selection Cards */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 10 }}>
                  SELECT INITIAL TEMPLATE
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div
                    onClick={() => setTemplateType("demo")}
                    style={{
                      padding: 14,
                      borderRadius: 10,
                      border: templateType === "demo" ? "2px solid var(--accent)" : "1px solid var(--border)",
                      background: templateType === "demo" ? "rgba(79,142,247,0.08)" : "var(--bg-tertiary)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div style={{ fontSize: 24 }}>🏢</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: templateType === "demo" ? "var(--accent)" : "var(--text-primary)" }}>
                        Architectural Demo Blueprint (Recommended)
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                        Includes pre-configured bedrooms, living room, doors & furniture
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setTemplateType("blank")}
                    style={{
                      padding: 14,
                      borderRadius: 10,
                      border: templateType === "blank" ? "2px solid var(--accent)" : "1px solid var(--border)",
                      background: templateType === "blank" ? "rgba(79,142,247,0.08)" : "var(--bg-tertiary)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div style={{ fontSize: 24 }}>✏️</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: templateType === "blank" ? "var(--accent)" : "var(--text-primary)" }}>
                        Start Fresh (Blank Canvas)
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                        Completely empty ground footprint — start by drawing your footprint
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: "8px 20px" }}
                >
                  Launch Studio ➔
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {deletingId && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 200,
          padding: 20,
        }}>
          <div style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: 24,
            maxWidth: 400,
            width: "100%",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>
              Delete Project?
            </h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
              Are you sure you want to delete this project? This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button className="btn btn-secondary" onClick={() => setDeletingId(null)}>
                Cancel
              </button>
              <button
                style={{
                  background: "var(--red)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  padding: "8px 18px",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
                onClick={() => handleDeleteProject(deletingId)}
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
