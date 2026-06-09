// B44: Admin users list. Paginated, filtered.

import { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api";
import AdminHeader from "../../components/AdminHeader";

const td = { padding: "12px 16px", borderBottom: "1px solid #f1f5f9", fontSize: 14, color: "#1e293b" };
const th = { ...td, textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", letterSpacing: "0.05em", textTransform: "uppercase" };

export default function UsersListPage({ setPage, onLogout, onSelectUser }) {
  const [rows, setRows] = useState([]);
  const [page, setPg] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page, pageSize });
      if (search) params.append("search", search);
      if (role) params.append("role", role);
      if (status) params.append("is_active", status);
      const data = await apiFetch(`/users?${params.toString()}`);
      setRows(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, role, status]);

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', sans-serif" }}>
      <AdminHeader
        title="Users"
        current="users"
        showBack
        stats={[{ value: total, label: "Total" }]}
        setPage={setPage}
        onLogout={onLogout}
      />

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 40px" }}>
        <div className="profile-card" style={{ width: "100%", maxWidth: "none" }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <input
              className="form-input"
              style={{ flex: "1 1 240px" }}
              placeholder="Search email or name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (setPg(1), load())}
            />
            <select className="form-select" style={{ minWidth: 150 }} value={role} onChange={(e) => { setRole(e.target.value); setPg(1); }}>
              <option value="">All roles</option>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Agent">Agent</option>
              <option value="Seller">Seller</option>
              <option value="Buyer">Buyer</option>
            </select>
            <select className="form-select" style={{ minWidth: 130 }} value={status} onChange={(e) => { setStatus(e.target.value); setPg(1); }}>
              <option value="">All statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <button className="btn-submit" style={{ height: 40 }} onClick={() => { setPg(1); load(); }}>Search</button>
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}

          <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: 10 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead style={{ background: "#f8fafc" }}>
                <tr>
                  <th style={th}>ID</th>
                  <th style={th}>Name</th>
                  <th style={th}>Email</th>
                  <th style={th}>Roles</th>
                  <th style={th}>Active</th>
                  <th style={th}>Created</th>
                  <th style={th}></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ ...td, textAlign: "center", color: "#64748b" }}>Loading…</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={7} style={{ ...td, textAlign: "center", color: "#64748b" }}>No users found.</td></tr>
                ) : rows.map((u) => (
                  <tr key={u.id} style={{ background: "white" }}>
                    <td style={{ ...td, color: "#94a3b8" }}>#{u.id}</td>
                    <td style={{ ...td, fontWeight: 600 }}>{u.first_name} {u.last_name}</td>
                    <td style={td}>{u.email}</td>
                    <td style={td}>{(u.roles || []).join(", ") || "—"}</td>
                    <td style={td}>{u.is_active ? "✓" : "—"}</td>
                    <td style={{ ...td, color: "#64748b" }}>{new Date(u.created_at).toLocaleDateString("en-GB")}</td>
                    <td style={td}>
                      <button className="btn-ghost" style={{ height: 32, padding: "0 12px" }} onClick={() => onSelectUser && onSelectUser(u.id)}>
                        View
                      </button>
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
