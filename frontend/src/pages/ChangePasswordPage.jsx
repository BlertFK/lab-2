// B43: Change password page. POST /api/auth/change-password.
// On success the backend revokes ALL refresh tokens for safety, so we log
// the user out and ask them to sign in again.

import { useState } from "react";
import { apiFetch, clearTokens } from "../utils/api";
import AdminHeader from "../components/AdminHeader";

export default function ChangePasswordPage({ user, setPage, onLogout, showToast }) {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isAdmin = user?.role === "admin";

  const submit = async () => {
    setError("");
    if (form.newPassword.length < 8) return setError("Password must be at least 8 characters.");
    if (form.newPassword !== form.confirm) return setError("New password does not match.");

    setLoading(true);
    try {
      await apiFetch("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      clearTokens();
      if (showToast) showToast("Password updated. Please sign in again.", "success");
      if (onLogout) onLogout();
      else setPage("login");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', sans-serif" }}>
      {isAdmin && (
        <AdminHeader
          title="Change Password"
          current="profile"
          showBack
          onBack={() => setPage("profile")}
          setPage={setPage}
          onLogout={onLogout}
        />
      )}

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "32px 24px" }}>
        <div className="profile-card" style={{ width: "100%", maxWidth: "none" }}>
          <p className="profile-card-title">Update password</p>

          {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠️ {error}</div>}

          <div className="form-group">
            <label className="form-label">Current password</label>
            <input
              className="form-input"
              type="password"
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">New password</label>
            <input
              className="form-input"
              type="password"
              placeholder="At least 8 characters"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm new password</label>
            <input
              className="form-input"
              type="password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <button className="btn-submit" onClick={submit} disabled={loading}>
              {loading ? "Updating…" : "Update password"}
            </button>
            <button className="btn-ghost" onClick={() => setPage(isAdmin ? "profile" : "dashboard")} style={{ height: 40 }}>
              Cancel
            </button>
          </div>

          <p className="dash-sub" style={{ marginTop: 12 }}>
            For security, all other sessions will be signed out after this change.
          </p>
        </div>
      </div>
    </div>
  );
}
