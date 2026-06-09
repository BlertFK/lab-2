import { useEffect, useRef, useState, useCallback } from "react";
import { apiFetch } from "../utils/api";
import { connectSocket } from "../lib/socket";

/* ─── helpers ─────────────────────────────────────────────── */
const formatTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0)
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)
    return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const formatFull = (iso) =>
  iso
    ? new Date(iso).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

const initials = (name = "") =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

/* ─── ThreadListItem ───────────────────────────────────────── */
function ThreadListItem({ thread, isActive, onClick, currentUserId }) {
  const unread = thread.unread_count || 0;
  const lastMsg = thread.last_message_body || "";
  const preview = lastMsg.length > 60 ? lastMsg.slice(0, 60) + "…" : lastMsg;

  return (
    <button
      type="button"
      className={`msg-thread-item ${isActive ? "active" : ""}`}
      onClick={onClick}
    >
      <div className="msg-thread-avatar">{initials(thread.other_participant_name)}</div>
      <div className="msg-thread-info">
        <div className="msg-thread-top">
          <span className="msg-thread-name">{thread.other_participant_name || "Unknown"}</span>
          <span className="msg-thread-time">{formatTime(thread.last_message_at || thread.created_at)}</span>
        </div>
        {thread.property_title && (
          <span className="msg-thread-property">🏠 {thread.property_title}</span>
        )}
        <div className="msg-thread-bottom">
          <span className="msg-thread-preview">{preview || "No messages yet"}</span>
          {unread > 0 && <span className="msg-unread-badge">{unread}</span>}
        </div>
      </div>
    </button>
  );
}

/* ─── ChatBubble ───────────────────────────────────────────── */
function ChatBubble({ message, isMine }) {
  return (
    <div className={`msg-bubble-row ${isMine ? "mine" : "theirs"}`}>
      {!isMine && (
        <div className="msg-bubble-avatar">{initials(message.sender_name)}</div>
      )}
      <div className="msg-bubble-wrap">
        {!isMine && (
          <span className="msg-bubble-sender">{message.sender_name}</span>
        )}
        <div className={`msg-bubble ${isMine ? "msg-bubble-mine" : "msg-bubble-theirs"}`}>
          {message.body}
        </div>
        <div className="msg-bubble-meta">
          <span>{formatFull(message.created_at)}</span>
          {isMine && message.read_at && <span className="msg-read-receipt">✓ Read</span>}
        </div>
      </div>
    </div>
  );
}

/* ─── EmptyChat ────────────────────────────────────────────── */
function EmptyChat() {
  return (
    <div className="msg-empty-chat">
      <div className="msg-empty-icon">💬</div>
      <p className="msg-empty-title">Select a conversation</p>
      <span className="msg-empty-sub">
        Choose a thread from the left to view messages.
      </span>
    </div>
  );
}

/* ─── EmptyThreadList ──────────────────────────────────────── */
function EmptyThreadList() {
  return (
    <div className="msg-empty-threads">
      <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
      <p style={{ fontWeight: 600, marginBottom: 4 }}>No conversations yet</p>
      <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
        Messages from buyers will appear here.
      </span>
    </div>
  );
}

/* ─── MessagesPage (shared buyer + seller) ─────────────────── */
export default function MessagesPage({
  user,
  setPage,
  setRootPage,
  onLogout,
  role, // "seller" | "buyer"
}) {
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [typingUsers, setTypingUsers] = useState({});

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const socketRef = useRef(null);
  const activeThreadRef = useRef(null);
  const typingTimerRef = useRef(null);

  useEffect(() => {
    activeThreadRef.current = activeThread;
  }, [activeThread]);

  /* ── scroll to bottom ── */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(scrollToBottom, [messages, scrollToBottom]);

  /* ── load thread list ── */
  const loadThreads = useCallback(async () => {
    setLoadingThreads(true);
    setError("");
    try {
      const data = await apiFetch("/threads");
      setThreads(data.threads || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingThreads(false);
    }
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  const reorderThread = useCallback((threadId, patch = {}) => {
    setThreads((prev) => {
      const index = prev.findIndex((thread) => thread.id === threadId);
      if (index === -1) return prev;

      const nextThread = { ...prev[index], ...patch };
      const next = prev.filter((thread) => thread.id !== threadId);
      return [nextThread, ...next];
    });
  }, []);

  const mergeThreadUpdate = useCallback((thread) => {
    if (!thread?.id) return;
    setThreads((prev) => {
      const index = prev.findIndex((item) => item.id === thread.id);
      if (index === -1) return prev;

      const merged = { ...prev[index], ...thread };
      const next = prev.filter((item) => item.id !== thread.id);
      return [merged, ...next];
    });
    setActiveThread((current) => (current?.id === thread.id ? { ...current, ...thread } : current));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return undefined;

    const socket = connectSocket();
    socketRef.current = socket;

    const onConnectError = (err) => {
      console.warn("Socket connection error:", err.message);
    };

    const onMessageNew = ({ message, thread }) => {
      if (!message?.id) return;
      if (message.sender_id === user.id) return;

      const currentThread = activeThreadRef.current;
      const isActiveThread = currentThread?.id === message.thread_id;

      if (isActiveThread) {
        setMessages((prev) => (
          prev.some((item) => item.id === message.id) ? prev : [...prev, message]
        ));
        apiFetch(`/messages/${message.id}/read`, { method: "PATCH" }).catch(() => {});
      }

      const lastMessagePatch = {
        ...(thread || {}),
        last_message_body: message.body,
        last_message_at: message.created_at,
        unread_count: isActiveThread ? 0 : undefined,
      };
      if (!isActiveThread) delete lastMessagePatch.unread_count;
      reorderThread(message.thread_id, lastMessagePatch);
    };

    const onMessageRead = ({ message }) => {
      if (!message?.id) return;
      setMessages((prev) => prev.map((item) => (
        item.id === message.id ? { ...item, read_at: message.read_at } : item
      )));
    };

    const onThreadUpdated = ({ thread }) => {
      mergeThreadUpdate(thread);
    };

    const onThreadTyping = ({ thread_id, user_id, user_name, is_typing }) => {
      if (!thread_id || user_id === user.id) return;
      setTypingUsers((prev) => {
        const key = `${thread_id}:${user_id}`;
        const next = { ...prev };
        if (is_typing) {
          next[key] = { thread_id, user_id, user_name };
        } else {
          delete next[key];
        }
        return next;
      });
    };

    socket.on("connect_error", onConnectError);
    socket.on("message:new", onMessageNew);
    socket.on("message:read", onMessageRead);
    socket.on("thread:updated", onThreadUpdated);
    socket.on("thread:typing", onThreadTyping);

    return () => {
      socket.off("connect_error", onConnectError);
      socket.off("message:new", onMessageNew);
      socket.off("message:read", onMessageRead);
      socket.off("thread:updated", onThreadUpdated);
      socket.off("thread:typing", onThreadTyping);
      if (activeThreadRef.current?.id) {
        socket.emit("thread:leave", { thread_id: activeThreadRef.current.id });
      }
      socketRef.current = null;
    };
  }, [mergeThreadUpdate, reorderThread, user.id]);

  useEffect(() => () => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
  }, []);

  /* ── open a thread ── */
  const openThread = useCallback(
    async (thread) => {
      setActiveThread(thread);
      socketRef.current?.emit("thread:join", { thread_id: thread.id });
      setMessages([]);
      setLoadingMessages(true);
      setInput("");
      inputRef.current?.focus();

      try {
        const data = await apiFetch(`/threads/${thread.id}/messages`);
        setMessages(data.messages || []);

        // Mark unread messages as read
        const unreadIds = (data.messages || [])
          .filter((m) => m.sender_id !== user.id && !m.read_at)
          .map((m) => m.id);

        for (const id of unreadIds) {
          apiFetch(`/messages/${id}/read`, { method: "PATCH" }).catch(() => {});
        }

        // Optimistically clear unread count in thread list
        setThreads((prev) =>
          prev.map((t) => (t.id === thread.id ? { ...t, unread_count: 0 } : t))
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingMessages(false);
      }
    },
    [user.id]
  );

  useEffect(() => {
    if (!activeThread?.id) return undefined;

    const threadId = activeThread.id;
    socketRef.current?.emit("thread:join", { thread_id: threadId });
    setTypingUsers((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (next[key].thread_id === threadId) delete next[key];
      });
      return next;
    });

    return () => {
      socketRef.current?.emit("thread:leave", { thread_id: threadId });
    };
  }, [activeThread?.id]);

  const emitTyping = useCallback((value) => {
    if (!activeThread?.id) return;
    socketRef.current?.emit("thread:typing", {
      thread_id: activeThread.id,
      is_typing: value,
    });
  }, [activeThread?.id]);

  /* ── send message ── */
  const sendMessage = useCallback(async () => {
    const body = input.trim();
    if (!body || !activeThread || sending) return;

    setSending(true);
    emitTyping(false);
    const optimistic = {
      id: `opt-${Date.now()}`,
      thread_id: activeThread.id,
      sender_id: user.id,
      sender_name: user.name,
      body,
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");

    try {
      const data = await apiFetch(`/threads/${activeThread.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      const real = data.data;
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? real : m))
      );
      // Update thread last message preview
      reorderThread(activeThread.id, {
        last_message_body: body,
        last_message_at: real.created_at,
      });
    } catch (err) {
      // Revert optimistic on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setError(err.message);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [input, activeThread, sending, user, reorderThread, emitTyping]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    emitTyping(Boolean(e.target.value.trim()));

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      emitTyping(false);
    }, 1200);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /* ── nav labels by role ── */
  const navLabel = role === "seller" ? "Seller Dashboard" : "Buyer Dashboard";
  const navTabs =
    role === "seller"
      ? [
          { key: "main", label: "Overview" },
          { key: "myProperties", label: "My Properties" },
          { key: "sellerMessages", label: "Messages", active: true },
        ]
      : [
          { key: "main", label: "Overview" },
          { key: "favorites", label: "Favorites" },
          { key: "profile", label: "Profile" },
          { key: "buyerMessages", label: "Messages", active: true },
        ];

  const activeTypingUsers = Object.values(typingUsers).filter(
    (item) => item.thread_id === activeThread?.id
  );
  const typingVisible = activeTypingUsers.length > 0;
  const typingInitials = initials(activeTypingUsers[0]?.user_name || activeThread?.other_participant_name || "");

  return (
    <div className="dashboard">
      {/* ── header ── */}
      <div className="dash-header">
        <div className="dashboard-brand-row">
          <div className="dashboard-brand" onClick={() => setRootPage("home")}>
            <div className="brand-logo">
              <div className="logo-dot" />
            </div>
            <span className="brand-name">UrbanKeys</span>
          </div>
          <button className="btn-ghost" onClick={() => setRootPage("home")}>
            Home
          </button>
        </div>

        <div className="buyer-header-row">
          <div>
            <h2 className="dash-welcome">{navLabel}</h2>
            <p className="dash-sub">Your conversations with {role === "seller" ? "buyers" : "sellers"}.</p>
          </div>
        </div>

        {/* subnav */}
        <div className="buyer-subnav-row">
          <div className="buyer-subnav">
            {navTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`buyer-subnav-btn ${tab.active ? "active" : ""}`}
                onClick={() => setPage(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="buyer-subnav-actions">
            <button
              type="button"
              className="buyer-subnav-action"
              onClick={() => setRootPage("home")}
            >
              Home
            </button>
            <button
              type="button"
              className="buyer-subnav-action buyer-subnav-action-danger"
              onClick={onLogout}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* ── body ── */}
      <div className="dash-body" style={{ padding: "2rem 5%" }}>
        {error && (
          <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        <div className="msg-layout">
          {/* ── Thread list (left) ── */}
          <div className="msg-thread-list">
            <div className="msg-thread-list-header">
              <h3 className="msg-thread-list-title">Conversations</h3>
              {loadingThreads && (
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Loading…
                </span>
              )}
            </div>

            <div className="msg-thread-scroll">
              {!loadingThreads && threads.length === 0 && <EmptyThreadList />}
              {threads.map((t) => (
                <ThreadListItem
                  key={t.id}
                  thread={t}
                  isActive={activeThread?.id === t.id}
                  onClick={() => openThread(t)}
                  currentUserId={user.id}
                />
              ))}
            </div>
          </div>

          {/* ── Chat panel (right) ── */}
          <div className="msg-chat-panel">
            {!activeThread ? (
              <EmptyChat />
            ) : (
              <>
                {/* Chat header */}
                <div className="msg-chat-header">
                  <div className="msg-chat-header-avatar">
                    {initials(activeThread.other_participant_name)}
                  </div>
                  <div>
                    <p className="msg-chat-header-name">
                      {activeThread.other_participant_name}
                    </p>
                    {activeThread.property_title && (
                      <p className="msg-chat-header-sub">
                        🏠 {activeThread.property_title}
                      </p>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="msg-chat-messages">
                  {loadingMessages && (
                    <p className="loading-text" style={{ textAlign: "center", padding: "2rem" }}>
                      Loading messages…
                    </p>
                  )}

                  {!loadingMessages && messages.length === 0 && (
                    <div className="msg-empty-chat" style={{ flex: 1 }}>
                      <div className="msg-empty-icon">✉️</div>
                      <p className="msg-empty-title">No messages yet</p>
                      <span className="msg-empty-sub">Send the first message below.</span>
                    </div>
                  )}

                  {messages.map((m) => (
                    <ChatBubble
                      key={m.id}
                      message={m}
                      isMine={m.sender_id === user.id}
                    />
                  ))}

                  {/* Typing indicator placeholder */}
                  {typingVisible && (
                    <div className="msg-bubble-row theirs">
                      <div className="msg-bubble-avatar">{typingInitials}</div>
                      <div className="msg-bubble msg-bubble-theirs msg-typing">
                        <span /><span /><span />
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Composer */}
                <div className="msg-composer">
                  <textarea
                    ref={inputRef}
                    className="msg-composer-input"
                    placeholder="Type a message… (Enter to send)"
                    value={input}
                    rows={1}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onBlur={() => emitTyping(false)}
                    disabled={sending}
                  />
                  <button
                    type="button"
                    className="msg-composer-send"
                    onClick={sendMessage}
                    disabled={!input.trim() || sending}
                  >
                    {sending ? <span className="spinner" /> : "Send"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
