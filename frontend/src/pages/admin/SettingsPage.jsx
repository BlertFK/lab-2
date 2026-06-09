// B47: Settings admin page.

import { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api";
import AdminHeader from "../../components/AdminHeader";

function asInputValue(s) {
  if (s.type === "json" || s.type === "object" || s.type === "array") {
    return s.value == null ? "" : JSON.stringify(s.value, null, 2);
  }
  if (s.type === "boolean") return String(!!s.value);
  return s.value == null ? "" : String(s.value);
}

export default function SettingsPage({ setPage, onLogout, showToast }) {
  const [rows, setRows] = useState([]);
  const [drafts, setDrafts] = useState({});   // key -> current input string
  const [savingKey, setSavingKey] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const list = await apiFetch("/settings");
      setRows(list);
      const d = {};
      list.forEach((s) => { d[s.key] = asInputValue(s); });
      setDrafts(d);
    } catch (err) { setError(err.message); }
  };

  useEffect(() => { load(); }, []);

  const save = async (s) => {
    setError("");
    setSavingKey(s.key);
    try {
      let value = drafts[s.key];
      if (s.type === "boolean") value = value === "true";
      else if (s.type === "number") value = Number(value);
      else if (s.type === "json") {
        try { value = value ? JSON.parse(value) : null; } catch { throw new Error("Invalid JSON"); }
      }
      await apiFetch(`/settings/${encodeURIComponent(s.key)}`, {
        method: "PUT",
        body: JSON.stringify({ value, type: s.type, is_public: s.is_public }),
      });
      if (showToast) showToast(`${s.key} updated.`, "success");
      await load();
    } catch (err) { setError(err.message); } finally { setSavingKey(null); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', sans-serif" }}>
      <AdminHeader title="Settings" current="settings" showBack stats={[{ value: rows.length, label: "Keys" }]} setPage={setPage} onLogout={onLogout} />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 40px" }}>
        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

        <div className="profile-card" style={{ maxWidth: "none" }}>
          <p className="profile-card-title">App settings</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {rows.map((s) => (
              <div key={s.key} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, background: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <code style={{ background: "#f1f5f9", padding: "3px 8px", borderRadius: 4, fontSize: 13, color: "#1e293b" }}>{s.key}</code>
                    <span style={{ marginLeft: 10, fontSize: 12, color: "#64748b" }}>
                      {s.type}{s.is_public ? " · public" : ""}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>
                    updated {new Date(s.updated_at).toLocaleString("en-GB")}
                  </div>
                </div>

                {s.description && (
                  <div className="dash-sub" style={{ fontSize: 13, marginBottom: 8 }}>{s.description}</div>
                )}

                {s.type === "boolean" ? (
                  <select
                    className="form-select"
                    value={drafts[s.key] ?? "false"}
                    onChange={(e) => setDrafts({ ...drafts, [s.key]: e.target.value })}
                  >
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                ) : s.type === "json" ? (
                  <textarea
                    className="form-input"
                    rows={4}
                    style={{ fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontSize: 13 }}
                    value={drafts[s.key] ?? ""}
                    onChange={(e) => setDrafts({ ...drafts, [s.key]: e.target.value })}
                  />
                ) : (
                  <input
                    className="form-input"
                    type={s.type === "number" ? "number" : "text"}
                    value={drafts[s.key] ?? ""}
                    onChange={(e) => setDrafts({ ...drafts, [s.key]: e.target.value })}
                  />
                )}

                <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                  <button
                    className="btn-submit"
                    onClick={() => save(s)}
                    disabled={savingKey === s.key}
                  >
                    {savingKey === s.key ? "Saving…" : "Save"}
                  </button>
                  <button
                    className="btn-ghost"
                    style={{ height: 40 }}
                    onClick={() => setDrafts({ ...drafts, [s.key]: asInputValue(s) })}
                  >
                    Reset
                  </button>
                </div>
              </div>
            ))}
            {rows.length === 0 && <p className="dash-sub">No settings yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
