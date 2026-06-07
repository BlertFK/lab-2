import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";

const parseFeatures = (features) => {
  if (!features) return [];
  if (Array.isArray(features)) return features;
  if (typeof features === "object") return Object.values(features).flat();

  try {
    const parsed = JSON.parse(features);
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === "object" && parsed) return Object.values(parsed).flat();
  } catch {
    return String(features).split(",").map((item) => item.trim()).filter(Boolean);
  }

  return [];
};

const formatPrice = (price) => {
  const amount = Number(price || 0);
  if (amount === 0) return "Free";
  return `Euro ${amount.toLocaleString()}`;
};

export default function PlansPage({ user, setPage, showToast }) {
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    const loadPlans = async () => {
      setLoading(true);
      setError("");

      try {
        const plansData = await apiFetch("/plans");
        setPlans(plansData.plans || []);

        if (user) {
          try {
            const subscriptionData = await apiFetch("/plans/subscription/me");
            setSubscription(subscriptionData.subscription || null);
          } catch {
            setSubscription(null);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, [user]);

  const subscribe = async (plan) => {
    if (!user) {
      showToast?.("Please sign in before choosing a plan.", "error");
      setPage?.("login");
      return;
    }

    setBusyId(plan.id);
    try {
      const data = await apiFetch("/plans/subscribe", {
        method: "POST",
        body: JSON.stringify({ plan_id: plan.id, auto_renew: true }),
      });
      setSubscription(data.subscription || null);
      showToast?.(data.message || "Subscription updated.", "success");
    } catch (err) {
      showToast?.(err.message, "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="dashboard public-directory-page">
      <div className="dash-header">
        <div className="dashboard-brand-row">
          <div className="dashboard-brand" onClick={() => setPage("home")}>
            <div className="brand-logo"><div className="logo-dot" /></div>
            <span className="brand-name">UrbanKeys</span>
          </div>
          <button className="btn-ghost" onClick={() => setPage(user ? "dashboard" : "home")}>
            {user ? "Dashboard" : "Home"}
          </button>
        </div>
        <h2 className="dash-welcome">Plans</h2>
        <p className="dash-sub">Choose a listing plan and manage seller quota.</p>
      </div>

      <div className="dash-body">
        {loading && <p className="loading-text">Loading plans...</p>}
        {error && <div className="alert alert-error">{error}</div>}

        {!loading && !error && plans.length === 0 && (
          <div className="buyer-empty-state">
            <p>No plans available.</p>
            <span>Subscription plans will appear here.</span>
          </div>
        )}

        {!loading && !error && plans.length > 0 && (
          <div className="plans-grid">
            {plans.map((plan) => {
              const features = parseFeatures(plan.features);
              const isCurrent = subscription?.plan_id === plan.id;

              return (
                <article className={`plan-card ${isCurrent ? "current" : ""}`} key={plan.id}>
                  <div>
                    <div className="buyer-section-head">
                      <div>
                        <p className="buyer-prop-type">{plan.slug || "plan"}</p>
                        <h3 className="buyer-section-title">{plan.name}</h3>
                      </div>
                      {isCurrent && <span className="workflow-status active">Current</span>}
                    </div>
                    <p className="plan-price">{formatPrice(plan.price)}</p>
                    <p className="dash-sub">{plan.duration_days ? `${plan.duration_days} days` : "No expiry"}</p>

                    <div className="workflow-meta-grid plan-quota-grid">
                      <div><span>Listings</span><strong>{plan.max_listings ?? "Unlimited"}</strong></div>
                      <div><span>Featured</span><strong>{plan.max_featured ?? 0}</strong></div>
                    </div>

                    {features.length > 0 && (
                      <ul className="plan-feature-list">
                        {features.map((feature) => <li key={feature}>{feature}</li>)}
                      </ul>
                    )}
                  </div>

                  <button className="btn-primary" disabled={busyId === plan.id || isCurrent} onClick={() => subscribe(plan)}>
                    {isCurrent ? "Current Plan" : busyId === plan.id ? "Subscribing..." : user ? "Choose Plan" : "Sign In to Subscribe"}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
