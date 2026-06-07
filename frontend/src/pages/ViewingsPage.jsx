import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";
import BuyerSubnav from "../components/BuyerSubnav";

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

function DashboardTop({ user, activeTab, setPage, setRootPage, onLogout }) {
  const isBuyer = user?.role === "buyer";

  return (
    <div className="dash-header">
      <div className="dashboard-brand-row">
        <div className="dashboard-brand" onClick={() => setRootPage("home")}>
          <div className="brand-logo"><div className="logo-dot" /></div>
          <span className="brand-name">UrbanKeys</span>
        </div>
        <button className="btn-ghost" onClick={() => setRootPage("home")}>Home</button>
      </div>

      <h2 className="dash-welcome">{isBuyer ? "Buyer Dashboard" : "Seller Dashboard"}</h2>
      <p className="dash-sub">Keep tour requests organized by property, buyer, and scheduled time.</p>

      {isBuyer ? (
        <BuyerSubnav
          activeTab={activeTab}
          onChange={setPage}
          onGoHome={() => setRootPage("home")}
          onLogout={onLogout}
        />
      ) : (
        <div className="buyer-subnav-row">
          <div className="buyer-subnav">
            <button className="buyer-subnav-btn" onClick={() => setPage("sellerDashboard")}>Overview</button>
            <button className="buyer-subnav-btn active" onClick={() => setPage("viewings")}>Viewings</button>
            <button className="buyer-subnav-btn" onClick={() => setPage("offers")}>Offers</button>
            <button className="buyer-subnav-btn" onClick={() => setPage("transactions")}>Transactions</button>
          </div>
          <div className="buyer-subnav-actions">
            <button className="buyer-subnav-action buyer-subnav-action-danger" onClick={onLogout}>Sign Out</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ViewingsPage({ user, setPage, setRootPage, onLogout, showToast }) {
  const [viewings, setViewings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const loadViewings = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch("/viewings");
      setViewings(data.viewings || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadViewings();
  }, []);

  const updateStatus = async (viewing, status) => {
    const body = { status };
    if (status === "cancelled") {
      const reason = window.prompt("Cancellation reason");
      if (!reason) return;
      body.cancelled_reason = reason;
    }

    setBusyId(viewing.id);
    try {
      await apiFetch(`/viewings/${viewing.id}/status`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      showToast?.("Viewing status updated.", "success");
      await loadViewings();
    } catch (err) {
      showToast?.(err.message, "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="dashboard">
      <DashboardTop user={user} activeTab="viewings" setPage={setPage} setRootPage={setRootPage} onLogout={onLogout} />

      <div className="dash-body">
        <div className="buyer-section-head">
          <div>
            <h3 className="buyer-section-title">Viewings</h3>
            <p className="dash-sub">Requested, confirmed, completed, and cancelled property tours.</p>
          </div>
        </div>

        {loading && <p className="loading-text">Loading viewings...</p>}
        {error && <div className="alert alert-error">{error}</div>}

        {!loading && !error && viewings.length === 0 && (
          <div className="buyer-empty-state">
            <p>No viewings yet.</p>
            <span>{user?.role === "buyer" ? "Schedule one from a property details page." : "Buyer requests will appear here."}</span>
          </div>
        )}

        {!loading && !error && viewings.length > 0 && (
          <div className="workflow-list">
            {viewings.map((viewing) => (
              <div className="workflow-card" key={viewing.id}>
                <div className="workflow-main">
                  <div>
                    <span className={`workflow-status ${viewing.status}`}>{viewing.status}</span>
                    <h3>{viewing.property_title}</h3>
                    <p>{formatDateTime(viewing.scheduled_at)} • {viewing.duration_minutes || 30} minutes</p>
                  </div>
                  <div className="workflow-amount">#{viewing.id}</div>
                </div>

                <div className="workflow-meta-grid">
                  <div><span>Buyer</span><strong>{viewing.buyer_name}</strong></div>
                  <div><span>Seller</span><strong>{viewing.seller_name}</strong></div>
                  <div><span>Notes</span><strong>{viewing.notes || "-"}</strong></div>
                  <div><span>Created</span><strong>{formatDateTime(viewing.created_at)}</strong></div>
                </div>

                <div className="workflow-actions">
                  {user?.role === "seller" && viewing.status === "requested" && (
                    <>
                      <button className="btn-primary" disabled={busyId === viewing.id} onClick={() => updateStatus(viewing, "confirmed")}>Confirm</button>
                      <button className="btn-delete" disabled={busyId === viewing.id} onClick={() => updateStatus(viewing, "rejected")}>Reject</button>
                    </>
                  )}
                  {user?.role === "seller" && ["requested", "confirmed"].includes(viewing.status) && (
                    <button className="btn-ghost" disabled={busyId === viewing.id} onClick={() => updateStatus(viewing, "completed")}>Mark Completed</button>
                  )}
                  {["requested", "confirmed"].includes(viewing.status) && (
                    <button className="btn-ghost" disabled={busyId === viewing.id} onClick={() => updateStatus(viewing, "cancelled")}>Cancel</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
