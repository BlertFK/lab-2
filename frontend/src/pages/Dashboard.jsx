import { useState, useEffect } from "react";
import { apiFetch } from "../utils/api";
import Navbar from "../components/Navbar";
import SellerDashboard from "./SellerDashboard";  
import MyProperties from "./MyProperties";         
import AddProperty from "./AddProperty";           
import EditProperty from "./EditProperty";         
import BuyerDashboard from "./BuyerDashboard";
import FavoritesPage from "./FavoritesPage";
import BuyerProfilePage from "./BuyerProfilePage";
import SellerMessagesPage from "./SellerMessagesPage";

export default function Dashboard({ user, setPage: setRootPage, onLogout, showToast }) {
  const [innerPage, setInnerPage] = useState(() => localStorage.getItem("dashboardView") || "main");
  const [editTarget, setEditTarget] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await apiFetch("/auth/me");
        setProfile(data.user);
      } catch (err) {
        setApiError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    if (user?.role !== "buyer") {
      localStorage.removeItem("dashboardView");
      return;
    }

    localStorage.setItem("dashboardView", innerPage);
  }, [innerPage, user]);

  if (user?.role === "seller") {
    if (innerPage === "sellerDashboard" || innerPage === "main") {
      return <SellerDashboard user={user} setPage={setInnerPage} setRootPage={setRootPage} onLogout={onLogout} />;
    }
    if (innerPage === "myProperties") {
      return <MyProperties setPage={setInnerPage} setEditTarget={setEditTarget} showToast={showToast} />;
    }
    if (innerPage === "addProperty") {
      return <AddProperty setPage={setInnerPage} showToast={showToast} />;
    }
    if (innerPage === "editProperty") {
      return <EditProperty property={editTarget} setPage={setInnerPage} showToast={showToast} />;
    }
    if (innerPage === "sellerMessages") {
      return <SellerMessagesPage user={user} setPage={setInnerPage} setRootPage={setRootPage} onLogout={onLogout} showToast={showToast}/>;
}
  }

  if (user?.role === "buyer") {
    if (innerPage === "favorites") {
      return <FavoritesPage setPage={setInnerPage} setRootPage={setRootPage} onLogout={onLogout} showToast={showToast} />;
    }

    if (innerPage === "profile") {
      return (
        <BuyerProfilePage
          user={user}
          setPage={setInnerPage}
          setRootPage={setRootPage}
          onLogout={onLogout}
          showToast={showToast}
        />
      );
    }

    return (
      <BuyerDashboard
        user={user}
        setPage={setInnerPage}
        setRootPage={setRootPage}
        onLogout={onLogout}
        showToast={showToast}
      />
    );
  }

  const initials = user?.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "U";
  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "—";
  const roleColor = { admin: "#7c3aed", buyer: "#2563eb", seller: "#059669" }[profile?.role] || "#2563eb";
  const token = localStorage.getItem("token");

  return (
    <div className="dashboard">
      <Navbar page="dashboard" setPage={setRootPage} user={user} onLogout={onLogout} />

      <div className="dash-header">
        <h2 className="dash-welcome">Welcome back, {user?.name?.split(" ")[0]} 👋</h2>
        <p className="dash-sub">Account authenticated via JWT.</p>
      </div>

      <div className="dash-body">
        <div className="dash-cards">
          {[
            { label: "Saved Properties", value: "4", cls: "blue" },
            { label: "Active Listings", value: user?.role === "seller" ? "2" : "0", cls: "green" },
            { label: "Inquiries Sent", value: "7", cls: "" },
            { label: "Account Role", value: user?.role, cls: "blue" },
          ].map(c => (
            <div className="dash-card" key={c.label}>
              <div className="dash-card-label">{c.label}</div>
              <div className={`dash-card-value ${c.cls}`} style={{ textTransform: "capitalize" }}>
                {c.value}
              </div>
            </div>
          ))}
        </div>

        {loading && <p className="loading-text">⏳ Fetching profile from API...</p>}

        {apiError && (
          <div className="alert alert-error">
            ⚠️ API error: {apiError}. (Check if backend is running on port 5000)
          </div>
        )}

        {profile && (
          <div className="profile-card">
            <p className="profile-card-title">Backend Profile Data (MySQL)</p>
            <div className="profile-top">
              <div className="profile-avatar">{initials}</div>
              <div>
                <p className="profile-name">{profile.name}</p>
                <p className="profile-email">{profile.email}</p>
                <span className="profile-role-badge" style={{ background: `${roleColor}18`, color: roleColor }}>
                  {profile.role}
                </span>
              </div>
            </div>
            <div className="profile-details">
              {[
                ["User ID", `#${profile.id}`],
                ["Member Since", joinDate],
                ["JWT Token", token ? `${token.slice(0, 20)}...` : "—"],
              ].map(([k, v]) => (
                <div className="profile-row" key={k}>
                  <span className="profile-key">{k}</span>
                  <span className="profile-val">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
