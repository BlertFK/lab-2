import { useState } from "react";
import { apiFetch } from "../utils/api";

export default function LoginPage({ setPage, onLoginSuccess }) {
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setError("");
        if (!form.email || !form.password) return setError("Please fill in all fields.");
        setLoading(true);
        try {
            // → POST http://localhost:5000/api/auth/login
            const data = await apiFetch("/auth/login", {
                method: "POST",
                body: JSON.stringify({ email: form.email, password: form.password }),
            });
            localStorage.setItem("token", data.token);       // store JWT
            localStorage.setItem("authExpiresAt", String(Date.now() + 7 * 24 * 60 * 60 * 1000));
            onLoginSuccess(data.user);                        // update App state
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-visual"><div className="auth-visual-overlay"><p className="auth-visual-quote">"The best investment on earth is earth."</p><p className="auth-visual-sub">— Louis Glickman</p></div></div>
            <div className="auth-form-side">
                <span className="auth-logo" onClick={() => setPage("home")}>UrbanKeys</span>
                <h2 className="auth-title">Welcome back</h2>
                <p className="auth-sub">Sign in to your account to continue</p>
                {error && <div className="alert alert-error">⚠️ {error}</div>}
                <div className="form-group">
                    <label className="form-label">Email address</label>
                    <input className={`form-input${error ? " has-error" : ""}`} type="email" placeholder="you@example.com"
                        value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                        onKeyDown={e => e.key === "Enter" && handleSubmit()} />
                </div>
                <div className="form-group">
                    <label className="form-label">Password</label>
                    <input className={`form-input${error ? " has-error" : ""}`} type="password" placeholder="••••••••"
                        value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                        onKeyDown={e => e.key === "Enter" && handleSubmit()} />
                </div>
                <button className="btn-submit" onClick={handleSubmit} disabled={loading}>
                    {loading ? <><span className="spinner" /> Signing in…</> : "Sign In"}
                </button>
                <p className="auth-alt">Don't have an account? <a onClick={() => setPage("register")}>Create one</a></p>
            </div>
        </div>
    );
}
