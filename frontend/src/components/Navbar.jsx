import { useState, useEffect } from "react";
import { FaHeart } from "react-icons/fa";

export default function Navbar({ page, setPage, user, onLogout }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openDashboard = () => {
    localStorage.removeItem("dashboardView");
    setPage(user.role === "admin" ? "admin" : "dashboard");
  };

  const openFavorites = () => {
    localStorage.setItem("dashboardView", "favorites");
    setPage("dashboard");
  };

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="nav-container">
        {/* Left: Brand */}
        <div className="nav-brand" onClick={() => setPage("home")}>
          <div className="brand-logo">
            <div className="logo-dot" />
          </div>
          <span className="brand-name">UrbanKeys</span>
        </div>

        {/* Middle: Navigation */}
        <div className="nav-menu">
          <button
            className={`nav-link ${page === "home" ? "active" : ""}`}
            onClick={() => setPage("home")}
          >
            Home
          </button>
          <button
            className={`nav-link ${page === "properties" || page === "propertyDetails" ? "active" : ""}`}
            onClick={() => setPage("properties")}
          >
            Properties
          </button>
        </div>

        {/* Right: Auth Buttons */}
        <div className="nav-auth">
          {user ? (
            <>
              {user.role === "buyer" && (
                <button className="nav-icon-btn" onClick={openFavorites} aria-label="My favorites" title="My favorites">
                  <FaHeart />
                </button>
              )}
              <button className="btn-secondary" onClick={openDashboard}>
                Dashboard
              </button>
              <button className="btn-primary" onClick={onLogout}>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <button className="btn-secondary" onClick={() => setPage("login")}>
                Sign In
              </button>
              <button className="btn-primary" onClick={() => setPage("register")}>
                Get Started
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
