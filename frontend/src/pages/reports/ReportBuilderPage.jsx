import { useMemo, useState } from "react";
import Chart from "../../components/Chart";
import ExportMenu from "../../components/ExportMenu";
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
