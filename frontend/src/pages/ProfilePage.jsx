// B43: Profile page. Reads /api/auth/me on mount, lets the user update their
// first_name, last_name, phone via PUT /api/users/:id (self-write allowed by
// the user controller).

import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";
import AdminHeader from "../components/AdminHeader";

export default function ProfilePage({ user, setPage, onLogout, showToast }) {
  const [me, setMe] = useState(null);
  const [form, setForm] = useState({ first_name: "", last_name: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch("/auth/me");
        setMe(data.user);
        setForm({
          first_name: data.user.first_name || "",
          last_name: data.user.last_name || "",
          phone: data.user.phone || "",
        });
      } catch (err) {
        setError(err.message);
      }
    })();
  }, []);

  const save = async () => {
    if (!me) return;
    setError("");
    setSaving(true);
    try {
      const updated = await apiFetch(`/users/${me.id}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });
      setMe(updated);
      if (showToast) showToast("Profile updated.", "success");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', sans-serif" }}>
      {isAdmin && (
        <AdminHeader
          title="My Profile"
          current="profile"
          showBack
          setPage={setPage}
          onLogout={onLogout}
        />
      )}

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px" }}>
        <div className="profile-card" style={{ width: "100%", maxWidth: "none" }}>
          <p className="profile-card-title">Account details</p>

          {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠️ {error}</div>}
          {!me ? (
            <p className="dash-sub">Loading…</p>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" value={me.email} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">First name</label>
                <input
                  className="form-input"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Last name</label>
                <input
                  className="form-input"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  className="form-input"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
                <button className="btn-submit" onClick={save} disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => setPage("change-password")}
                  style={{ height: 40 }}
                >
                  Change password
                </button>
              </div>

              <div style={{ marginTop: 24, color: "#64748b", fontSize: 13 }}>
                <div><strong>Roles:</strong> {(me.roles || []).join(", ") || "(none)"}</div>
                <div><strong>Member since:</strong> {new Date(me.created_at).toLocaleDateString("en-GB")}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
