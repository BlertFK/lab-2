import { useState, useEffect } from "react";
import { apiFetch } from "../utils/api";

import Footer from "../components/Footer";

const DEFAULT_IMG = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80";

export default function PropertyDetails({ property, setPage, user }) {
  const [details, setDetails] = useState(property || null);
  const [loading, setLoading] = useState(!property);

  const [showForm, setShowForm] = useState(false);
  const [showViewingForm, setShowViewingForm] = useState(false);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [message, setMessage] = useState("");
  const [viewingForm, setViewingForm] = useState({ scheduled_at: "", duration_minutes: 30, notes: "" });
  const [offerForm, setOfferForm] = useState({ amount: "", message: "", expires_at: "" });
  const [sending, setSending] = useState(false);
  const [viewingSending, setViewingSending] = useState(false);
  const [offerSending, setOfferSending] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", comment: "" });
  const [reviewSending, setReviewSending] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [images, setImages] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [similarProperties, setSimilarProperties] = useState([]);
  const [selectedImage, setSelectedImage] = useState("");

  useEffect(() => {
    if (property?.id) {
      setLoading(true);
      apiFetch(`/properties/${property.id}`)
        .then((data) => { setDetails(data.property); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [property]);

  const loadReviews = async (propertyId) => {
    if (!propertyId) return;
    setReviewsLoading(true);
    setReviewError("");

    try {
      const data = await apiFetch(`/reviews/property/${propertyId}`);
      setReviews(data.reviews || []);
    } catch (err) {
      setReviewError(err.message || "Failed to load reviews.");
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (details?.id) loadReviews(details.id);
  }, [details?.id]);

  useEffect(() => {
    if (!details?.id) return;

    const loadPropertyExtras = async () => {
      try {
        const data = await apiFetch(`/properties/${details.id}/images`);
        const imageList = data.images || [];
        setImages(imageList);
        const primaryImage = imageList.find((image) => image.is_primary)?.image_url || imageList[0]?.image_url || details.image_url || DEFAULT_IMG;
        setSelectedImage(primaryImage);
      } catch {
        setImages([]);
        setSelectedImage(details.image_url || DEFAULT_IMG);
      }

      try {
        const data = await apiFetch(`/properties/${details.id}/amenities`);
        setAmenities(data.amenities || []);
      } catch {
        setAmenities([]);
      }

      if (!details.type) {
        setSimilarProperties([]);
        return;
      }

      try {
        const data = await apiFetch(`/properties?type=${encodeURIComponent(details.type)}&status=available`);
        setSimilarProperties((data.properties || []).filter((item) => item.id !== details.id).slice(0, 3));
      } catch {
        setSimilarProperties([]);
      }
    };

    loadPropertyExtras();
  }, [details?.id, details?.image_url, details?.type]);

  const statusColor = {
    available: { bg: "#d1fae5", color: "#065f46" },
    sold:      { bg: "#fee2e2", color: "#991b1b" },
    rented:    { bg: "#ede9fe", color: "#5b21b6" },
  };

  const handleSendMessage = async () => {
    setFormError("");
    setFormSuccess("");

    if (!message.trim()) {
      setFormError("Please enter a message before sending.");
      return;
    }

    setSending(true);
    try {
      await apiFetch("/messages", {
        method: "POST",
        body: JSON.stringify({ property_id: details.id, message: message.trim() }),
      });
      setFormSuccess("Your message was sent successfully! The seller will get back to you.");
      setMessage("");
      setShowForm(false);
    } catch (err) {
      setFormError(err.message || "Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleRequestViewing = async () => {
    setFormError("");
    setFormSuccess("");

    if (!viewingForm.scheduled_at) {
      setFormError("Please choose a viewing date and time.");
      return;
    }

    setViewingSending(true);
    try {
      await apiFetch("/viewings", {
        method: "POST",
        body: JSON.stringify({
          property_id: details.id,
          scheduled_at: viewingForm.scheduled_at,
          duration_minutes: Number(viewingForm.duration_minutes) || 30,
          notes: viewingForm.notes,
        }),
      });
      setFormSuccess("Viewing requested successfully.");
      setViewingForm({ scheduled_at: "", duration_minutes: 30, notes: "" });
      setShowViewingForm(false);
    } catch (err) {
      setFormError(err.message || "Failed to request viewing.");
    } finally {
      setViewingSending(false);
    }
  };

  const handleCreateOffer = async () => {
    setFormError("");
    setFormSuccess("");

    if (!offerForm.amount || Number(offerForm.amount) <= 0) {
      setFormError("Please enter an offer amount greater than 0.");
      return;
    }

    setOfferSending(true);
    try {
      await apiFetch("/offers", {
        method: "POST",
        body: JSON.stringify({
          property_id: details.id,
          amount: Number(offerForm.amount),
          currency: "EUR",
          message: offerForm.message,
          expires_at: offerForm.expires_at || null,
        }),
      });
      setFormSuccess("Offer submitted successfully.");
      setOfferForm({ amount: "", message: "", expires_at: "" });
      setShowOfferForm(false);
    } catch (err) {
      setFormError(err.message || "Failed to submit offer.");
    } finally {
      setOfferSending(false);
    }
  };

  const handleCreateReview = async () => {
    setReviewError("");
    setReviewSuccess("");

    if (!reviewForm.comment.trim()) {
      setReviewError("Please write a review comment.");
      return;
    }

    setReviewSending(true);
    try {
      await apiFetch("/reviews", {
        method: "POST",
        body: JSON.stringify({
          property_id: details.id,
          rating: Number(reviewForm.rating),
          title: reviewForm.title,
          comment: reviewForm.comment,
        }),
      });
      setReviewSuccess("Review posted successfully.");
      setReviewForm({ rating: 5, title: "", comment: "" });
      await loadReviews(details.id);
    } catch (err) {
      setReviewError(err.message || "Failed to post review.");
    } finally {
      setReviewSending(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', sans-serif", color: "#94a3b8", fontSize: 18 }}>
      Loading...
    </div>
  );

  if (!details) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', sans-serif", color: "#94a3b8" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏠</div>
        <p>Property not found.</p>
        <button onClick={() => setPage("properties")} style={{ marginTop: 12, padding: "10px 24px", background: "#2563eb", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>
          Go back
        </button>
      </div>
    </div>
  );

  const sc = statusColor[details.status] || statusColor.available;
  const isBuyer = user?.role === "buyer";

  return (
    <><div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', sans-serif" }}>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 40px 0" }}>
        <button onClick={() => setPage("properties")}
          style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 600, fontSize: 14, cursor: "pointer", padding: 0 }}>
          ← Back to list
        </button>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 40px 60px" }}>

        <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: images.length > 0 ? 12 : 28, height: 420 }}>
          <img
            src={selectedImage || details.image_url || DEFAULT_IMG}
            alt={details.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => { e.target.src = DEFAULT_IMG; } } />
        </div>

        {images.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 10, marginBottom: 28 }}>
            {images.map((image) => (
              <button
                key={image.id}
                onClick={() => setSelectedImage(image.image_url)}
                style={{
                  border: selectedImage === image.image_url ? "2px solid #2563eb" : "1px solid #e2e8f0",
                  borderRadius: 10,
                  cursor: "pointer",
                  overflow: "hidden",
                  padding: 0,
                  height: 82,
                  background: "white",
                }}
              >
                <img
                  src={image.image_url}
                  alt={image.caption || details.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  onError={(e) => { e.target.src = DEFAULT_IMG; }}
                />
              </button>
            ))}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 28 }}>

          {/* Left — Info */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <span style={{ background: "#e0f2fe", color: "#0369a1", borderRadius: 8, padding: "4px 12px", fontSize: 13, fontWeight: 600 }}>{details.type}</span>
              <span style={{ background: sc.bg, color: sc.color, borderRadius: 8, padding: "4px 12px", fontSize: 13, fontWeight: 600 }}>{details.status}</span>
            </div>

            <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 700, color: "#1e293b" }}>{details.title}</h1>
            <p style={{ margin: "0 0 20px", color: "#64748b", fontSize: 15 }}>📍 {details.location}</p>

            <div style={{ background: "white", borderRadius: 12, padding: "20px 24px", border: "1px solid #e2e8f0", marginBottom: 20 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "#1e293b" }}>Description</h3>
              <p style={{ margin: 0, color: "#475569", fontSize: 15, lineHeight: 1.6 }}>
                {details.description || "No description available for this property."}
              </p>
            </div>

            <div style={{ background: "white", borderRadius: 12, padding: "20px 24px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#1e293b" }}>Details</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  ["Type", details.type],
                  ["Status", details.status],
                  ["Location", details.location],
                  ["Posted on", new Date(details.created_at).toLocaleDateString("sq-AL")],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p style={{ margin: "0 0 2px", fontSize: 12, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>{label}</p>
                    <p style={{ margin: 0, fontSize: 14, color: "#1e293b", fontWeight: 600 }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {amenities.length > 0 && (
              <div style={{ background: "white", borderRadius: 12, padding: "20px 24px", border: "1px solid #e2e8f0", marginTop: 20 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#1e293b" }}>Amenities</h3>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {amenities.map((amenity) => (
                    <span key={amenity.id || amenity.amenity_id} style={{ background: "#f1f5f9", color: "#334155", borderRadius: 999, padding: "7px 12px", fontSize: 13, fontWeight: 600 }}>
                      {amenity.icon ? `${amenity.icon} ` : ""}{amenity.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right — Price + Contact + Seller */}
          <div>
            <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.06)", marginBottom: 20 }}>
              <p style={{ margin: "0 0 4px", fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>PRICE</p>
              <p style={{ margin: "0 0 20px", fontSize: 32, fontWeight: 700, color: "#2563eb" }}>
                Euro {Number(details.price).toLocaleString()}
              </p>

              {isBuyer ? (
                <>
                  {!showForm ? (
                    <button
                      style={{ width: "100%", padding: "12px 0", background: "#2563eb", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 10 }}
                      onMouseEnter={(e) => (e.target.style.background = "#1d4ed8")}
                      onMouseLeave={(e) => (e.target.style.background = "#2563eb")}
                      onClick={() => { setShowForm(true); setFormError(""); setFormSuccess(""); } }
                    >
                      ✉️ Contact Seller
                    </button>
                  ) : (
                    <div style={{ marginBottom: 10 }}>
                      <p style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 600, color: "#1e293b" }}>
                        Send a message to the seller:
                      </p>
                      <textarea
                        rows={4}
                        placeholder="Write your message here..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14, fontFamily: "'Segoe UI', sans-serif", resize: "vertical", boxSizing: "border-box", outline: "none" }} />
                      {formError && (
                        <p style={{ margin: "6px 0 0", fontSize: 13, color: "#dc2626" }}>{formError}</p>
                      )}
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <button
                          disabled={sending}
                          onClick={handleSendMessage}
                          style={{ flex: 1, padding: "10px 0", background: sending ? "#93c5fd" : "#2563eb", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: sending ? "not-allowed" : "pointer" }}
                        >
                          {sending ? "Sending..." : "Send"}
                        </button>
                        <button
                          onClick={() => { setShowForm(false); setFormError(""); setMessage(""); } }
                          style={{ flex: 1, padding: "10px 0", background: "white", color: "#64748b", border: "1px solid #cbd5e1", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer" }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {formSuccess && (
                    <p style={{ margin: "6px 0 10px", fontSize: 13, color: "#059669", background: "#d1fae5", padding: "8px 12px", borderRadius: 8 }}>
                      ✓ {formSuccess}
                    </p>
                  )}

                  <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                    <button
                      style={{ width: "100%", padding: "12px 0", background: "white", color: "#2563eb", border: "1px solid #2563eb", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: "pointer" }}
                      onClick={() => { setShowViewingForm((v) => !v); setShowOfferForm(false); setFormError(""); setFormSuccess(""); }}
                    >
                      Request Viewing
                    </button>
                    <button
                      style={{ width: "100%", padding: "12px 0", background: "white", color: "#2563eb", border: "1px solid #2563eb", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: "pointer" }}
                      onClick={() => { setShowOfferForm((v) => !v); setShowViewingForm(false); setFormError(""); setFormSuccess(""); }}
                    >
                      Make Offer
                    </button>
                  </div>

                  {showViewingForm && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #e2e8f0" }}>
                      <p style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Schedule a viewing</p>
                      <input
                        type="datetime-local"
                        value={viewingForm.scheduled_at}
                        onChange={(e) => setViewingForm((prev) => ({ ...prev, scheduled_at: e.target.value }))}
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, marginBottom: 8, fontSize: 14 }}
                      />
                      <input
                        type="number"
                        min="15"
                        step="15"
                        value={viewingForm.duration_minutes}
                        onChange={(e) => setViewingForm((prev) => ({ ...prev, duration_minutes: e.target.value }))}
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, marginBottom: 8, fontSize: 14 }}
                      />
                      <textarea
                        rows={3}
                        placeholder="Notes for the seller"
                        value={viewingForm.notes}
                        onChange={(e) => setViewingForm((prev) => ({ ...prev, notes: e.target.value }))}
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14, resize: "vertical" }}
                      />
                      {formError && <p style={{ margin: "8px 0 0", fontSize: 13, color: "#dc2626" }}>{formError}</p>}
                      <button
                        disabled={viewingSending}
                        onClick={handleRequestViewing}
                        style={{ width: "100%", marginTop: 10, padding: "10px 0", background: viewingSending ? "#93c5fd" : "#2563eb", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: viewingSending ? "not-allowed" : "pointer" }}
                      >
                        {viewingSending ? "Requesting..." : "Submit Viewing Request"}
                      </button>
                    </div>
                  )}

                  {showOfferForm && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #e2e8f0" }}>
                      <p style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Make an offer</p>
                      <input
                        type="number"
                        min="1"
                        placeholder="Amount in EUR"
                        value={offerForm.amount}
                        onChange={(e) => setOfferForm((prev) => ({ ...prev, amount: e.target.value }))}
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, marginBottom: 8, fontSize: 14 }}
                      />
                      <input
                        type="date"
                        value={offerForm.expires_at}
                        onChange={(e) => setOfferForm((prev) => ({ ...prev, expires_at: e.target.value }))}
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, marginBottom: 8, fontSize: 14 }}
                      />
                      <textarea
                        rows={3}
                        placeholder="Message with your offer"
                        value={offerForm.message}
                        onChange={(e) => setOfferForm((prev) => ({ ...prev, message: e.target.value }))}
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14, resize: "vertical" }}
                      />
                      {formError && <p style={{ margin: "8px 0 0", fontSize: 13, color: "#dc2626" }}>{formError}</p>}
                      <button
                        disabled={offerSending}
                        onClick={handleCreateOffer}
                        style={{ width: "100%", marginTop: 10, padding: "10px 0", background: offerSending ? "#93c5fd" : "#2563eb", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: offerSending ? "not-allowed" : "pointer" }}
                      >
                        {offerSending ? "Submitting..." : "Submit Offer"}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <button
                  style={{ width: "100%", padding: "12px 0", background: "#2563eb", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 10 }}
                  onMouseEnter={(e) => (e.target.style.background = "#1d4ed8")}
                  onMouseLeave={(e) => (e.target.style.background = "#2563eb")}
                  onClick={() => setPage && setPage(user ? "dashboard" : "login")}
                >
                  Contact Seller
                </button>
              )}

              <button
                style={{ width: "100%", padding: "12px 0", background: "white", color: "#2563eb", border: "1px solid #2563eb", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: "pointer" }}
                onClick={() => setPage("properties")}
              >
                Back to list
              </button>
            </div>

            {details.seller_name && (
              <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#1e293b" }}>Seller</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#2563eb" }}>
                    {details.seller_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, color: "#1e293b" }}>{details.seller_name}</p>
                    {details.seller_email && (
                      <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>{details.seller_email}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {similarProperties.length > 0 && (
          <div style={{ background: "white", borderRadius: 12, padding: "20px 24px", border: "1px solid #e2e8f0", marginTop: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap" }}>
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "#1e293b" }}>Similar properties</h3>
                <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>More available {details.type} listings.</p>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              {similarProperties.map((item) => (
                <div key={item.id} style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", background: "#fff" }}>
                  <img
                    src={item.image_url || DEFAULT_IMG}
                    alt={item.title}
                    style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }}
                    onError={(e) => { e.target.src = DEFAULT_IMG; }}
                  />
                  <div style={{ padding: 14 }}>
                    <p style={{ margin: "0 0 4px", fontWeight: 700, color: "#1e293b" }}>{item.title}</p>
                    <p style={{ margin: "0 0 10px", color: "#64748b", fontSize: 13 }}>📍 {item.location}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                      <span style={{ color: "#2563eb", fontWeight: 800 }}>Euro {Number(item.price).toLocaleString()}</span>
                      <button
                        onClick={() => setPage("property-detail", { id: item.id })}
                        style={{ padding: "7px 10px", background: "#2563eb", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12 }}
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ background: "white", borderRadius: 12, padding: "20px 24px", border: "1px solid #e2e8f0", marginTop: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap" }}>
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "#1e293b" }}>Reviews</h3>
              <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>Verified buyer feedback for this property.</p>
            </div>
            <div style={{ color: "#2563eb", fontWeight: 700 }}>
              {reviews.length ? `${(reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length).toFixed(1)} / 5` : "No ratings"}
            </div>
          </div>

          {reviewsLoading && <p style={{ color: "#64748b", fontSize: 14 }}>Loading reviews...</p>}
          {reviewError && <p style={{ margin: "0 0 12px", fontSize: 13, color: "#dc2626" }}>{reviewError}</p>}
          {reviewSuccess && <p style={{ margin: "0 0 12px", fontSize: 13, color: "#059669" }}>{reviewSuccess}</p>}

          {!reviewsLoading && reviews.length === 0 && (
            <p style={{ margin: "0 0 18px", color: "#64748b", fontSize: 14 }}>No reviews have been posted yet.</p>
          )}

          {reviews.length > 0 && (
            <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
              {reviews.map((review) => (
                <div key={review.id} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 14, background: review.is_hidden ? "#f8fafc" : "white" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>{review.title || "Buyer review"}</p>
                      <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>by {review.user_name} {review.is_verified ? "• verified" : ""}</p>
                    </div>
                    <span style={{ color: "#f59e0b", fontWeight: 700 }}>{"★".repeat(Number(review.rating))}</span>
                  </div>
                  <p style={{ margin: 0, color: "#475569", fontSize: 14, lineHeight: 1.55 }}>{review.comment}</p>
                </div>
              ))}
            </div>
          )}

          {isBuyer && (
            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 18 }}>
              <h4 style={{ margin: "0 0 10px", fontSize: 15, color: "#1e293b" }}>Write a review</h4>
              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10, marginBottom: 10 }}>
                <select
                  value={reviewForm.rating}
                  onChange={(e) => setReviewForm((prev) => ({ ...prev, rating: e.target.value }))}
                  style={{ padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14 }}
                >
                  {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}
                </select>
                <input
                  placeholder="Review title"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm((prev) => ({ ...prev, title: e.target.value }))}
                  style={{ padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14 }}
                />
              </div>
              <textarea
                rows={4}
                placeholder="Share your experience after a completed transaction"
                value={reviewForm.comment}
                onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14, resize: "vertical" }}
              />
              <button
                disabled={reviewSending}
                onClick={handleCreateReview}
                style={{ marginTop: 10, padding: "10px 18px", background: reviewSending ? "#93c5fd" : "#2563eb", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: reviewSending ? "not-allowed" : "pointer" }}
              >
                {reviewSending ? "Posting..." : "Post Review"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div><Footer /></>
  );
}
