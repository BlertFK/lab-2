import { useMemo, useState } from "react";
import Chart from "../../components/Chart";
import ExportMenu from "../../components/ExportMenu";
import AdminHeader from "../../components/AdminHeader";
import { apiFetch } from "../../utils/api";

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

export default function ReportBuilderPage({ setPage, onLogout, user }) {
  const isAdmin = user?.role === "admin";
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

  const chartConfig = useMemo(() => {
    const firstNumericColumn = columns.find((column) =>
      rows.some((row) => Number(row[column]) > 0)
    );
    const labelColumn = columns.find((column) => column !== firstNumericColumn) || columns[0];

    if (!firstNumericColumn || !labelColumn) return null;

    const data = rows.slice(0, 8).map((row) => ({
      label: stringifyCell(row[labelColumn]) || "-",
      value: Number(row[firstNumericColumn]) || 0,
    }));

    const typeByReport = {
      sales: "line",
      listings: "pie",
      "top-properties": "bar",
      "revenue-by-agent": "bar",
      "pending-offers-aging": "bar",
      "active-subscriptions": "pie",
    };

    return {
      data,
      type: typeByReport[reportType] || "bar",
      metric: firstNumericColumn,
    };
  }, [columns, reportType, rows]);

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

  const buildExportEndpoint = () =>
    buildEndpoint().replace(selectedReport.endpoint, `${selectedReport.endpoint}/export`);

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

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', sans-serif" }}>
      {isAdmin ? (
        <AdminHeader
          title="Report Builder"
          current="reports"
          showBack
          setPage={setPage}
          onLogout={onLogout}
        />
      ) : (
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
      )}

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 40px" }}>
        <div className="profile-card" style={{ width: "100%", maxWidth: "none", marginBottom: "1.5rem" }}>
          <p className="profile-card-title" style={{ fontSize: "1.1rem" }}>Report Type</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            {REPORT_TYPES.map((item) => {
              const selected = reportType === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setReportType(item.id);
                    setReport(null);
                    setError("");
                  }}
                  // No className — .btn-primary forces 40px height + centered text,
                  // which collapses the card. All styling lives inline so only the
                  // background/border/color change when the card is selected.
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    minHeight: 110,
                    padding: "1.1rem 1.25rem",
                    background: selected ? "#2563eb" : "#fff",
                    color: selected ? "#fff" : "#1e293b",
                    border: selected ? "1px solid #2563eb" : "1px solid var(--border)",
                    borderRadius: 10,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    boxShadow: selected
                      ? "0 4px 14px rgba(37, 99, 235, 0.25)"
                      : "0 1px 2px rgba(0,0,0,0.04)",
                    transition: "background 0.18s, color 0.18s, border-color 0.18s, box-shadow 0.18s",
                  }}
                >
                  <span style={{ display: "block", fontWeight: 700, fontSize: 16, marginBottom: 8, lineHeight: 1.3 }}>
                    {item.label}
                  </span>
                  <span style={{ display: "block", fontSize: 14, lineHeight: 1.55, opacity: selected ? 0.92 : 0.75 }}>
                    {item.description}
                  </span>
                </button>
              );
            })}
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

        <div className="profile-card" style={{ width: "100%", maxWidth: "none" }}>
          <div className="buyer-section-head" style={{ marginBottom: "1.25rem" }}>
            <div>
              <h3 className="buyer-section-title" style={{ fontSize: "1.25rem" }}>Preview</h3>
              <p className="dash-sub" style={{ fontSize: 14 }}>{rows.length ? `${rows.length} rows loaded.` : "Run a preview to load report data."}</p>
            </div>

            <ExportMenu
              exportEndpoint={buildExportEndpoint()}
              disabled={!rows.length}
              filenameBase={report?.type || reportType}
              onError={setError}
            />
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
              {chartConfig && (
                <div style={{ marginBottom: "1.25rem" }}>
                  <Chart
                    type={chartConfig.type}
                    data={chartConfig.data}
                    xKey="label"
                    yKey="value"
                    title="Preview Chart"
                    height={300}
                  />
                  <p className="dash-sub" style={{ margin: 0 }}>Metric: {chartConfig.metric.replace(/_/g, " ")}</p>
                </div>
              )}

              <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid var(--border)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {columns.map((column) => (
                        <th
                          key={column}
                          style={{
                            textAlign: "left",
                            padding: "1rem 1.25rem",
                            borderBottom: "2px solid var(--border)",
                            color: "#475569",
                            fontSize: 13,
                            fontWeight: 700,
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {column.replace(/_/g, " ")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr
                        key={index}
                        style={{ background: index % 2 === 0 ? "#fff" : "#fafafa" }}
                      >
                        {columns.map((column) => (
                          <td
                            key={column}
                            style={{
                              padding: "0.95rem 1.25rem",
                              borderBottom: "1px solid #f1f5f9",
                              color: "#1e293b",
                              fontSize: 15,
                              lineHeight: 1.5,
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
