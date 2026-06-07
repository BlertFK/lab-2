import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";
import BuyerSubnav from "../components/BuyerSubnav";

const formatMoney = (amount, currency = "EUR") =>
  `${currency} ${Number(amount || 0).toLocaleString()}`;

const formatDate = (value) => value ? new Date(value).toLocaleDateString("en-US") : "-";

function DashboardTop({ user, setPage, setRootPage, onLogout }) {
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
      <p className="dash-sub">Review offers, respond to pending bids, and track accepted deals.</p>

      {isBuyer ? (
        <BuyerSubnav activeTab="offers" onChange={setPage} onGoHome={() => setRootPage("home")} onLogout={onLogout} />
      ) : (
        <div className="buyer-subnav-row">
          <div className="buyer-subnav">
            <button className="buyer-subnav-btn" onClick={() => setPage("sellerDashboard")}>Overview</button>
            <button className="buyer-subnav-btn" onClick={() => setPage("viewings")}>Viewings</button>
            <button className="buyer-subnav-btn active" onClick={() => setPage("offers")}>Offers</button>
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

export default function OffersPage({ user, setPage, setRootPage, onLogout, showToast }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const loadOffers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/offers");
      setOffers(data.offers || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const updateStatus = async (offer, status) => {
    setBusyId(offer.id);
    try {
      await apiFetch(`/offers/${offer.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      showToast?.(status === "accepted" ? "Offer accepted. A transaction was created." : "Offer status updated.", "success");
      await loadOffers();
    } catch (err) {
      showToast?.(err.message, "error");
    } finally {
      setBusyId(null);
    }
  };

  const createCounterOffer = async (offer) => {
    const amount = window.prompt("Counter-offer amount", String(offer.amount || ""));
    if (!amount) return;
    const message = window.prompt("Counter-offer message", "Seller counter-offer") || "";

    setBusyId(offer.id);
    try {
      await apiFetch(`/offers/${offer.id}/counter`, {
        method: "POST",
        body: JSON.stringify({ amount: Number(amount), currency: offer.currency || "EUR", message }),
      });
      showToast?.("Counter-offer created.", "success");
      await loadOffers();
    } catch (err) {
      showToast?.(err.message, "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="dashboard">
      <DashboardTop user={user} setPage={setPage} setRootPage={setRootPage} onLogout={onLogout} />

      <div className="dash-body">
        <div className="buyer-section-head">
          <div>
            <h3 className="buyer-section-title">Offers</h3>
            <p className="dash-sub">All submitted and received offers for your account.</p>
          </div>
        </div>

        {loading && <p className="loading-text">Loading offers...</p>}
        {error && <div className="alert alert-error">{error}</div>}

        {!loading && !error && offers.length === 0 && (
          <div className="buyer-empty-state">
            <p>No offers yet.</p>
            <span>{user?.role === "buyer" ? "Make an offer from a property details page." : "Buyer offers will appear here."}</span>
          </div>
        )}

        {!loading && !error && offers.length > 0 && (
          <div className="workflow-list">
            {offers.map((offer) => (
              <div className="workflow-card" key={offer.id}>
                <div className="workflow-main">
                  <div>
                    <span className={`workflow-status ${offer.status}`}>{offer.status}</span>
                    <h3>{offer.property_title}</h3>
                    <p>{offer.message || "No message included."}</p>
                  </div>
                  <div className="workflow-amount">{formatMoney(offer.amount, offer.currency)}</div>
                </div>

                <div className="workflow-meta-grid">
                  <div><span>Buyer</span><strong>{offer.buyer_name}</strong></div>
                  <div><span>Seller</span><strong>{offer.seller_name}</strong></div>
                  <div><span>Expires</span><strong>{formatDate(offer.expires_at)}</strong></div>
                  <div><span>Submitted</span><strong>{formatDate(offer.created_at)}</strong></div>
                </div>

                <div className="workflow-actions">
                  {user?.role === "seller" && offer.status === "pending" && (
                    <>
                      <button className="btn-primary" disabled={busyId === offer.id} onClick={() => updateStatus(offer, "accepted")}>Accept</button>
                      <button className="btn-delete" disabled={busyId === offer.id} onClick={() => updateStatus(offer, "rejected")}>Reject</button>
                      <button className="btn-ghost" disabled={busyId === offer.id} onClick={() => createCounterOffer(offer)}>Counter</button>
                    </>
                  )}
                  {user?.role === "buyer" && offer.status === "pending" && (
                    <button className="btn-ghost" disabled={busyId === offer.id} onClick={() => updateStatus(offer, "withdrawn")}>Withdraw</button>
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
