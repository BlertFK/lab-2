// Agency detail — hero banner with logo + name, two-column layout:
//   left: info card (Email / Phone / Website / License / Founded / Address)
//   right: Agents list with avatars + status

import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";

const initials = (name = "Agency") =>
  name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);

const statusBadge = (status = "active") => {
  const c = {
    active:   { bg: "#d1fae5", color: "#065f46" },
    inactive: { bg: "#fee2e2", color: "#991b1b" },
    pending:  { bg: "#fef3c7", color: "#92400e" },
  };
  const s = c[status] || c.active;
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 700, textTransform: "capitalize" }}>
      {status}
    </span>
  );
};

const Detail = ({ icon, label, value }) => (
  <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
    <div style={{ fontSize: 18, lineHeight: "20px" }}>{icon}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: 14, color: "#1e293b", marginTop: 2, wordBreak: "break-word" }}>{value || "—"}</div>
    </div>
  </div>
);

export default function AgencyDetailPage({ agency: selectedAgency, setPage }) {
  const [agency, setAgency] = useState(selectedAgency || null);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const agencyId = selectedAgency?.id || agency?.id || localStorage.getItem("activeAgencyId");

  useEffect(() => {
    const load = async () => {
      if (!agencyId) { setError("Select an agency to view details."); setLoading(false); return; }
      setLoading(true); setError("");
      try {
        const [agencyData, agentsData] = await Promise.all([
          apiFetch(`/agencies/${agencyId}`),
          apiFetch(`/agencies/${agencyId}/agents`),
        ]);
        setAgency(agencyData.agency || null);
        setAgents(agentsData.agents || []);
      } catch (err) { setError(err.message); } finally { setLoading(false); }
    };
    load();
  }, [agencyId]);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)", padding: "100px 40px 60px", color: "white", position: "relative" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <button
            onClick={() => setPage("agencies")}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "white", borderRadius: 10, padding: "8px 16px",
              cursor: "pointer", fontWeight: 600, fontSize: 13,
              display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 24,
            }}
          >
            ← Back to Agencies
          </button>

          {loading ? (
            <h1 style={{ margin: 0, fontSize: 32, opacity: 0.8 }}>Loading…</h1>
          ) : !agency ? (
            <h1 style={{ margin: 0, fontSize: 32 }}>{error || "Agency not found"}</h1>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
              <div style={{
                width: 110, height: 110, borderRadius: 20,
                background: agency.logo_url ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.2)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                border: "3px solid rgba(255,255,255,0.3)", overflow: "hidden",
                fontSize: 36, fontWeight: 700,
              }}>
                {agency.logo_url ? (
                  <img src={agency.logo_url} alt={agency.name} style={{ maxWidth: "85%", maxHeight: "85%", objectFit: "contain" }} />
                ) : initials(agency.name)}
              </div>
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, opacity: 0.7, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    {[agency.city, agency.country].filter(Boolean).join(", ") || "Agency"}
                  </span>
                  {statusBadge(agency.status || "active")}
                </div>
                <h1 style={{ margin: "0 0 8px", fontSize: 36, fontWeight: 700 }}>{agency.name}</h1>
                <p style={{ margin: 0, opacity: 0.85, fontSize: 15, maxWidth: 700, lineHeight: 1.5 }}>
                  {agency.description || "Real estate agency profile."}
                </p>
                <div style={{ display: "flex", gap: 16, marginTop: 18, fontSize: 13, flexWrap: "wrap" }}>
                  <span><strong>{agents.length}</strong> agent{agents.length === 1 ? "" : "s"}</span>
                  {agency.founded_year && <span>Founded <strong>{agency.founded_year}</strong></span>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 40px" }}>
        {!loading && agency && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 24 }}>
            {/* Info card */}
            <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", alignSelf: "start" }}>
              <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#1e293b" }}>Contact & Details</h2>
              <Detail icon="✉️" label="Email"   value={agency.email} />
              <Detail icon="📞" label="Phone"   value={agency.phone} />
              <Detail icon="🌐" label="Website" value={agency.website} />
              <Detail icon="🪪" label="License" value={agency.license_number} />
              <Detail icon="📅" label="Founded" value={agency.founded_year} />
              <Detail icon="📍" label="Address" value={[agency.address, agency.city, agency.country].filter(Boolean).join(", ")} />
            </div>

            {/* Agents */}
            <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1e293b" }}>Agents</h2>
                <span style={{ fontSize: 13, color: "#64748b" }}>{agents.length} total</span>
              </div>

              {agents.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>👥</div>
                  <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>No agents listed.</p>
                  <p style={{ fontSize: 13, margin: "4px 0 0" }}>Agency members will appear here.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                  {agents.map((agent) => {
                    const name = agent.name || agent.user_name || `Agent #${agent.id}`;
                    return (
                      <div
                        key={agent.id}
                        style={{
                          display: "flex", gap: 12, alignItems: "center",
                          padding: 12, borderRadius: 12,
                          border: "1px solid #e2e8f0", background: "#f8fafc",
                        }}
                      >
                        <div style={{
                          width: 44, height: 44, borderRadius: "50%",
                          background: "linear-gradient(135deg, #2563eb, #1e3a5f)",
                          color: "white", display: "inline-flex", alignItems: "center", justifyContent: "center",
                          fontWeight: 700, fontSize: 15, flexShrink: 0,
                        }}>
                          {initials(name)}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {name}
                          </div>
                          <div style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {agent.title || agent.specialization || agent.email || "Real estate agent"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {!loading && error && !agency && (
          <div className="alert alert-error" style={{ marginTop: 16 }}>{error}</div>
        )}
      </div>
    </div>
  );
}
