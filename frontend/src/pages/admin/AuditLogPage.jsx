// B46: Audit log viewer with filters.

import { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api";
import AdminHeader from "../../components/AdminHeader";

const td = { padding: "10px 14px", borderBottom: "1px solid #f1f5f9", fontSize: 13, color: "#1e293b", verticalAlign: "top" };
const th = { ...td, textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.05em", textTransform: "uppercase" };

const code = {
  fontFamily: "ui-monospace, Menlo, Consolas, monospace",
  fontSize: 12,
  background: "#f8fafc",
  padding: "2px 6px",
  borderRadius: 4,
  color: "#475569",
};

export default function AuditLogPage({ setPage, onLogout }) {
  const [rows, setRows] = useState([]);
  const [page, setPg] = useState(1);
  const [pageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ user_id: "", entity: "", action: "", date_from: "", date_to: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page, pageSize });
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
      const data = await apiFetch(`/audit-logs?${params.toString()}`);
      setRows(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page]);

  const apply = () => { setPg(1); load(); };
  const reset = () => {
    setFilters({ user_id: "", entity: "", action: "", date_from: "", date_to: "" });
    setPg(1);
    setTimeout(load, 0);
  };

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', sans-serif" }}>
      <AdminHeader title="Audit Log" current="audit" showBack stats={[{ value: total, label: "Entries" }]} setPage={setPage} onLogout={onLogout} />

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 40px" }}>
        <div className="profile-card" style={{ maxWidth: "none", marginBottom: 16 }}>
          <p className="profile-card-title" style={{ marginBottom: 12 }}>Filters</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, alignItems: "end" }}>
            <Field label="User ID">
              <input className="form-input" type="number" value={filters.user_id} onChange={(e) => setFilters({ ...filters, user_id: e.target.value })} />
            </Field>
            <Field label="Entity">
              <input className="form-input" placeholder="users, properties…" value={filters.entity} onChange={(e) => setFilters({ ...filters, entity: e.target.value })} />
            </Field>
            <Field label="Action">
              <input className="form-input" placeholder="create, login…" value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })} />
            </Field>
            <Field label="From">
              <input className="form-input" type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} />
            </Field>
            <Field label="To">
              <input className="form-input" type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} />
            </Field>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-submit" onClick={apply} style={{ flex: 1 }}>Apply</button>
              <button className="btn-ghost" onClick={reset} style={{ height: 40 }}>Reset</button>
            </div>
          </div>
        </div>

        <div className="profile-card" style={{ maxWidth: "none" }}>
          {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}

          <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: 10 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1000 }}>
              <thead style={{ background: "#f8fafc" }}>
                <tr>
                  <th style={th}>When</th>
                  <th style={th}>User</th>
                  <th style={th}>Action</th>
                  <th style={th}>Entity</th>
                  <th style={th}>ID</th>
                  <th style={th}>IP</th>
                  <th style={th}>Changes</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ ...td, textAlign: "center", color: "#64748b" }}>Loading…</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={7} style={{ ...td, textAlign: "center", color: "#64748b" }}>No entries.</td></tr>
                ) : rows.map((r) => (
                  <tr key={r.id}>
                    <td style={{ ...td, whiteSpace: "nowrap", color: "#64748b" }}>
                      {new Date(r.created_at).toLocaleString("en-GB")}
                    </td>
                    <td style={td}>{r.user_name || r.user_email || (r.user_id ? `#${r.user_id}` : "—")}</td>
                    <td style={td}><span style={code}>{r.action}</span></td>
                    <td style={td}><span style={code}>{r.entity}</span></td>
                    <td style={{ ...td, color: "#94a3b8" }}>{r.entity_id ? `#${r.entity_id}` : "—"}</td>
                    <td style={{ ...td, color: "#94a3b8" }}>{r.ip_address || "—"}</td>
                    <td style={td}>
                      {r.new_value ? (
                        <details>
                          <summary style={{ cursor: "pointer", color: "#2563eb", fontSize: 12 }}>view</summary>
                          <pre style={{ background: "#0b1220", color: "#e2e8f0", padding: 10, borderRadius: 6, fontSize: 11, marginTop: 6, overflowX: "auto", maxWidth: 360 }}>
                            {typeof r.new_value === "string" ? r.new_value : JSON.stringify(r.new_value, null, 2)}
                          </pre>
                        </details>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, color: "#64748b", fontSize: 13 }}>
            <span>Page {page} of {totalPages} — {total} total</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-ghost" style={{ height: 32 }} onClick={() => setPg(Math.max(1, page - 1))} disabled={page <= 1}>Prev</button>
              <button className="btn-ghost" style={{ height: 32 }} onClick={() => setPg(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="form-group" style={{ marginBottom: 0 }}>
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}
