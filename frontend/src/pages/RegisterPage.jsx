import { useState } from "react";
import { apiFetch } from "../utils/api";

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export default function RegisterPage({ setPage, showToast }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    
    if (!form.name || !form.email || !form.password || !form.role) {
      return setError("Please fill in all fields.");
    }
    if (!isValidEmail(form.email)) {
      return setError("Please enter a valid email address (e.g. you@example.com).");
    }
    if (form.password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    const roleMap = { buyer: "buyer", seller: "seller", renter: "buyer", agent: "seller" };
    
    setLoading(true);
    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ 
          name: form.name, 
          email: form.email, 
          password: form.password, 
          role: roleMap[form.role] 
        }),
      });

      showToast("Account created! Please sign in.", "success");
      setPage("login");
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
          <p className="auth-visual-quote">"Buy land — they're not making it anymore."</p>
          <p className="auth-visual-sub">— Mark Twain</p>
        </div>
      </div>
      
      <div className="auth-form-side">
        <span className="auth-logo" onClick={() => setPage("home")}>UrbanKeys</span>
        <h2 className="auth-title">Create an account</h2>
        <p className="auth-sub">Join thousands of buyers, sellers & renters</p>
        
        {error && <div className="alert alert-error">⚠️ {error}</div>}
        
        <div className="form-group">
          <label className="form-label">Full name</label>
          <input 
            className="form-input" 
            placeholder="Jane Doe" 
            value={form.name} 
            onChange={e => setForm({ ...form, name: e.target.value })} 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Email address</label>
          <input 
            className="form-input" 
            type="email" 
            placeholder="you@example.com" 
            value={form.email} 
            onChange={e => setForm({ ...form, email: e.target.value })} 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input 
            className="form-input" 
            type="password" 
            placeholder="At least 6 characters" 
            value={form.password} 
            onChange={e => setForm({ ...form, password: e.target.value })} 
          />
        </div>

        <div className="form-group">
          <label className="form-label">I am a</label>
          <select 
            className="form-select" 
            value={form.role} 
            onChange={e => setForm({ ...form, role: e.target.value })}
          >
            <option value="" disabled>Select your role</option>
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
          </select>
        </div>

        <button className="btn-submit" onClick={handleSubmit} disabled={loading}>
          {loading ? <><span className="spinner" /> Creating account…</> : "Create Account"}
        </button>
        
        <p className="auth-alt">
          Already have an account? <a onClick={() => setPage("login")}>Sign in</a>
        </p>
      </div>
    </div>
  );
}