import { API_BASE } from "../utils/api";

const FORMATS = [
  { format: "csv", label: "CSV Export", className: "btn-ghost", extension: "csv" },
  { format: "excel", label: "Excel Export", className: "btn-primary", extension: "xlsx" },
  { format: "pdf", label: "PDF Export", className: "btn-ghost", extension: "pdf" },
];

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

const appendFormat = (endpoint, format) => {
  const separator = endpoint.includes("?") ? "&" : "?";
  return `${endpoint}${separator}format=${format}`;
};

export default function ExportMenu({ exportEndpoint, disabled = false, filenameBase = "report", onError }) {
  const handleExport = async ({ format, extension }) => {
    if (disabled || !exportEndpoint) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}${appendFormat(exportEndpoint, format)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        let message = "Export failed.";

        try {
          const data = await response.json();
          message = data.message || message;
        } catch (_err) {
          message = response.statusText || message;
        }

        throw new Error(message);
      }

      const disposition = response.headers.get("Content-Disposition") || "";
      const filenameMatch = disposition.match(/filename="([^"]+)"/);
      const blob = await response.blob();

      downloadBlob(blob, filenameMatch?.[1] || `${filenameBase}.${extension}`);
    } catch (err) {
      if (onError) onError(err.message || "Export failed.");
    }
  };

  return (
    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
      {FORMATS.map((item) => (
        <button
          key={item.format}
          className={item.className}
          type="button"
          onClick={() => handleExport(item)}
          disabled={disabled || !exportEndpoint}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
