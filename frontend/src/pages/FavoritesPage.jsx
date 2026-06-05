import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";
import BuyerSubnav from "../components/BuyerSubnav";

const formatPrice = (price) => `$${Number(price || 0).toLocaleString()}`;

export default function FavoritesPage({ setPage, setRootPage, onLogout, showToast }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadFavorites = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch("/favorites");
      setFavorites(data.favorites);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const handleRemove = async (propertyId) => {
    try {
      await apiFetch(`/favorites/${propertyId}`, { method: "DELETE" });
      setFavorites((prev) => prev.filter((property) => property.id !== propertyId));
      showToast("Property removed from favorites.", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

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
          activeTab="favorites"
          onChange={setPage}
          onGoHome={() => setRootPage("home")}
          onLogout={onLogout}
        />
      </div>

      <div className="dash-body">
        <div className="buyer-section-head" style={{ marginBottom: "1.25rem" }}>
          <div>
            <h3 className="buyer-section-title">My Favorites</h3>
            <p className="dash-sub">All properties saved by the buyer account.</p>
          </div>
        </div>

        {loading && <p className="loading-text">Loading favorite properties...</p>}
        {error && <div className="alert alert-error">{error}</div>}

        {!loading && !error && favorites.length === 0 && (
          <div className="buyer-empty-state">
            <p>No saved properties yet.</p>
            <span>Use the buyer dashboard to add available listings to your favorites.</span>
          </div>
        )}

        {!loading && !error && favorites.length > 0 && (
          <div className="buyer-card-grid">
            {favorites.map((property) => (
              <div key={property.favorite_id || property.id} className="buyer-prop-card">
                <div className="buyer-prop-img">
                  {property.image_url ? (
                    <img src={property.image_url} alt={property.title} />
                  ) : (
                    <div className="buyer-prop-img-placeholder">Home</div>
                  )}
                  <span className={`buyer-prop-status ${property.status}`}>{property.status}</span>
                </div>

                <div className="buyer-prop-body">
                  <p className="buyer-prop-type">{property.type}</p>
                  <h3 className="buyer-prop-title">{property.title}</h3>
                  <p className="buyer-prop-location">{property.location}</p>
                  <p className="buyer-prop-desc">{property.description || "No description available for this property yet."}</p>

                  <div className="buyer-prop-meta">
                    <span>{formatPrice(property.price)}</span>
                    <span>{property.seller_name || property.seller_email || "Unknown seller"}</span>
                  </div>
                </div>

                <div className="buyer-prop-actions">
                  <button className="btn-delete" onClick={() => handleRemove(property.id)} type="button">
                    Remove from Favorites
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
