import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Bell, X } from "lucide-react";
import { toast } from "react-toastify";
import { addNotification, markRead, markAllRead, setNotifications } from "../../features/notifications/notificationsSlice";
import { apiClient } from "../../lib/apiClient";
import { clsx } from "clsx";

export default function NotificationsBell() {
  const dispatch   = useDispatch();
  const { items, unreadCount } = useSelector((s) => s.notifications);
  const [open, setOpen]        = useState(false);
  const ref = useRef(null);

  // Load notifications on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    apiClient.get("/notifications").then((d) => {
      if (d?.notifications) dispatch(setNotifications(d.notifications));
    }).catch(() => {});
  }, [dispatch]);

  // Listen for real-time socket notifications (emitted by Blert's backend)
  useEffect(() => {
    const handler = (e) => {
      const n = e.detail;
      dispatch(addNotification(n));
      toast.info(n.title, { toastId: `notif-${n.id}` });
    };
    window.addEventListener("notification:new", handler);
    return () => window.removeEventListener("notification:new", handler);
  }, [dispatch]);

  // Close on outside click
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const handleMarkRead = async (id) => {
    dispatch(markRead(id));
    await apiClient.patch(`/notifications/${id}/read`).catch(() => {});
  };

  const handleMarkAllRead = async () => {
    dispatch(markAllRead());
    await apiClient.patch("/notifications/read-all").catch(() => {});
  };

  return (
    <div className="uis-notif" ref={ref}>
      <button
        className="nav-icon-btn uis-notif__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="uis-notif__badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="uis-notif__dropdown">
          <div className="uis-notif__header">
            <span className="uis-notif__title">Notifications</span>
            {unreadCount > 0 && (
              <button className="uis-notif__mark-all" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <ul className="uis-notif__list">
            {items.length === 0 ? (
              <li className="uis-notif__empty">No notifications yet.</li>
            ) : (
              items.slice(0, 20).map((n) => (
                <li
                  key={n.id}
                  className={clsx("uis-notif__item", !n.is_read && "uis-notif__item--unread")}
                  onClick={() => handleMarkRead(n.id)}
                >
                  <div className="uis-notif__item-title">{n.title}</div>
                  <div className="uis-notif__item-msg">{n.message}</div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
