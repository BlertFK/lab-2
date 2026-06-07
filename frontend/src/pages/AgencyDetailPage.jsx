import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";

const initials = (name = "Agency") => name
  .split(" ")
  .map((part) => part[0])
  .join("")
  .toUpperCase()
  .slice(0, 2);

export default function AgencyDetailPage({ agency: selectedAgency, setPage }) {
  const [agency, setAgency] = useState(selectedAgency || null);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const agencyId = selectedAgency?.id || agency?.id || localStorage.getItem("activeAgencyId");

  useEffect(() => {
    const loadAgency = async () => {
      if (!agencyId) {
        setLoading(false);
        setError("Select an agency to view details.");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [agencyData, agentsData] = await Promise.all([
          apiFetch(`/agencies/${agencyId}`),
          apiFetch(`/agencies/${agencyId}/agents`),
        ]);
        setAgency(agencyData.agency || null);
        setAgents(agentsData.agents || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadAgency();
  }, [agencyId]);

  return (
    <div className="dashboard public-directory-page">
      <div className="dash-header">
        <button className="btn-ghost public-page-back" onClick={() => setPage("agencies")}>Back to Agencies</button>
        <h2 className="dash-welcome">{agency?.name || "Agency Details"}</h2>
        <p className="dash-sub">{agency?.city || agency?.country || "Agency profile and agents."}</p>
      </div>

      <div className="dash-body">
        {loading && <p className="loading-text">Loading agency...</p>}
        {error && <div className="alert alert-error">{error}</div>}

        {!loading && !error && agency && (
          <>
            <div className="agency-detail-layout">
              <section className="profile-card agency-profile-card">
                <div className="directory-card-top">
                  {agency.logo_url ? (
                    <img className="directory-logo large" src={agency.logo_url} alt={agency.name} />
                  ) : (
                    <div className="directory-logo directory-logo-fallback large">{initials(agency.name)}</div>
                  )}
                  <span className={`workflow-status ${agency.status || "active"}`}>{agency.status || "active"}</span>
                </div>
                <p className="profile-card-title">{agency.name}</p>
                <p className="dash-sub">{agency.description || "Real estate agency profile."}</p>
                <div className="workflow-meta-grid agency-meta-grid">
                  <div><span>Email</span><strong>{agency.email || "-"}</strong></div>
                  <div><span>Phone</span><strong>{agency.phone || "-"}</strong></div>
                  <div><span>Website</span><strong>{agency.website || "-"}</strong></div>
                  <div><span>License</span><strong>{agency.license_number || "-"}</strong></div>
                  <div><span>Founded</span><strong>{agency.founded_year || "-"}</strong></div>
                  <div><span>Address</span><strong>{[agency.address, agency.city, agency.country].filter(Boolean).join(", ") || "-"}</strong></div>
                </div>
              </section>

              <section className="buyer-section-block">
                <div className="buyer-section-head">
                  <div>
                    <h3 className="buyer-section-title">Agents</h3>
                    <p className="dash-sub">People connected to this agency.</p>
                  </div>
                </div>

                {agents.length === 0 ? (
                  <div className="buyer-empty-state compact">
                    <p>No agents listed.</p>
                    <span>Agency agents will appear here.</span>
                  </div>
                ) : (
                  <div className="buyer-mini-list">
                    {agents.map((agent) => (
                      <div className="buyer-mini-item" key={agent.id}>
                        <div>
                          <p className="buyer-mini-title">{agent.name || agent.user_name || `Agent #${agent.id}`}</p>
                          <p className="buyer-mini-sub">{agent.title || agent.specialization || agent.email || "Real estate agent"}</p>
                        </div>
                        <span className={`workflow-status ${agent.status || "active"}`}>{agent.status || "active"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
