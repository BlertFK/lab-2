import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";
import BuyerSubnav from "../components/BuyerSubnav";

const formatMoney = (amount) => `EUR ${Number(amount || 0).toLocaleString()}`;
const formatDateTime = (value) => value ? new Date(value).toLocaleString("en-US") : "-";
const TRANSACTION_STEPS = ["pending", "in_progress", "completed"];

const NEXT_STATUSES = {
  pending: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled", "refunded"],
  completed: ["refunded"],
  cancelled: [],
  refunded: [],
};

function TransactionStatusStepper({ status }) {
  const currentIndex = TRANSACTION_STEPS.indexOf(status);
  const isTerminal = ["cancelled", "refunded"].includes(status);

  return (
    <div className={`transaction-stepper ${isTerminal ? "terminal" : ""}`} aria-label="Transaction status">
      {TRANSACTION_STEPS.map((step, index) => {
        const isDone = currentIndex >= index || (status === "refunded" && step === "completed");
        const isCurrent = status === step;
        return (
          <div className={`transaction-step ${isDone ? "done" : ""} ${isCurrent ? "current" : ""}`} key={step}>
            <span>{index + 1}</span>
            <strong>{step.replace("_", " ")}</strong>
          </div>
        );
      })}
      {isTerminal && (
        <div className={`transaction-step terminal-step ${status}`}>
          <span>!</span>
          <strong>{status}</strong>
        </div>
      )}
    </div>
  );
}

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

      <h2 className="dash-welcome">Transaction Detail</h2>
      <p className="dash-sub">Inspect payment, parties, and status history fields for this deal.</p>

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

export default function TransactionDetailPage({ user, transactionId, setPage, setRootPage, onLogout, showToast }) {
  const [transaction, setTransaction] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const id = transactionId || localStorage.getItem("activeTransactionId");

  const loadTransaction = async () => {
    if (!id) {
      setError("No transaction selected.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await apiFetch(`/transactions/${id}`);
      setTransaction(data.transaction);
      setPaymentMethod(data.transaction?.payment_method || "bank_transfer");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransaction();
  }, [id]);

  const updateStatus = async (status) => {
    setSaving(true);
    try {
      await apiFetch(`/transactions/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, payment_method: paymentMethod }),
      });
      showToast?.("Transaction updated.", "success");
      await loadTransaction();
    } catch (err) {
      showToast?.(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const nextStatuses = NEXT_STATUSES[transaction?.status] || [];
  const canUpdate = user?.role === "seller" || user?.role === "admin";

  return (
    <div className="dashboard">
      <DashboardTop user={user} setPage={setPage} setRootPage={setRootPage} onLogout={onLogout} />

      <div className="dash-body">
        <button className="btn-ghost workflow-back-btn" onClick={() => setPage("transactions")}>Back to Transactions</button>

        {loading && <p className="loading-text">Loading transaction...</p>}
        {error && <div className="alert alert-error">{error}</div>}

        {!loading && !error && transaction && (
          <div className="transaction-detail-grid">
            <div className="profile-card transaction-detail-card">
              <p className="profile-card-title">Transaction #{transaction.id}</p>
              <div className="workflow-main">
                <div>
                  <span className={`workflow-status ${transaction.status}`}>{transaction.status}</span>
                  <h3>{transaction.property_title}</h3>
                  <p>Offer {transaction.offer_id ? `#${transaction.offer_id}` : "-"}</p>
                </div>
                <div className="workflow-amount">{formatMoney(transaction.amount)}</div>
              </div>

              <TransactionStatusStepper status={transaction.status} />

              <div className="profile-details">
                <div className="profile-row"><span className="profile-key">Buyer</span><span className="profile-val">{transaction.buyer_name}</span></div>
                <div className="profile-row"><span className="profile-key">Seller</span><span className="profile-val">{transaction.seller_name}</span></div>
                <div className="profile-row"><span className="profile-key">Property</span><span className="profile-val">{transaction.property_title}</span></div>
                <div className="profile-row"><span className="profile-key">Commission</span><span className="profile-val">{formatMoney(transaction.commission_amount)}</span></div>
                <div className="profile-row"><span className="profile-key">Payment Method</span><span className="profile-val">{transaction.payment_method || "-"}</span></div>
                <div className="profile-row"><span className="profile-key">Created</span><span className="profile-val">{formatDateTime(transaction.created_at)}</span></div>
                <div className="profile-row"><span className="profile-key">Completed</span><span className="profile-val">{formatDateTime(transaction.completed_at)}</span></div>
              </div>
            </div>

            <div className="buyer-section-card transaction-action-card">
              <div className="buyer-section-head">
                <div>
                  <h3 className="buyer-section-title">Status Actions</h3>
                  <p className="dash-sub">Allowed transitions are controlled by the backend.</p>
                </div>
              </div>

              {canUpdate ? (
                <>
                  <label className="form-label" htmlFor="paymentMethod">Payment method</label>
                  <select
                    id="paymentMethod"
                    className="form-select"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank transfer</option>
                    <option value="escrow">Escrow</option>
                    <option value="crypto">Crypto</option>
                  </select>

                  <div className="workflow-actions stacked">
                    {nextStatuses.length === 0 ? (
                      <div className="buyer-empty-state compact">
                        <p>No further transitions.</p>
                      </div>
                    ) : nextStatuses.map((status) => (
                      <button
                        key={status}
                        className={status === "cancelled" || status === "refunded" ? "btn-delete" : "btn-primary"}
                        disabled={saving}
                        onClick={() => updateStatus(status)}
                      >
                        Move to {status.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="buyer-empty-state compact">
                  <p>Read-only for buyers.</p>
                  <span>Sellers and admins update transaction status.</span>
                </div>
              )}
            </div>

            <div className="buyer-section-card transaction-summary-card">
              <div className="buyer-section-head">
                <div>
                  <h3 className="buyer-section-title">Deal Summary</h3>
                  <p className="dash-sub">Key identifiers for support, reports, and reconciliation.</p>
                </div>
              </div>

              <div className="workflow-meta-grid">
                <div><span>Transaction</span><strong>#{transaction.id}</strong></div>
                <div><span>Offer</span><strong>{transaction.offer_id ? `#${transaction.offer_id}` : "-"}</strong></div>
                <div><span>Property</span><strong>{transaction.property_id ? `#${transaction.property_id}` : "-"}</strong></div>
                <div><span>Agent</span><strong>{transaction.agent_id ? `#${transaction.agent_id}` : "-"}</strong></div>
                <div><span>Buyer ID</span><strong>{transaction.buyer_id ? `#${transaction.buyer_id}` : "-"}</strong></div>
                <div><span>Seller ID</span><strong>{transaction.seller_id ? `#${transaction.seller_id}` : "-"}</strong></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
