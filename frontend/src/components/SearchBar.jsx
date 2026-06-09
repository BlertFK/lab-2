// B50: Universal SearchBar with debounce + dropdown of grouped results.
// Drop into the navbar or any page; passes the query string up via onSearch
// (or navigates to /search?q=… if setPage is supplied).

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../utils/api";

const ENTITY_LABELS = {
  properties: "Properties",
  users: "Users",
  viewings: "Viewings",
  offers: "Offers",
  messages: "Messages",
};

const ENTITY_ICONS = {
  properties: "🏠",
  users: "👤",
  viewings: "📅",
  offers: "💰",
  messages: "✉️",
};

export default function SearchBar({
  setPage,
  onSearch,
  placeholder = "Search properties, users, viewings…",
  scope = "global",     // global | properties | …
  style = {},
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!q || q.length < 2) { setResults({}); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q, limit: "5" });
        if (scope !== "global") params.set("entities", scope);
        const data = await apiFetch(`/search?${params}`);
        setResults(data.results || {});
        setOpen(true);
      } catch (_) { /* ignore */ } finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [q, scope]);

  const submit = () => {
    if (!q.trim()) return;
    if (onSearch) return onSearch(q);
    if (setPage) setPage("search", { q });
  };

  const entries = Object.entries(results).filter(([, rows]) => rows.length > 0);

  return (
    <div ref={wrapRef} style={{ position: "relative", flex: 1, maxWidth: 560, ...style }}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => q.length >= 2 && setOpen(true)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder={placeholder}
        style={{
          width: "100%",
          height: 40,
          padding: "0 14px 0 38px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.3)",
          background: "rgba(255,255,255,0.15)",
          color: "white",
          fontSize: 14,
          outline: "none",
        }}
      />
      <span style={{ position: "absolute", left: 12, top: 10, color: "rgba(255,255,255,0.7)" }}>🔎</span>

      {open && (q.length >= 2) && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
          background: "white", borderRadius: 12,
          boxShadow: "0 12px 40px rgba(0,0,0,0.18)", zIndex: 1200,
          color: "#1e293b", maxHeight: 460, overflow: "auto",
        }}>
          {loading ? (
            <div style={{ padding: 16, color: "#64748b" }}>Searching…</div>
          ) : entries.length === 0 ? (
            <div style={{ padding: 16, color: "#94a3b8" }}>No matches.</div>
          ) : entries.map(([entity, rows]) => (
            <div key={entity}>
              <div style={{ padding: "8px 14px", background: "#f8fafc", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {ENTITY_ICONS[entity]} {ENTITY_LABELS[entity] || entity}
              </div>
              {rows.map((r) => (
                <a
                  key={`${entity}-${r.id}`}
                  href={r.link || "#"}
                  onClick={(e) => {
                    if (!r.link || r.link === "#") {
                      e.preventDefault();
                    }
                    setOpen(false);
                  }}
                  style={{
                    display: "block",
                    padding: "10px 14px",
                    borderBottom: "1px solid #f1f5f9",
                    color: "#1e293b",
                    textDecoration: "none",
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{r.title}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{r.subtitle}</div>
                </a>
              ))}
            </div>
          ))}

          {entries.length > 0 && setPage && (
            <button
              onClick={() => { setOpen(false); submit(); }}
              style={{
                width: "100%", padding: "10px 14px", background: "#f8fafc",
                border: "none", borderTop: "1px solid #e2e8f0",
                cursor: "pointer", color: "#2563eb", fontWeight: 600, fontSize: 13,
              }}
            >
              See all results for "{q}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}
