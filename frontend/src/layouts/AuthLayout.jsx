import { Outlet, Link } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="auth-layout">
      <div className="auth-card">
        <Link to="/" className="auth-brand">
          <div className="brand-logo"><div className="logo-dot" /></div>
          <span className="brand-name">UrbanKeys</span>
        </Link>
        <Outlet />
      </div>
    </div>
  );
}
