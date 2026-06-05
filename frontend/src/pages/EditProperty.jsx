import { useState } from "react";
import { apiFetch } from "../utils/api";

export default function EditProperty({ property, setPage, showToast }) {
  const [form, setForm] = useState({
    title:       property?.title       || "",
    description: property?.description || "",
    price:       property?.price       || "",
    location:    property?.location    || "",
    type:        property?.type        || "",
    status:      property?.status      || "available",
    image_url:   property?.image_url   || "",
  });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    setError("");
    if (!form.title || !form.price || !form.location || !form.type)
      return setError("Title, price, location and type are required.");

    setLoading(true);
    try {
      await apiFetch(`/properties/${property.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...form, price: parseFloat(form.price) }),
      });
      showToast("Property updated successfully! ✅", "success");
      setPage("myProperties");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!property) {
    return (
      <div className="dashboard">
        <div className="dash-body">
          <div className="alert alert-error">No property selected. <a onClick={() => setPage("myProperties")} style={{ cursor: "pointer", color: "var(--primary)" }}>Go back</a></div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 className="dash-welcome">Edit Property</h2>
            <p className="dash-sub">Update the details for: <strong>{property.title}</strong></p>
          </div>
          <button className="btn-secondary" style={{ color: "var(--text)" }} onClick={() => setPage("myProperties")}>← Back</button>
        </div>
      </div>

      <div className="dash-body">
        <div className="profile-card" style={{ maxWidth: 680 }}>
          {error && <div className="alert alert-error">⚠️ {error}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1.25rem" }}>
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label">Title *</label>
              <input className="form-input" value={form.title} onChange={e => set("title", e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Price (USD) *</label>
              <input className="form-input" type="number" value={form.price} onChange={e => set("price", e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Location *</label>
              <input className="form-input" value={form.location} onChange={e => set("location", e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Type *</label>
              <select className="form-select" value={form.type} onChange={e => set("type", e.target.value)}>
                <option value="">Select type…</option>
                <option value="Apartment">Apartment</option>
                <option value="House">House</option>
                <option value="Villa">Villa</option>
                <option value="Studio">Studio</option>
                <option value="Office">Office</option>
                <option value="Land">Land</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => set("status", e.target.value)}>
                <option value="available">Available</option>
                <option value="sold">Sold</option>
                <option value="rented">Rented</option>
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label">Image URL</label>
              <input className="form-input" value={form.image_url} onChange={e => set("image_url", e.target.value)} />
            </div>

            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label">Description</label>
              <textarea className="form-input" rows={4} style={{ resize: "vertical" }}
                value={form.description} onChange={e => set("description", e.target.value)} />
            </div>
          </div>

          <button className="btn-submit" onClick={handleSubmit} disabled={loading}>
            {loading ? <><span className="spinner" /> Saving…</> : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}