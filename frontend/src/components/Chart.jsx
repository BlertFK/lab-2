import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2", "#db2777", "#475569"];

const formatLabel = (value) => String(value || "").replace(/_/g, " ");

export default function Chart({ type = "bar", data = [], xKey = "label", yKey = "value", title, height = 280 }) {
  const rows = Array.isArray(data) ? data : [];

  if (!rows.length) return null;

  const chartType = ["bar", "line", "pie"].includes(type) ? type : "bar";

  return (
    <div style={{ width: "100%", marginBottom: "1.25rem" }}>
      {title && (
        <p className="profile-card-title" style={{ marginBottom: "0.75rem", paddingBottom: 0, borderBottom: "none" }}>
          {title}
        </p>
      )}

      <div style={{ width: "100%", height, minHeight: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "line" ? (
            <LineChart data={rows} margin={{ top: 12, right: 18, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey={xKey} tick={{ fontSize: 12 }} tickFormatter={formatLabel} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey={yKey} stroke="#2563eb" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          ) : chartType === "pie" ? (
            <PieChart margin={{ top: 12, right: 18, bottom: 8, left: 18 }}>
              <Tooltip />
              <Legend />
              <Pie data={rows} dataKey={yKey} nameKey={xKey} innerRadius={56} outerRadius={96} paddingAngle={2}>
                {rows.map((entry, index) => (
                  <Cell key={`${entry?.[xKey] || "slice"}-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          ) : (
            <BarChart data={rows} margin={{ top: 12, right: 18, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey={xKey} tick={{ fontSize: 12 }} tickFormatter={formatLabel} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey={yKey} fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
