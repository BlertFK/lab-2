// B50: SearchResultsPage. Receives a `q` prop (from App.jsx). Renders one
// section per entity with all matches.

import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";
import AdminHeader from "../components/AdminHeader";

const ENTITY_LABELS = {
  properties: "Properties",
  users: "Users",
  viewings: "Viewings",
  offers: "Offers",
  messages: "Messages",
};

export default function SearchResultsPage({ q: initialQ = "", user, setPage, onLogout }) {
  const [q, setQ] = useState(initialQ);
  const [data, setData] = useState({ results: {}, total: 0 });
  const [scope, setScope] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isAdmin = user?.role === "admin";

  const run = async (query = q, ent = scope) => {
    if (!query || query.length < 2) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ q: query, limit: "20" });
      if (ent !== "all") params.set("entities", ent);
      const res = await apiFetch(`/search?${params}`);
      setData(res);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  useEffect(() => { if (initialQ) run(initialQ, "all"); /* eslint-disable-next-line */ }, [initialQ]);

  const entries = Object.entries(data.results || {}).filter(([, rows]) => rows.length > 0);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', sans-serif" }}>
      {isAdmin && (
        <AdminHeader
          title="Search"
          current="search"
          showBack
          setPage={setPage}
          onLogout={onLogout}
          stats={[{ value: data.total || 0, label: "Matches" }]}
        />
      )}

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        <div className="profile-card" style={{ maxWidth: "none", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <input
              className="form-input"
              style={{ flex: "1 1 240px" }}
              placeholder="Search properties, users, viewings…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && run()}
            />
            <select className="form-select" style={{ width: 180 }} value={scope} onChange={(e) => { setScope(e.target.value); run(q, e.target.value); }}>
              <option value="all">All entities</option>
              <option value="properties">Properties</option>
              <option value="users">Users</option>
              <option value="viewings">Viewings</option>
              <option value="offers">Offers</option>
              <option value="messages">Messages</option>
            </select>
            <button className="btn-submit" onClick={() => run()}>Search</button>
          </div>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

        {loading ? (
          <div className="profile-card" style={{ maxWidth: "none" }}><p className="dash-sub">Searching…</p></div>
        ) : entries.length === 0 ? (
          <div className="profile-card" style={{ maxWidth: "none" }}>
            <p className="dash-sub">
              {q.length < 2 ? "Type at least 2 characters to search." : `No matches for "${q}".`}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {entries.map(([entity, rows]) => (
              <div key={entity} className="profile-card" style={{ maxWidth: "none" }}>
                <p className="profile-card-title">
                  {ENTITY_LABELS[entity] || entity}
                  <span style={{ color: "#64748b", fontWeight: 400, fontSize: 14, marginLeft: 10 }}>
                    {rows.length} match{rows.length === 1 ? "" : "es"}
                  </span>
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {rows.map((r) => (
                    <a
                      key={`${entity}-${r.id}`}
                      href={r.link}
                      style={{
                        display: "block",
                        padding: "12px 16px",
                        borderRadius: 10,
                        border: "1px solid #e2e8f0",
                        background: "#fff",
                        color: "#1e293b",
                        textDecoration: "none",
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{r.title}</div>
                      <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{r.subtitle}</div>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {data.cached && (
          <div style={{ marginTop: 12, fontSize: 12, color: "#94a3b8", textAlign: "right" }}>
            served from Redis cache
          </div>
        )}
      </div>
    </div>
  );
}
