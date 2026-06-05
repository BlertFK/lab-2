import { useState, useEffect } from "react";
import { apiFetch } from "../utils/api";

export default function MyProperties({ setPage, setEditTarget, showToast }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProperties = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/properties/my");
      setProperties(data.properties);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProperties(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this property? This cannot be undone.")) return;
    try {
      await apiFetch(`/properties/${id}`, { method: "DELETE" });
      showToast("Property deleted successfully.", "success");
      setProperties(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleEdit = (property) => {
    setEditTarget(property);
    setPage("editProperty");
  };

  const statusColor = { available: "#059669", sold: "#dc2626", rented: "#d97706" };

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2 className="dash-welcome">My Properties</h2>
            <p className="dash-sub">Manage your listings below.</p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button className="btn-primary" onClick={() => setPage("addProperty")}>+ Add Property</button>
            <button className="btn-secondary" style={{ color: "var(--text)" }} onClick={() => setPage("sellerDashboard")}>← Dashboard</button>
          </div>
        </div>
      </div>

      <div className="dash-body">
        {loading && <p className="loading-text">⏳ Loading your properties...</p>}
        {error && <div className="alert alert-error">⚠️ {error}</div>}
        {!loading && !error && properties.length === 0 && (
          <div className="profile-card" style={{ textAlign: "center", padding: "3rem" }}>
            <p style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🏠</p>
            <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>No properties yet</p>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>Start by adding your first listing.</p>
            <button className="btn-primary" onClick={() => setPage("addProperty")}>Add Property</button>
          </div>
        )}

        {properties.length > 0 && (
          <div className="seller-grid">
            {properties.map(p => (
              <div key={p.id} className="seller-prop-card">
                <div className="seller-prop-img">
                  {p.image_url
                    ? <img src={p.image_url} alt={p.title} />
                    : <div className="seller-prop-img-placeholder">🏠</div>
                  }
                  <span className="seller-prop-status" style={{ background: `${statusColor[p.status]}18`, color: statusColor[p.status] }}>
                    {p.status}
                  </span>
                </div>
                <div className="seller-prop-body">
                  <p className="seller-prop-title">{p.title}</p>
                  <p className="seller-prop-location">📍 {p.location}</p>
                  <p className="seller-prop-price">${Number(p.price).toLocaleString()}</p>
                  <p className="seller-prop-type">{p.type}</p>
                </div>
                <div className="seller-prop-actions">
                  <button className="btn-edit" onClick={() => handleEdit(p)}>✏️ Edit</button>
                  <button className="btn-delete" onClick={() => handleDelete(p.id)}>🗑 Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}