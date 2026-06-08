import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toggleTheme } from "../features/ui/uiSlice";
import { Moon, Sun, Heart, Bell, Menu, X } from "lucide-react";
import Footer from "../components/Footer";
import NotificationsBell from "../components/NotificationsBell";

export default function PublicLayout() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const theme = useSelector((s) => s.ui.theme);

  const raw = localStorage.getItem("user");
  const user = raw ? JSON.parse(raw) : null;

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <>
      <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="nav-container">
          <Link to="/" className="nav-brand" style={{ textDecoration: "none" }}>
            <div className="brand-logo"><div className="logo-dot" /></div>
            <span className="brand-name">UrbanKeys</span>
          </Link>

          <div className={`nav-menu ${mobileOpen ? "nav-menu--open" : ""}`}>
            <Link to="/"           className={`nav-link ${location.pathname === "/" ? "active" : ""}`}>Home</Link>
            <Link to="/properties" className={`nav-link ${isActive("/properties") ? "active" : ""}`}>Properties</Link>
            <Link to="/about"      className={`nav-link ${isActive("/about") ? "active" : ""}`}>About</Link>
            <Link to="/contact"    className={`nav-link ${isActive("/contact") ? "active" : ""}`}>Contact</Link>
            <Link to="/faq"        className={`nav-link ${isActive("/faq") ? "active" : ""}`}>FAQ</Link>
          </div>

          <div className="nav-auth" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => dispatch(toggleTheme())}
              className="nav-icon-btn"
              aria-label="Toggle theme"
              title="Toggle dark mode"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {user ? (
              <>
                <NotificationsBell />
                <button className="btn-secondary" onClick={() => navigate(user.role === "admin" ? "/admin" : "/dashboard")}>
                  Dashboard
                </button>
                <button className="btn-ghost" onClick={handleLogout}>Sign out</button>
              </>
            ) : (
              <>
                <button className="btn-ghost" onClick={() => navigate("/login")}>Log in</button>
                <button className="btn-primary" onClick={() => navigate("/register")}>Sign up</button>
              </>
            )}

            <button
              className="nav-icon-btn mobile-menu-toggle"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      <main style={{ minHeight: "100vh" }}>
        <Outlet />
      </main>

      <Footer />
    </>
  );
}
