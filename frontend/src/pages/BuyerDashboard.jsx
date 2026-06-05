import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";
import BuyerSubnav from "../components/BuyerSubnav";

const formatPrice = (price) => `$${Number(price || 0).toLocaleString()}`;

function PropertyCard({ property, isFavorite, onToggleFavorite, actionLabel, actionClass = "btn-primary" }) {
  return (
    <div className="buyer-prop-card">
      <div className="buyer-prop-img">
        {property.image_url ? (
          <img src={property.image_url} alt={property.title} />
        ) : (
          <div className="buyer-prop-img-placeholder">Home</div>
        )}
        <span className={`buyer-prop-status ${property.status}`}>{property.status}</span>
      </div>

      <div className="buyer-prop-body">
        <div className="buyer-prop-top">
          <div>
            <p className="buyer-prop-type">{property.type}</p>
            <h3 className="buyer-prop-title">{property.title}</h3>
          </div>
          <button
            className={`favorite-icon-btn ${isFavorite ? "active" : ""}`}
            onClick={() => onToggleFavorite(property.id, isFavorite)}
            type="button"
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            {isFavorite ? "Saved" : "Save"}
          </button>
        </div>

        <p className="buyer-prop-location">{property.location}</p>
        <p className="buyer-prop-desc">{property.description || "No description available for this property yet."}</p>

        <div className="buyer-prop-meta">
          <span>{formatPrice(property.price)}</span>
          <span>{property.seller_name || "Unknown seller"}</span>
        </div>
      </div>

      <div className="buyer-prop-actions">
        <button className={actionClass} onClick={() => onToggleFavorite(property.id, isFavorite)} type="button">
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

export default function BuyerDashboard({ user, setPage, setRootPage, onLogout, showToast }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch("/buyer/dashboard");
      setDashboard(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleToggleFavorite = async (propertyId, isFavorite) => {
    try {
      await apiFetch(`/favorites/${propertyId}`, { method: isFavorite ? "DELETE" : "POST" });

      setDashboard((prev) => {
        if (!prev) return prev;

        const latestProperties = prev.latestProperties.map((property) =>
          property.id === propertyId
            ? { ...property, is_favorite: !isFavorite }
            : property
        );

        const favoriteProperty = prev.latestProperties.find((property) => property.id === propertyId);
        const nextFavorites = isFavorite
          ? prev.favorites.filter((property) => property.id !== propertyId)
          : favoriteProperty
            ? [{ ...favoriteProperty, favorite_id: Date.now(), is_favorite: true }, ...prev.favorites].slice(0, 6)
            : prev.favorites;

        return {
          ...prev,
          latestProperties,
          favorites: nextFavorites,
        };
      });

      showToast(
        isFavorite ? "Property removed from favorites." : "Property added to favorites.",
        "success"
      );
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const buyer = dashboard?.buyer;
  const favorites = dashboard?.favorites || [];
  const latestProperties = dashboard?.latestProperties || [];
  const joinDate = buyer?.created_at
    ? new Date(buyer.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "-";
  const initials = user?.name?.split(" ").map((word) => word[0]).join("").toUpperCase().slice(0, 2) || "B";

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
          activeTab="main"
          onChange={setPage}
          onGoHome={() => setRootPage("home")}
          onLogout={onLogout}
        />
      </div>

      <div className="dash-body">
        <div className="dash-cards">
          <div className="dash-card">
            <div className="dash-card-label">Saved Properties</div>
            <div className="dash-card-value blue">{favorites.length}</div>
          </div>
          <div className="dash-card">
            <div className="dash-card-label">Latest Available</div>
            <div className="dash-card-value green">{latestProperties.length}</div>
          </div>
          <div className="dash-card">
            <div className="dash-card-label">Role</div>
            <div className="dash-card-value blue" style={{ textTransform: "capitalize" }}>{buyer?.role || "buyer"}</div>
          </div>
          <div className="dash-card">
            <div className="dash-card-label">Member Since</div>
            <div className="dash-card-value" style={{ fontSize: "1.2rem" }}>{joinDate}</div>
          </div>
        </div>

        {loading && <p className="loading-text">Loading buyer dashboard...</p>}
        {error && <div className="alert alert-error">{error}</div>}

        {!loading && !error && buyer && (
          <div className="buyer-dashboard-grid">
            <div className="profile-card buyer-profile-card">
              <p className="profile-card-title">Buyer Account</p>
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
                  <span className="profile-key">Saved Properties</span>
                  <span className="profile-val">{favorites.length}</span>
                </div>
                <div className="profile-row">
                  <span className="profile-key">Available Listings</span>
                  <span className="profile-val">{latestProperties.length}</span>
                </div>
              </div>
            </div>

            <div className="buyer-section-card">
              <div className="buyer-section-head">
                <div>
                  <p className="profile-card-title" style={{ marginBottom: 0, paddingBottom: 0, borderBottom: "none" }}>Favorite Properties</p>
                  <p className="dash-sub">Quick view of your saved listings.</p>
                </div>
                <button className="btn-ghost" onClick={() => setPage("favorites")}>View All</button>
              </div>

              {favorites.length === 0 ? (
                <div className="buyer-empty-state">
                  <p>No favorites yet.</p>
                  <span>Save a property from the latest listings section to see it here.</span>
                </div>
              ) : (
                <div className="buyer-mini-list">
                  {favorites.map((property) => (
                    <div key={property.favorite_id || property.id} className="buyer-mini-item">
                      <div>
                        <p className="buyer-mini-title">{property.title}</p>
                        <p className="buyer-mini-sub">{property.location} - {formatPrice(property.price)}</p>
                      </div>
                      <button
                        className="btn-edit"
                        onClick={() => handleToggleFavorite(property.id, true)}
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="buyer-section-block">
            <div className="buyer-section-head" style={{ marginBottom: "1.25rem" }}>
              <div>
                <h3 className="buyer-section-title">Latest Available Properties</h3>
                <p className="dash-sub">Fresh listings buyers can save directly from the dashboard.</p>
              </div>
            </div>

            {latestProperties.length === 0 ? (
              <div className="buyer-empty-state">
                <p>No available properties right now.</p>
                <span>Once sellers publish new listings, they will appear here.</span>
              </div>
            ) : (
              <div className="buyer-card-grid">
                {latestProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    isFavorite={property.is_favorite}
                    onToggleFavorite={handleToggleFavorite}
                    actionLabel={property.is_favorite ? "Remove Favorite" : "Add to Favorites"}
                    actionClass={property.is_favorite ? "btn-delete" : "btn-primary"}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
