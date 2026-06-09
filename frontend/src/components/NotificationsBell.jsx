// B48: NotificationsBell — bell icon with unread badge + dropdown of latest 10.
// Listens to the socket for notification:new events.

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../utils/api";
import { useSocket } from "../lib/socket";

const bellSvg = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

export default function NotificationsBell({ user, setPage }) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const refresh = async () => {
    if (!user) return;
    try {
      const data = await apiFetch("/notifications?pageSize=10");
      setItems(data.data || []);
      setUnread(data.unread || 0);
    } catch (_) { /* ignore */ }
  };

  useEffect(() => { refresh(); }, [user]);

  useSocket({
    "notification:new": (n) => {
      setItems((cur) => [n, ...cur].slice(0, 10));
      setUnread((u) => u + 1);
    },
    "notification:read": ({ id }) => {
      setItems((cur) => cur.map((n) => n.id === id ? { ...n, is_read: true } : n));
      setUnread((u) => Math.max(0, u - 1));
    },
  });

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markRead = async (id) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
      setItems((cur) => cur.map((n) => n.id === id ? { ...n, is_read: true } : n));
      setUnread((u) => Math.max(0, u - 1));
    } catch (_) { /* ignore */ }
  };

  const markAllRead = async () => {
    try {
      await apiFetch("/notifications/read-all", { method: "PATCH" });
      setItems((cur) => cur.map((n) => ({ ...n, is_read: true })));
      setUnread(0);
    } catch (_) { /* ignore */ }
  };

  if (!user) return null;

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        style={{
          position: "relative",
          width: 40, height: 40,
          background: "rgba(255,255,255,0.15)",
          border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: 10, color: "white",
          cursor: "pointer", display: "inline-flex",
          alignItems: "center", justifyContent: "center",
        }}
      >
        {bellSvg}
        {unread > 0 && (
          <span style={{
            position: "absolute", top: -6, right: -6,
            background: "#dc2626", color: "white",
            borderRadius: 999, padding: "2px 6px",
            fontSize: 11, fontWeight: 700, minWidth: 18, textAlign: "center",
            border: "2px solid #1e3a5f",
          }}>{unread > 99 ? "99+" : unread}</span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          width: 360, maxHeight: 480, overflow: "auto",
          background: "white", borderRadius: 12,
          boxShadow: "0 12px 40px rgba(0,0,0,0.18)", zIndex: 1100,
          color: "#1e293b",
        }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong>Notifications</strong>
            {unread > 0 && (
              <button onClick={markAllRead} style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                Mark all read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>You're all caught up.</div>
          ) : items.map((n) => (
            <div
              key={n.id}
              onClick={() => { if (!n.is_read) markRead(n.id); if (n.link) window.location.href = n.link; }}
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid #f1f5f9",
                background: n.is_read ? "white" : "#eff6ff",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                <strong style={{ fontSize: 14 }}>{n.title}</strong>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>
                  {n.created_at ? new Date(n.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : ""}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.45 }}>{n.message}</div>
            </div>
          ))}

          {setPage && (
            <div style={{ padding: "10px 16px", borderTop: "1px solid #f1f5f9", textAlign: "center" }}>
              <button onClick={() => { setOpen(false); setPage("notifications"); }} style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                View all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
