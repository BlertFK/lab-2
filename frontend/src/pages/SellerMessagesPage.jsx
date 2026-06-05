import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";

export default function SellerMessagesPage({ user, setPage, setRootPage, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiFetch("/messages/seller");
        setMessages(data.messages);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadMessages();
  }, []);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div className="dashboard-brand-row">
          <div className="dashboard-brand" onClick={() => setRootPage("home")}>
            <div className="brand-logo"><div className="logo-dot" /></div>
            <span className="brand-name">UrbanKeys</span>
          </div>
          <button className="btn-ghost" onClick={() => setRootPage("home")}>Home</button>
        </div>

        <div className="buyer-header-row">
          <div>
            <h2 className="dash-welcome">Seller Dashboard</h2>
            <p className="dash-sub">View messages buyers have sent about your properties.</p>
          </div>
        </div>

        <div className="buyer-subnav-row">
          <div className="buyer-subnav">
            <button type="button" className="buyer-subnav-btn" onClick={() => setPage("main")}>
              Overview
            </button>
            <button type="button" className="buyer-subnav-btn" onClick={() => setPage("myProperties")}>
              My Properties
            </button>
            <button type="button" className="buyer-subnav-btn active">
              Messages
            </button>
          </div>
          <div className="buyer-subnav-actions">
            <button type="button" className="buyer-subnav-action" onClick={() => setRootPage("home")}>
              Home
            </button>
            <button type="button" className="buyer-subnav-action buyer-subnav-action-danger" onClick={onLogout}>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="dash-body">
        <div className="buyer-section-head" style={{ marginBottom: "1.25rem" }}>
          <div>
            <h3 className="buyer-section-title">Received Messages</h3>
            <p className="dash-sub">Buyers who contacted you about your listed properties.</p>
          </div>
        </div>

        {loading && <p className="loading-text">Loading messages...</p>}
        {error && <div className="alert alert-error">{error}</div>}

        {!loading && !error && messages.length === 0 && (
          <div className="buyer-empty-state">
            <p>No messages yet.</p>
            <span>When buyers contact you about your properties, their messages will appear here.</span>
          </div>
        )}

        {!loading && !error && messages.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 720 }}>
            {messages.map((msg) => (
              <div key={msg.id} className="profile-card" style={{ padding: "1.25rem 1.5rem", marginBottom: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, color: "#1e293b", fontSize: 15 }}>
                      {msg.buyer_name || "Unknown Buyer"}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>{msg.buyer_email}</p>
                  </div>
                  <span style={{ fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap" }}>
                    {formatDate(msg.created_at)}
                  </span>
                </div>

                <p style={{ margin: "0 0 10px", fontSize: 13, color: "#475569" }}>
                  Re: <span style={{ fontWeight: 600, color: "#2563eb" }}>
                    {msg.property_title || `Property #${msg.property_id}`}
                  </span>
                </p>

                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 14px", fontSize: 14, color: "#1e293b", lineHeight: 1.6 }}>
                  {msg.message}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}