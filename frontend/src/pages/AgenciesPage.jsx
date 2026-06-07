import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";

const initials = (name = "Agency") => name
  .split(" ")
  .map((part) => part[0])
  .join("")
  .toUpperCase()
  .slice(0, 2);

export default function AgenciesPage({ setPage, setSelectedAgency }) {
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAgencies = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await apiFetch("/agencies");
        setAgencies(data.agencies || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadAgencies();
  }, []);

  const openAgency = (agency) => {
    localStorage.setItem("activeAgencyId", agency.id);
    setSelectedAgency?.(agency);
    setPage?.("agency-detail", { id: agency.id });
  };

  return (
    <div className="dashboard public-directory-page">
      <div className="dash-header">
        <h2 className="dash-welcome">Agencies</h2>
        <p className="dash-sub">Browse real estate agencies and their agents.</p>
      </div>

      <div className="dash-body">
        {loading && <p className="loading-text">Loading agencies...</p>}
        {error && <div className="alert alert-error">{error}</div>}

        {!loading && !error && agencies.length === 0 && (
          <div className="buyer-empty-state">
            <p>No agencies yet.</p>
            <span>Approved agencies will appear here.</span>
          </div>
        )}

        {!loading && !error && agencies.length > 0 && (
          <div className="buyer-card-grid">
            {agencies.map((agency) => (
              <article className="directory-card" key={agency.id}>
                <div className="directory-card-top">
                  {agency.logo_url ? (
                    <img className="directory-logo" src={agency.logo_url} alt={agency.name} />
                  ) : (
                    <div className="directory-logo directory-logo-fallback">{initials(agency.name)}</div>
                  )}
                  <span className={`workflow-status ${agency.status || "active"}`}>{agency.status || "active"}</span>
                </div>
                <div className="buyer-prop-body">
                  <p className="buyer-prop-type">{agency.city || agency.country || "Agency"}</p>
                  <h3 className="buyer-prop-title">{agency.name}</h3>
                  <p className="buyer-prop-desc">{agency.description || agency.address || "Real estate agency profile."}</p>
                  <div className="buyer-prop-meta">
                    <span>{agency.email || "No email"}</span>
                    <span>{agency.phone || "No phone"}</span>
                  </div>
                </div>
                <div className="buyer-prop-actions">
                  <button className="btn-primary" onClick={() => openAgency(agency)}>View Agency</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
