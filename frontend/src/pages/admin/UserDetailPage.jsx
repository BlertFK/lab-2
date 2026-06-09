// B44: User detail. Lets an admin toggle is_active, assign / revoke roles.

import { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api";
import AdminHeader from "../../components/AdminHeader";

export default function UserDetailPage({ userId, setPage, onLogout, showToast }) {
  const [user, setUser] = useState(null);
  const [allRoles, setAllRoles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setError("");
      const [u, roles] = await Promise.all([
        apiFetch(`/users/${userId}`),
        apiFetch("/roles"),
      ]);
      setUser(u);
      setAllRoles(roles);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => { if (userId) load(); /* eslint-disable-next-line */ }, [userId]);

  const setActive = async (next) => {
    setBusy(true);
    try {
      await apiFetch(`/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: next }),
      });
      await load();
      if (showToast) showToast(`User ${next ? "activated" : "deactivated"}.`, "success");
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const assignRole = async (roleId) => {
    setBusy(true);
    try {
      await apiFetch(`/users/${userId}/roles`, {
        method: "POST",
        body: JSON.stringify({ role_id: roleId }),
      });
      await load();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const revokeRole = async (roleId) => {
    setBusy(true);
    try {
      await apiFetch(`/users/${userId}/roles/${roleId}`, { method: "DELETE" });
      await load();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const userRoleNames = new Set(user?.roles || []);
  const available = allRoles.filter((r) => !userRoleNames.has(r.name));

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', sans-serif" }}>
      <AdminHeader
        title="User Detail"
        current="users"
        showBack
        onBack={() => setPage("admin-users")}
        setPage={setPage}
        onLogout={onLogout}
      />

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 40px" }}>
        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
        {!user ? (
          <div className="profile-card" style={{ maxWidth: "none" }}><p className="dash-sub">Loading…</p></div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
            <div className="profile-card" style={{ maxWidth: "none" }}>
              <p className="profile-card-title">Account</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                <Detail label="ID" value={`#${user.id}`} />
                <Detail label="Name" value={`${user.first_name} ${user.last_name}`} />
                <Detail label="Email" value={user.email} />
                <Detail label="Phone" value={user.phone || "—"} />
                <Detail label="Active" value={user.is_active ? "Yes" : "No"} />
                <Detail label="Last login" value={user.last_login_at ? new Date(user.last_login_at).toLocaleString("en-GB") : "Never"} />
              </div>
              <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
                {user.is_active ? (
                  <button className="btn-ghost" style={{ height: 40 }} disabled={busy} onClick={() => setActive(false)}>Deactivate</button>
                ) : (
                  <button className="btn-submit" disabled={busy} onClick={() => setActive(true)}>Activate</button>
                )}
              </div>
            </div>

            <div className="profile-card" style={{ maxWidth: "none" }}>
              <p className="profile-card-title">Roles</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                {(user.roles || []).map((name) => {
                  const r = allRoles.find((x) => x.name === name);
                  return (
                    <span key={name} style={chipStyle}>
                      {name}
                      {r && (
                        <button
                          onClick={() => revokeRole(r.id)}
                          disabled={busy}
                          style={{ background: "transparent", border: "none", color: "#475569", cursor: "pointer", fontSize: 14, lineHeight: 1 }}
                          title="Revoke"
                        >×</button>
                      )}
                    </span>
                  );
                })}
                {(user.roles || []).length === 0 && <span className="dash-sub">No roles assigned.</span>}
              </div>

              {available.length > 0 && (
                <div>
                  <p className="dash-sub" style={{ marginTop: 8, fontSize: 13 }}>Add a role:</p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {available.map((r) => (
                      <button
                        key={r.id}
                        className="btn-ghost"
                        style={{ height: 32 }}
                        disabled={busy}
                        onClick={() => assignRole(r.id)}
                      >
                        + {r.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="profile-card" style={{ maxWidth: "none" }}>
              <p className="profile-card-title">Permissions</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {(user.permissions || []).map((p) => (
                  <span key={p} style={{ ...chipStyle, fontSize: 12 }}>{p}</span>
                ))}
                {(user.permissions || []).length === 0 && <span className="dash-sub">No permissions.</span>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const chipStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  background: "#f1f5f9",
  color: "#1e293b",
  borderRadius: 999,
  padding: "4px 12px",
  fontSize: 13,
  fontWeight: 500,
};

function Detail({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: 15, color: "#1e293b", marginTop: 4 }}>{value}</div>
    </div>
  );
}
