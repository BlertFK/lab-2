import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";
import BuyerSubnav from "../components/BuyerSubnav";

const formatMoney = (amount) => `EUR ${Number(amount || 0).toLocaleString()}`;
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
      <p className="dash-sub">Follow accepted offers from pending payment through completion.</p>

      {isBuyer ? (
        <BuyerSubnav activeTab="transactions" onChange={setPage} onGoHome={() => setRootPage("home")} onLogout={onLogout} />
      ) : (
        <div className="buyer-subnav-row">
          <div className="buyer-subnav">
            <button className="buyer-subnav-btn" onClick={() => setPage("sellerDashboard")}>Overview</button>
            <button className="buyer-subnav-btn" onClick={() => setPage("viewings")}>Viewings</button>
            <button className="buyer-subnav-btn" onClick={() => setPage("offers")}>Offers</button>
            <button className="buyer-subnav-btn active" onClick={() => setPage("transactions")}>Transactions</button>
          </div>
          <div className="buyer-subnav-actions">
            <button className="buyer-subnav-action buyer-subnav-action-danger" onClick={onLogout}>Sign Out</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TransactionsPage({ user, setPage, setRootPage, onLogout, setTransactionTarget }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTransactions = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiFetch("/transactions");
        setTransactions(data.transactions || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, []);

  const openDetail = (transaction) => {
    setTransactionTarget(transaction.id);
    localStorage.setItem("activeTransactionId", String(transaction.id));
    setPage("transactionDetail");
  };

  return (
    <div className="dashboard">
      <DashboardTop user={user} setPage={setPage} setRootPage={setRootPage} onLogout={onLogout} />

      <div className="dash-body">
        <div className="buyer-section-head">
          <div>
            <h3 className="buyer-section-title">Transactions</h3>
            <p className="dash-sub">Accepted offers and their current settlement status.</p>
          </div>
        </div>

        {loading && <p className="loading-text">Loading transactions...</p>}
        {error && <div className="alert alert-error">{error}</div>}

        {!loading && !error && transactions.length === 0 && (
          <div className="buyer-empty-state">
            <p>No transactions yet.</p>
            <span>Accepted offers will create transaction records automatically.</span>
          </div>
        )}

        {!loading && !error && transactions.length > 0 && (
          <div className="workflow-list">
            {transactions.map((transaction) => (
              <div className="workflow-card" key={transaction.id}>
                <div className="workflow-main">
                  <div>
                    <span className={`workflow-status ${transaction.status}`}>{transaction.status}</span>
                    <h3>{transaction.property_title}</h3>
                    <p>Buyer: {transaction.buyer_name} • Seller: {transaction.seller_name}</p>
                  </div>
                  <div className="workflow-amount">{formatMoney(transaction.amount)}</div>
                </div>

                <div className="workflow-meta-grid">
                  <div><span>Offer</span><strong>{transaction.offer_id ? `#${transaction.offer_id}` : "-"}</strong></div>
                  <div><span>Payment</span><strong>{transaction.payment_method || "-"}</strong></div>
                  <div><span>Created</span><strong>{formatDate(transaction.created_at)}</strong></div>
                  <div><span>Completed</span><strong>{formatDate(transaction.completed_at)}</strong></div>
                </div>

                <div className="workflow-actions">
                  <button className="btn-primary" onClick={() => openDetail(transaction)}>View Details</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
