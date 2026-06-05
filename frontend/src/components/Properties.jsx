import { useEffect, useState } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { apiFetch } from "../utils/api";

const formatPrice = (price) => `$${Number(price || 0).toLocaleString()}`;

const getTag = (index) => {
  if (index === 0) return "New";
  if (index === 1) return "Featured";
  return "For Sale";
};

export default function Properties({ setPage, user, showToast }) {
  const [properties, setProperties] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProperties = async () => {
      try {
        const data = await apiFetch("/properties?status=available");
        setProperties((data.properties || []).slice(0, 6));
      } catch {
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, []);

  useEffect(() => {
    const loadFavorites = async () => {
      if (user?.role !== "buyer") {
        setFavoriteIds([]);
        return;
      }

      try {
        const data = await apiFetch("/favorites");
        setFavoriteIds((data.favorites || []).map((property) => property.id));
      } catch {
        setFavoriteIds([]);
      }
    };

    loadFavorites();
  }, [user]);

  const openFavorites = () => {
    if (!user) {
      showToast?.("Please sign in as a buyer to open favorites.", "error");
      setPage("login");
      return;
    }

    if (user.role !== "buyer") {
      showToast?.("Favorites are available for buyer accounts.", "error");
      return;
    }

    localStorage.setItem("dashboardView", "favorites");
    setPage("dashboard");
  };

  const handleToggleFavorite = async (propertyId) => {
    if (!user) {
      showToast?.("Please sign in as a buyer to save favorites.", "error");
      setPage("login");
      return;
    }

    if (user.role !== "buyer") {
      showToast?.("Only buyer accounts can use favorites.", "error");
      return;
    }

    const isFavorite = favoriteIds.includes(propertyId);

    try {
      await apiFetch(`/favorites/${propertyId}`, {
        method: isFavorite ? "DELETE" : "POST",
      });

      setFavoriteIds((prev) =>
        isFavorite ? prev.filter((id) => id !== propertyId) : [...prev, propertyId]
      );

      showToast?.(
        isFavorite ? "Property removed from favorites." : "Property added to favorites.",
        "success"
      );
    } catch (err) {
      showToast?.(err.message, "error");
    }
  };

  return (
    <section className="section" id="properties">
      <div className="properties-header">
        <div>
          <p className="section-label">Our Listings</p>
          <h2 className="section-title" style={{ marginBottom: 0 }}>Featured Properties</h2>
        </div>

        <div className="properties-header-actions">
          {user?.role === "buyer" && (
            <button
              className="nav-icon-btn landing-heart-btn"
              onClick={openFavorites}
              aria-label="Open favorites"
              title="My favorites"
            >
              <FaHeart />
            </button>
          )}

          <button className="btn-ghost" onClick={() => setPage("properties")}>
            View All Listings -&gt;
          </button>
        </div>
      </div>

      {loading ? (
        <p className="loading-text">Loading properties...</p>
      ) : (
        <div className="properties-grid">
          {properties.map((property, index) => {
            const isFavorite = favoriteIds.includes(property.id);
            const tag = getTag(index);

            return (
              <div className="prop-card" key={property.id}>
                <div className="prop-img-wrap">
                  {property.image_url ? (
                    <img src={property.image_url} alt={property.title} />
                  ) : (
                    <div className="prop-card-placeholder">Home</div>
                  )}

                  <span className={`prop-tag${tag === "New" ? " new" : tag === "Featured" ? " featured" : ""}`}>
                    {tag}
                  </span>

                  <button
                    className={`prop-favorite-btn ${isFavorite ? "active" : ""}`}
                    onClick={() => handleToggleFavorite(property.id)}
                    type="button"
                    aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                    title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    {isFavorite ? <FaHeart /> : <FaRegHeart />}
                  </button>
                </div>

                <div className="prop-body">
                  <p className="prop-type">{property.type}</p>
                  <h3 className="prop-title">{property.title}</h3>
                  <p className="prop-location">{property.location}</p>
                </div>

                <div className="prop-meta">
                  <div className="prop-meta-item">Seller <span>{property.seller_name || "Unknown"}</span></div>
                  <div className="prop-meta-item">Status <span>{property.status}</span></div>
                </div>

                <div className="prop-footer">
                  <span className="prop-price">{formatPrice(property.price)}</span>
                  <button
                    className="btn-view"
                    onClick={() => setPage("property-detail", { id: property.id })}
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
