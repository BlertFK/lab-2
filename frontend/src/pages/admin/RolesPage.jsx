// B45: Admin Roles + Permissions editor.

import { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api";
import AdminHeader from "../../components/AdminHeader";

const chipBase = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 12px",
  borderRadius: 999,
  border: "1px solid transparent",
  fontSize: 13,
  cursor: "pointer",
  userSelect: "none",
};

export default function RolesPage({ setPage, onLogout, showToast }) {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState({});  // grouped { resource: [perms] }
  const [activeRoleId, setActiveRoleId] = useState(null);
  const [rolePerms, setRolePerms] = useState([]);      // permissions for active role
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadAll = async () => {
    try {
      const [r, p] = await Promise.all([
        apiFetch("/roles"),
        apiFetch("/permissions?grouped=true"),
      ]);
      setRoles(r);
      setPermissions(p);
      if (!activeRoleId && r[0]) {
        setActiveRoleId(r[0].id);
      }
    } catch (err) { setError(err.message); }
  };

  const loadRolePerms = async (id) => {
    try {
      const ps = await apiFetch(`/roles/${id}/permissions`);
      setRolePerms(ps);
    } catch (err) { setError(err.message); }
  };

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { if (activeRoleId) loadRolePerms(activeRoleId); }, [activeRoleId]);

  const activeRole = roles.find((r) => r.id === activeRoleId);
  const heldIds = new Set(rolePerms.map((p) => p.id));

  const createRole = async () => {
    if (!newName.trim()) return;
    setBusy(true);
    try {
      await apiFetch("/roles", { method: "POST", body: JSON.stringify({ name: newName.trim() }) });
      setNewName("");
      await loadAll();
      if (showToast) showToast("Role created.", "success");
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const deleteRole = async (id) => {
    if (!confirm("Delete this role?")) return;
    setBusy(true);
    try {
      await apiFetch(`/roles/${id}`, { method: "DELETE" });
      if (activeRoleId === id) setActiveRoleId(null);
      await loadAll();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const togglePermission = async (permId) => {
    if (!activeRoleId) return;
    setBusy(true);
    try {
      if (heldIds.has(permId)) {
        await apiFetch(`/roles/${activeRoleId}/permissions/${permId}`, { method: "DELETE" });
      } else {
        await apiFetch(`/roles/${activeRoleId}/permissions`, {
          method: "POST",
          body: JSON.stringify({ permission_id: permId }),
        });
      }
      await loadRolePerms(activeRoleId);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', sans-serif" }}>
      <AdminHeader
        title="Roles & Permissions"
        current="roles"
        showBack
        setPage={setPage}
        onLogout={onLogout}
      />

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 40px" }}>
        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16 }}>
          {/* Left: Roles list */}
          <div className="profile-card" style={{ maxWidth: "none" }}>
            <p className="profile-card-title">Roles</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setActiveRoleId(r.id)}
                  style={{
                    textAlign: "left",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: r.id === activeRoleId ? "1px solid #2563eb" : "1px solid #e2e8f0",
                    background: r.id === activeRoleId ? "#eff6ff" : "white",
                    color: "#1e293b",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontFamily: "inherit",
                  }}
                >
                  <span style={{ display: "flex", flexDirection: "column" }}>
                    <strong style={{ fontSize: 14 }}>{r.name}</strong>
                    <span style={{ fontSize: 12, color: "#64748b" }}>
                      {r.users_count || 0} users · {r.permissions_count || 0} perms
                      {r.is_system ? " · system" : ""}
                    </span>
                  </span>
                  {!r.is_system && (
                    <span
                      role="button"
                      onClick={(e) => { e.stopPropagation(); deleteRole(r.id); }}
                      style={{ color: "#dc2626", fontSize: 16, padding: "0 4px" }}
                      title="Delete"
                    >×</span>
                  )}
                </button>
              ))}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">New role</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="form-input"
                  placeholder="e.g. Moderator"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <button className="btn-submit" disabled={busy || !newName.trim()} onClick={createRole}>Add</button>
              </div>
            </div>
          </div>

          {/* Right: Permission matrix */}
          <div className="profile-card" style={{ maxWidth: "none" }}>
            <p className="profile-card-title">
              {activeRole ? `Permissions — ${activeRole.name}` : "Select a role"}
            </p>
            {!activeRole ? (
              <p className="dash-sub">Pick a role to edit its permissions.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {Object.entries(permissions).map(([resource, perms]) => (
                  <div key={resource}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                      {resource}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {perms.map((p) => {
                        const held = heldIds.has(p.id);
                        return (
                          <span
                            key={p.id}
                            onClick={() => !busy && togglePermission(p.id)}
                            title={p.description || p.name}
                            style={{
                              ...chipBase,
                              background: held ? "#2563eb" : "#f1f5f9",
                              color: held ? "white" : "#1e293b",
                              border: held ? "1px solid #2563eb" : "1px solid #e2e8f0",
                              opacity: busy ? 0.6 : 1,
                            }}
                          >
                            {held ? "✓" : "+"} {p.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
