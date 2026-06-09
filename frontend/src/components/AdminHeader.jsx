// Shared admin shell header: RentEase Platform / Admin Dashboard gradient bar,
// optional back button, optional stat tiles, an extras dropdown for the
// secondary admin pages (Users / Roles / Audit / Settings), a SearchBar and
// NotificationsBell, plus the primary nav buttons (Users-Properties / Reports
// / CMS / Logout). Used across the whole admin area.

import { useState, useRef, useEffect } from "react";
import SearchBar from "./SearchBar";
import NotificationsBell from "./NotificationsBell";

const btnStyle = {
  padding: "10px 20px",
  background: "rgba(255,255,255,0.15)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.3)",
  borderRadius: 10,
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  whiteSpace: "nowrap",
};

const tileStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  background: "rgba(255,255,255,0.15)",
  borderRadius: 10,
  padding: "10px 16px",
  border: "1px solid rgba(255,255,255,0.3)",
  fontSize: 14,
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const EXTRAS = [
  { key: "admin-users",    label: "Users",         page: "admin-users" },
  { key: "admin-roles",    label: "Roles",         page: "admin-roles" },
  { key: "admin-audit",    label: "Audit Log",     page: "admin-audit" },
  { key: "admin-settings", label: "Settings",      page: "admin-settings" },
  { key: "profile",        label: "My Profile",    page: "profile" },
];

export default function AdminHeader({
  title = "Admin Dashboard",
  eyebrow = "RentEase Platform",
  stats = [],
  showBack = false,
  onBack,
  setPage,
  onLogout,
  user,
  current,           // string key to highlight which top-level page is active
  hideSearch = false,
}) {
  const [extrasOpen, setExtrasOpen] = useState(false);
  const extrasRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (extrasRef.current && !extrasRef.current.contains(e.target)) setExtrasOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleBack = () => {
    if (onBack) return onBack();
    if (setPage) return setPage("admin");
    if (typeof window !== "undefined") window.history.back();
  };

  const isActive = (key) => current === key;

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
        padding: "20px 32px",
        color: "white",
        boxShadow: "0 4px 20px rgba(37,99,235,0.3)",
      }}
    >
      <div
        style={{
          maxWidth: 1500,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
          {showBack && (
            <button
              type="button"
              onClick={handleBack}
              aria-label="Back"
              style={{ ...btnStyle, padding: "10px 14px", background: "rgba(255,255,255,0.2)" }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>{"←"}</span>
              Back
            </button>
          )}
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", opacity: 0.7, marginBottom: 4 }}>
              {eyebrow}
            </div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{title}</h1>
          </div>
        </div>

        {!hideSearch && setPage && (
          <div style={{ flex: "1 1 280px", minWidth: 240, maxWidth: 480 }}>
            <SearchBar setPage={setPage} />
          </div>
        )}

        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          {stats.map((s, i) => (
            <div key={i} style={tileStyle}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>{s.value}</span>
              <span style={{ opacity: 0.85 }}>{s.label}</span>
            </div>
          ))}

          {setPage && (
            <>
              <button
                type="button"
                onClick={() => setPage("admin")}
                style={{ ...btnStyle, background: isActive("admin") ? "rgba(255,255,255,0.3)" : btnStyle.background }}
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => setPage("reports")}
                style={{ ...btnStyle, background: isActive("reports") ? "rgba(255,255,255,0.3)" : btnStyle.background }}
              >
                Reports
              </button>
              <button
                type="button"
                onClick={() => setPage("cms")}
                style={{ ...btnStyle, background: isActive("cms") ? "rgba(255,255,255,0.3)" : btnStyle.background }}
              >
                CMS
              </button>

              <div ref={extrasRef} style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setExtrasOpen((o) => !o)}
                  style={{
                    ...btnStyle,
                    background: EXTRAS.some((e) => isActive(e.key))
                      ? "rgba(255,255,255,0.3)"
                      : btnStyle.background,
                  }}
                >
                  More ▾
                </button>
                {extrasOpen && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 6px)", right: 0,
                    background: "white", color: "#1e293b", borderRadius: 10,
                    boxShadow: "0 12px 40px rgba(0,0,0,0.18)", minWidth: 180,
                    zIndex: 1100, padding: 6,
                  }}>
                    {EXTRAS.map((e) => (
                      <button
                        key={e.key}
                        onClick={() => { setExtrasOpen(false); setPage(e.page); }}
                        style={{
                          display: "block", width: "100%", textAlign: "left",
                          padding: "10px 12px", borderRadius: 6, border: "none",
                          background: isActive(e.key) ? "#eff6ff" : "transparent",
                          color: "#1e293b", cursor: "pointer", fontSize: 14, fontWeight: 500,
                          fontFamily: "inherit",
                        }}
                        onMouseEnter={(ev) => { if (!isActive(e.key)) ev.currentTarget.style.background = "#f8fafc"; }}
                        onMouseLeave={(ev) => { if (!isActive(e.key)) ev.currentTarget.style.background = "transparent"; }}
                      >
                        {e.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {user && <NotificationsBell user={user} setPage={setPage} />}

          {onLogout && (
            <button type="button" onClick={onLogout} style={btnStyle}>
              Logout
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
