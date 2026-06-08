import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";

const EMPTY_FORM = { title: "", description: "", price: "", location: "", type: "", status: "available", image_url: "" };
const STEPS = ["Basics", "Media", "Amenities"];

export default function AddProperty({ setPage, showToast }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [step, setStep] = useState(0);
  const [imageRows, setImageRows] = useState([{ image_url: "", caption: "" }]);
  const [amenities, setAmenities] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const setImageRow = (index, field, value) => {
    setImageRows((prev) => prev.map((row, rowIndex) => (
      rowIndex === index ? { ...row, [field]: value } : row
    )));
  };
  const toggleAmenity = (id) => {
    setSelectedAmenities((prev) => (
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    ));
  };

  useEffect(() => {
    const loadAmenities = async () => {
      try {
        const data = await apiFetch("/amenities");
        setAmenities(data.amenities || []);
      } catch {
        setAmenities([]);
      }
    };

    loadAmenities();
  }, []);

  const validateBasics = () => {
    if (!form.title || !form.price || !form.location || !form.type) {
      setError("Title, price, location and type are required.");
      return false;
    }

    setError("");
    return true;
  };

  const goNext = () => {
    if (step === 0 && !validateBasics()) return;
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const goBack = () => setStep((current) => Math.max(current - 1, 0));

  const handleSubmit = async () => {
    setError("");
    if (!validateBasics()) return;

    setLoading(true);
    try {
      const data = await apiFetch("/properties", {
        method: "POST",
        body: JSON.stringify({ ...form, price: parseFloat(form.price) }),
      });

      const propertyId = data.property?.id || data.propertyId;
      const imagesToAttach = [
        { image_url: form.image_url, caption: "", is_primary: true },
        ...imageRows.map((row) => ({ ...row, is_primary: false })),
      ].filter((row) => row.image_url?.trim());

      if (propertyId) {
        const attachmentJobs = [
          ...imagesToAttach.map((row, index) => apiFetch(`/properties/${propertyId}/images`, {
            method: "POST",
            body: JSON.stringify({
              image_url: row.image_url.trim(),
              caption: row.caption || null,
              is_primary: index === 0,
              sort_order: index,
            }),
          })),
          ...selectedAmenities.map((amenityId) => apiFetch(`/properties/${propertyId}/amenities`, {
            method: "POST",
            body: JSON.stringify({ amenity_id: amenityId }),
          })),
        ];

        const results = await Promise.allSettled(attachmentJobs);
        const failed = results.filter((result) => result.status === "rejected").length;
        if (failed > 0) {
          showToast(`Property created, but ${failed} attachment${failed === 1 ? "" : "s"} failed.`, "error");
        } else {
          showToast("Property created successfully!", "success");
        }
      } else {
        showToast("Property created successfully!", "success");
      }

      setPage("myProperties");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 className="dash-welcome">Add Property</h2>
            <p className="dash-sub">Fill in the details of your new listing.</p>
          </div>
          <button className="btn-secondary" style={{ color: "var(--text)" }} onClick={() => setPage("myProperties")}>← Back</button>
        </div>
      </div>

      <div className="dash-body">
        <div className="profile-card" style={{ maxWidth: 680 }}>
          {error && <div className="alert alert-error">⚠️ {error}</div>}

          <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem", flexWrap: "wrap" }}>
            {STEPS.map((label, index) => (
              <button
                key={label}
                type="button"
                className={index === step ? "btn-primary" : "btn-ghost"}
                onClick={() => {
                  if (index > 0 && !validateBasics()) return;
                  setStep(index);
                }}
              >
                {index + 1}. {label}
              </button>
            ))}
          </div>

          {step === 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1.25rem" }}>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Title *</label>
                <input className="form-input" placeholder="e.g. Modern 2BR Apartment in City Center"
                  value={form.title} onChange={e => set("title", e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Price (USD) *</label>
                <input className="form-input" type="number" placeholder="e.g. 250000"
                  value={form.price} onChange={e => set("price", e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Location *</label>
                <input className="form-input" placeholder="e.g. Pristina, Kosovo"
                  value={form.location} onChange={e => set("location", e.target.value)} />
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
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={4} placeholder="Describe the property…"
                  style={{ resize: "vertical" }}
                  value={form.description} onChange={e => set("description", e.target.value)} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="form-group">
                <label className="form-label">Primary Image URL</label>
                <input className="form-input" placeholder="https://example.com/photo.jpg"
                  value={form.image_url} onChange={e => set("image_url", e.target.value)} />
              </div>

              {imageRows.map((row, index) => (
                <div key={index} style={{ display: "grid", gridTemplateColumns: "1fr 180px", gap: "0 1rem" }}>
                  <div className="form-group">
                    <label className="form-label">Additional Image URL</label>
                    <input className="form-input" placeholder="https://example.com/another-photo.jpg"
                      value={row.image_url} onChange={e => setImageRow(index, "image_url", e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Caption</label>
                    <input className="form-input" placeholder="Living room"
                      value={row.caption} onChange={e => setImageRow(index, "caption", e.target.value)} />
                  </div>
                </div>
              ))}

              <button
                className="btn-ghost"
                type="button"
                onClick={() => setImageRows((prev) => [...prev, { image_url: "", caption: "" }])}
              >
                Add another image
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="dash-sub" style={{ marginBottom: "1rem" }}>
                Select amenities to attach after the property is created.
              </p>

              {amenities.length === 0 ? (
                <div className="buyer-empty-state compact">
                  <p>No amenities available.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
                  {amenities.map((amenity) => (
                    <label key={amenity.id} style={{ display: "flex", gap: 10, alignItems: "center", border: "1px solid var(--border)", borderRadius: 10, padding: "0.75rem", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={selectedAmenities.includes(amenity.id)}
                        onChange={() => toggleAmenity(amenity.id)}
                      />
                      <span style={{ color: "var(--text)", fontWeight: 600 }}>{amenity.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
            {step > 0 && (
              <button className="btn-ghost" type="button" onClick={goBack} disabled={loading}>Back</button>
            )}
            {step < STEPS.length - 1 ? (
              <button className="btn-submit" type="button" onClick={goNext}>Continue</button>
            ) : (
              <button className="btn-submit" onClick={handleSubmit} disabled={loading}>
                {loading ? <><span className="spinner" /> Creating…</> : "Create Property"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
