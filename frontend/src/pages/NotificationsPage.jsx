// B48: Full notifications page — paginated, marks-as-read per row.

import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";
import AdminHeader from "../components/AdminHeader";

export default function NotificationsPage({ user, setPage, onLogout }) {
  const [rows, setRows] = useState([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPg] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const isAdmin = user?.role === "admin";

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, pageSize });
      if (unreadOnly) params.append("unreadOnly", "true");
      const data = await apiFetch(`/notifications?${params}`);
      setRows(data.data || []);
      setTotal(data.pagination?.total || 0);
      setUnread(data.unread || 0);
    } catch (_) { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, unreadOnly]);

  const markRead = async (id) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
      setRows((cur) => cur.map((n) => n.id === id ? { ...n, is_read: true } : n));
      setUnread((u) => Math.max(0, u - 1));
    } catch (_) { /* ignore */ }
  };

  const markAllRead = async () => {
    try {
      await apiFetch("/notifications/read-all", { method: "PATCH" });
      setRows((cur) => cur.map((n) => ({ ...n, is_read: true })));
      setUnread(0);
    } catch (_) { /* ignore */ }
  };

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', sans-serif" }}>
      {isAdmin && (
        <AdminHeader
          title="Notifications"
          current="notifications"
          showBack
          setPage={setPage}
          onLogout={onLogout}
          stats={[{ value: unread, label: "Unread" }]}
        />
      )}

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        <div className="profile-card" style={{ maxWidth: "none" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <p className="profile-card-title" style={{ margin: 0, padding: 0, borderBottom: "none" }}>
              Inbox <span style={{ color: "#64748b", fontWeight: 400, fontSize: 14 }}>({total} total)</span>
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-ghost" style={{ height: 36 }} onClick={() => { setUnreadOnly(!unreadOnly); setPg(1); }}>
                {unreadOnly ? "Show all" : "Unread only"}
              </button>
              {unread > 0 && (
                <button className="btn-submit" style={{ height: 36 }} onClick={markAllRead}>Mark all read</button>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {loading ? (
              <p className="dash-sub">Loading…</p>
            ) : rows.length === 0 ? (
              <p className="dash-sub">No notifications.</p>
            ) : rows.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: "14px 16px",
                  borderRadius: 10,
                  border: "1px solid #e2e8f0",
                  background: n.is_read ? "white" : "#eff6ff",
                  cursor: !n.is_read ? "pointer" : "default",
                }}
                onClick={() => !n.is_read && markRead(n.id)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                  <strong style={{ fontSize: 15 }}>{n.title}</strong>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>{new Date(n.created_at).toLocaleString("en-GB")}</span>
                </div>
                <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.5 }}>{n.message}</div>
                {n.link && (
                  <a href={n.link} style={{ fontSize: 13, color: "#2563eb", display: "inline-block", marginTop: 8 }}>Open</a>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, color: "#64748b", fontSize: 13 }}>
            <span>Page {page} of {totalPages}</span>
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
