import { useState, useEffect } from "react";
import { apiFetch } from "../utils/api";

// B42: Reset password lands here from the email link with ?token=<reset-token>.
// The backend stub returns a generic OK either way; this page mirrors the
// expected flow so the UI is ready once the email transport is wired.

function getQueryToken() {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  return params.get("token") || "";
}

export default function ResetPasswordPage({ setPage, showToast }) {
  const [token, setToken] = useState("");
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setToken(getQueryToken()); }, []);

  const handleSubmit = async () => {
    setError("");
    if (!token) return setError("Missing reset token.");
    if (pwd.length < 8) return setError("Password must be at least 8 characters.");
    if (pwd !== confirm) return setError("Passwords do not match.");

    setLoading(true);
    try {
      // Backend stub: POST /auth/reset-password { token, password }
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password: pwd }),
      });
      setDone(true);
      if (showToast) showToast("Password updated. You can sign in now.", "success");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-form-side">
          <span className="auth-logo" onClick={() => setPage("home")}>UrbanKeys</span>
          <h2 className="auth-title">Password updated</h2>
          <p className="auth-sub">You can now sign in with your new password.</p>
          <button className="btn-submit" onClick={() => setPage("login")}>Go to sign in</button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-form-side">
        <span className="auth-logo" onClick={() => setPage("home")}>UrbanKeys</span>
        <h2 className="auth-title">Reset your password</h2>
        <p className="auth-sub">Choose a new password to finish.</p>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <div className="form-group">
          <label className="form-label">New password</label>
          <input
            className="form-input"
            type="password"
            placeholder="At least 8 characters"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Confirm new password</label>
          <input
            className="form-input"
            type="password"
            placeholder="Repeat your new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>

        <button className="btn-submit" onClick={handleSubmit} disabled={loading}>
          {loading ? <><span className="spinner" /> Saving…</> : "Set new password"}
        </button>

        <p className="auth-alt">
          <a onClick={() => setPage("login")}>Back to sign in</a>
        </p>
      </div>
    </div>
  );
}
