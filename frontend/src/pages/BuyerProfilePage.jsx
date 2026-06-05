import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";
import BuyerSubnav from "../components/BuyerSubnav";

export default function BuyerProfilePage({ user, setPage, setRootPage, onLogout, showToast }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await apiFetch("/buyer/dashboard");
        setProfile(data);
      } catch (err) {
        setError(err.message);
        showToast?.(err.message, "error");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [showToast]);

  const buyer = profile?.buyer;
  const favoritesCount = profile?.favorites?.length || 0;
  const latestCount = profile?.latestProperties?.length || 0;
  const initials = buyer?.name?.split(" ").map((word) => word[0]).join("").toUpperCase().slice(0, 2) || "B";
  const joinDate = buyer?.created_at
    ? new Date(buyer.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "-";

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div className="dashboard-brand-row">
          <div className="dashboard-brand" onClick={() => setRootPage("home")}>
            <div className="brand-logo">
              <div className="logo-dot" />
            </div>
            <span className="brand-name">UrbanKeys</span>
          </div>
          <button className="btn-ghost" onClick={() => setRootPage("home")}>Home</button>
        </div>

        <div className="buyer-header-row">
          <div>
            <h2 className="dash-welcome">Buyer Dashboard</h2>
            <p className="dash-sub">Track your account, saved properties, and the newest available listings.</p>
          </div>
        </div>

        <BuyerSubnav
          activeTab="profile"
          onChange={setPage}
          onGoHome={() => setRootPage("home")}
          onLogout={onLogout}
        />
      </div>

      <div className="dash-body">
        {loading && <p className="loading-text">Loading profile...</p>}
        {error && <div className="alert alert-error">{error}</div>}

        {!loading && !error && buyer && (
          <div className="buyer-profile-layout">
            <div className="profile-card buyer-profile-card">
              <p className="profile-card-title">Buyer Profile</p>
              <div className="profile-top">
                <div className="profile-avatar">{initials}</div>
                <div>
                  <p className="profile-name">{buyer.name}</p>
                  <p className="profile-email">{buyer.email}</p>
                  <span className="profile-role-badge buyer-role-badge">buyer</span>
                </div>
              </div>

              <div className="profile-details">
                <div className="profile-row">
                  <span className="profile-key">User ID</span>
                  <span className="profile-val">#{buyer.id}</span>
                </div>
                <div className="profile-row">
                  <span className="profile-key">Email</span>
                  <span className="profile-val">{buyer.email}</span>
                </div>
                <div className="profile-row">
                  <span className="profile-key">Member Since</span>
                  <span className="profile-val">{joinDate}</span>
                </div>
              </div>
            </div>

            <div className="buyer-section-card">
              <div className="buyer-section-head">
                <div>
                  <h3 className="buyer-section-title">Account Snapshot</h3>
                  <p className="dash-sub">A quick look at your buyer activity and available content.</p>
                </div>
              </div>

              <div className="buyer-stats-grid">
                <div className="dash-card">
                  <div className="dash-card-label">Saved Properties</div>
                  <div className="dash-card-value blue">{favoritesCount}</div>
                </div>
                <div className="dash-card">
                  <div className="dash-card-label">Latest Listings</div>
                  <div className="dash-card-value green">{latestCount}</div>
                </div>
                <div className="dash-card">
                  <div className="dash-card-label">Account Type</div>
                  <div className="dash-card-value blue" style={{ textTransform: "capitalize" }}>{buyer.role}</div>
                </div>
              </div>

              <div className="buyer-profile-actions">
                <button className="btn-primary" onClick={() => setPage("favorites")}>Go to Favorites</button>
                <button className="btn-ghost" onClick={() => setPage("main")}>Back to Overview</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
