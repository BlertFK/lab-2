import { useMemo, useState } from "react";
import { API_BASE, apiFetch } from "../../utils/api";

const REPORT_TYPES = [
  {
    id: "sales",
    label: "Sales by Period",
    endpoint: "/reports/sales",
    description: "Completed transactions grouped by day, week, or month.",
  },
  {
    id: "listings",
    label: "Listings by Status",
    endpoint: "/reports/listings",
    description: "Listing counts and average price grouped by status.",
  },
  {
    id: "top-properties",
    label: "Top Properties by Views",
    endpoint: "/reports/top-properties",
    description: "Most viewed properties with favorites and offer counts.",
  },
  {
    id: "revenue-by-agent",
    label: "Revenue by Agent",
    endpoint: "/reports/revenue-by-agent",
    description: "Completed revenue, commission, and deal size grouped by agent.",
  },
  {
    id: "pending-offers-aging",
    label: "Pending Offers Aging",
    endpoint: "/reports/pending-offers-aging",
    description: "Pending offers grouped by age as of a selected date.",
  },
  {
    id: "active-subscriptions",
    label: "Active Subscriptions",
    endpoint: "/reports/active-subscriptions",
    description: "Active subscription counts, renewals, and monthly revenue.",
  },
];

const getDefaultDate = (offsetDays = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

const stringifyCell = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function ReportBuilderPage({ setPage }) {
  const [reportType, setReportType] = useState("sales");
  const [dateFrom, setDateFrom] = useState(getDefaultDate(-90));
  const [dateTo, setDateTo] = useState(getDefaultDate());
  const [groupBy, setGroupBy] = useState("month");
  const [limit, setLimit] = useState(20);
  const [minAgeDays, setMinAgeDays] = useState(0);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedReport = REPORT_TYPES.find((item) => item.id === reportType) || REPORT_TYPES[0];
  const rows = report?.rows || [];

  const columns = useMemo(() => {
    const seen = new Set();
    const keys = [];

    rows.forEach((row) => {
      Object.keys(row || {}).forEach((key) => {
        if (!seen.has(key)) {
          seen.add(key);
          keys.push(key);
        }
      });
    });

    return keys;
  }, [rows]);

  const chart = useMemo(() => {
    const firstNumericColumn = columns.find((column) =>
      rows.some((row) => Number(row[column]) > 0)
    );
    const labelColumn = columns.find((column) => column !== firstNumericColumn) || columns[0];

    if (!firstNumericColumn || !labelColumn) return [];

    const values = rows.slice(0, 8).map((row) => ({
      label: stringifyCell(row[labelColumn]) || "-",
      value: Number(row[firstNumericColumn]) || 0,
    }));
    const max = Math.max(...values.map((item) => item.value), 1);

    return values.map((item) => ({
      ...item,
      percent: Math.max((item.value / max) * 100, item.value > 0 ? 6 : 0),
      metric: firstNumericColumn,
    }));
  }, [columns, rows]);

  const buildEndpoint = () => {
    const params = new URLSearchParams();

    if (dateFrom) params.append("date_from", dateFrom);
    if (dateTo) params.append("date_to", dateTo);
    if (reportType === "sales") params.append("group_by", groupBy);
    if (reportType === "top-properties") params.append("limit", String(limit || 20));
    if (reportType === "pending-offers-aging") {
      params.append("as_of_date", dateTo);
      params.append("min_age_days", String(minAgeDays || 0));
    }
    if (reportType === "active-subscriptions") params.append("as_of_date", dateTo);

    const query = params.toString();
    return `${selectedReport.endpoint}${query ? `?${query}` : ""}`;
  };

  const handlePreview = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch(buildEndpoint());
      setReport(data.report);
    } catch (err) {
      setReport(null);
      setError(err.message || "Could not load report preview.");
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format) => {
    if (!rows.length) return;

    setError("");

    try {
      const token = localStorage.getItem("token");
      const exportEndpoint = buildEndpoint().replace(selectedReport.endpoint, `${selectedReport.endpoint}/export`);
      const separator = exportEndpoint.includes("?") ? "&" : "?";
      const response = await fetch(`${API_BASE}${exportEndpoint}${separator}format=${format}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Export failed.");
      }

      const disposition = response.headers.get("Content-Disposition") || "";
      const filenameMatch = disposition.match(/filename="([^"]+)"/);
      const filename = filenameMatch?.[1] || `${report?.type || reportType}.${format === "excel" ? "xlsx" : "csv"}`;
      const blob = await response.blob();
      downloadBlob(blob, filename);
    } catch (err) {
      setError(err.message || "Export failed.");
    }
  };

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <h2 className="dash-welcome">Report Builder</h2>
            <p className="dash-sub">Build domain reports from the current RealEstate data.</p>
          </div>
          {setPage && (
            <button className="btn-secondary" style={{ color: "var(--text)" }} onClick={() => setPage("sellerDashboard")} type="button">
              Back
            </button>
          )}
        </div>
      </div>

      <div className="dash-body">
        <div className="profile-card" style={{ maxWidth: 1100, marginBottom: "1.5rem" }}>
          <p className="profile-card-title">Report Type</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
            {REPORT_TYPES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setReportType(item.id);
                  setReport(null);
                  setError("");
                }}
                className={reportType === item.id ? "btn-primary" : "btn-ghost"}
                style={{
                  textAlign: "left",
                  minHeight: 96,
                  padding: "1rem",
                  border: reportType === item.id ? "1px solid var(--primary)" : "1px solid var(--border)",
                  borderRadius: 8,
                }}
              >
                <span style={{ display: "block", fontWeight: 700, marginBottom: 6 }}>{item.label}</span>
                <span style={{ display: "block", fontSize: 13, lineHeight: 1.5, opacity: reportType === item.id ? 0.9 : 1 }}>
                  {item.description}
                </span>
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", alignItems: "end" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Date From</label>
              <input className="form-input" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Date To</label>
              <input className="form-input" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
            </div>

            {reportType === "sales" && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Group By</label>
                <select className="form-select" value={groupBy} onChange={(event) => setGroupBy(event.target.value)}>
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                </select>
              </div>
            )}

            {reportType === "top-properties" && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Limit</label>
                <input className="form-input" type="number" min="1" max="100" value={limit} onChange={(event) => setLimit(event.target.value)} />
              </div>
            )}

            {reportType === "pending-offers-aging" && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Minimum Age Days</label>
                <input className="form-input" type="number" min="0" value={minAgeDays} onChange={(event) => setMinAgeDays(event.target.value)} />
              </div>
            )}

            <button className="btn-submit" type="button" onClick={handlePreview} disabled={loading}>
              {loading ? "Loading..." : "Preview"}
            </button>
          </div>
        </div>

        <div className="profile-card" style={{ maxWidth: 1100 }}>
          <div className="buyer-section-head" style={{ marginBottom: "1rem" }}>
            <div>
              <h3 className="buyer-section-title">Preview</h3>
              <p className="dash-sub">{rows.length ? `${rows.length} rows loaded.` : "Run a preview to load report data."}</p>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button className="btn-ghost" type="button" onClick={() => exportReport("csv")} disabled={!rows.length}>
                CSV Export
              </button>
              <button className="btn-primary" type="button" onClick={() => exportReport("excel")} disabled={!rows.length}>
                Excel Export
              </button>
              <button className="btn-ghost" type="button" onClick={() => exportReport("pdf")} disabled={!rows.length}>
                PDF Export
              </button>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {!error && loading && <p className="loading-text">Loading report preview...</p>}

          {!error && !loading && rows.length === 0 && (
            <div className="buyer-empty-state">
              <p>No preview data.</p>
              <span>Select a report type and date range, then run Preview.</span>
            </div>
          )}

          {!error && !loading && rows.length > 0 && (
            <>
              {chart.length > 0 && (
                <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1.25rem" }}>
                  <p className="profile-card-title" style={{ marginBottom: 0, paddingBottom: 0, borderBottom: "none" }}>
                    Preview Chart
                  </p>
                  {chart.map((item, index) => (
                    <div key={`${item.label}-${index}`} style={{ display: "grid", gridTemplateColumns: "minmax(120px, 220px) 1fr auto", gap: "0.75rem", alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
                      <div style={{ height: 12, borderRadius: 999, background: "var(--primary-light)", overflow: "hidden" }}>
                        <div style={{ width: `${item.percent}%`, height: "100%", background: "var(--primary)", borderRadius: 999 }} />
                      </div>
                      <span style={{ fontSize: 12, color: "var(--text-muted)", minWidth: 64, textAlign: "right" }}>{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                  <p className="dash-sub" style={{ margin: 0 }}>Metric: {chart[0].metric.replace(/_/g, " ")}</p>
                </div>
              )}

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
                  <thead>
                    <tr>
                      {columns.map((column) => (
                        <th
                          key={column}
                          style={{
                            textAlign: "left",
                            padding: "0.85rem",
                            borderBottom: "1px solid var(--border)",
                            color: "var(--text-muted)",
                            fontSize: 12,
                            textTransform: "uppercase",
                          }}
                        >
                          {column.replace(/_/g, " ")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr key={index}>
                        {columns.map((column) => (
                          <td
                            key={column}
                            style={{
                              padding: "0.85rem",
                              borderBottom: "1px solid var(--border)",
                              color: "var(--text)",
                              fontSize: 14,
                            }}
                          >
                            {stringifyCell(row[column]) || "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
