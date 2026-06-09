import { useState } from "react";
import { apiFetch } from "../utils/api";

export default function ForgotPasswordPage({ setPage, showToast }) {
  const [email, setEmail]   = useState("");
  const [sent, setSent]     = useState(false);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!email) return setError("Please enter your email.");
    setLoading(true);
    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSent(true);
      if (showToast) showToast("If that email exists, a reset link is on its way.", "success");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-visual-overlay">
          <p className="auth-visual-quote">"The best time to plant a tree was 20 years ago. The second best time is now."</p>
          <p className="auth-visual-sub">— Chinese proverb</p>
        </div>
      </div>

      <div className="auth-form-side">
        <span className="auth-logo" onClick={() => setPage("home")}>UrbanKeys</span>
        <h2 className="auth-title">Forgot your password?</h2>
        <p className="auth-sub">Enter your email and we'll send you a reset link.</p>

        {error && <div className="alert alert-error">⚠️ {error}</div>}
        {sent && (
          <div className="alert" style={{ background: "#d1fae5", color: "#065f46", border: "1px solid #6ee7b7", padding: "12px 16px", borderRadius: 8, fontWeight: 600 }}>
            If that email is on file, a reset link is on its way.
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Email address</label>
          <input
            className={`form-input${error ? " has-error" : ""}`}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>

        <button className="btn-submit" onClick={handleSubmit} disabled={loading}>
          {loading ? <><span className="spinner" /> Sending…</> : "Send reset link"}
        </button>

        <p className="auth-alt">
          Remembered it? <a onClick={() => setPage("login")}>Sign in</a>
        </p>
      </div>
    </div>
  );
}
