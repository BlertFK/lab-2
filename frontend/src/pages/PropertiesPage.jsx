import { useState, useEffect } from "react";

const API = "http://localhost:5000/api";

const DEFAULT_IMG = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80";

export default function PropertiesPage({ setPage, setSelectedProperty }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (type) params.append("type", type);
      if (status) params.append("status", status);
      if (minPrice) params.append("minPrice", minPrice);
      if (maxPrice) params.append("maxPrice", maxPrice);

      const res = await fetch(`${API}/properties?${params.toString()}`);
      const data = await res.json();
      setProperties(data.properties || []);
    } catch (err) {
      console.error("Error fetching properties:", err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchProperties(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProperties();
  };

  const handleReset = () => {
    setSearch(""); setType(""); setStatus(""); setMinPrice(""); setMaxPrice("");
    setTimeout(fetchProperties, 100);
  };

  const handleViewDetails = (property) => {
    if (setSelectedProperty) setSelectedProperty(property);
    if (setPage) setPage("propertyDetails");
  };

  const statusBadge = (status) => {
    const c = {
      available: { bg: "#d1fae5", color: "#065f46" },
      sold: { bg: "#fee2e2", color: "#991b1b" },
      rented: { bg: "#ede9fe", color: "#5b21b6" },
    };
    const s = c[status] || c.available;
    return (
      <span style={{ background: s.bg, color: s.color, borderRadius: 999, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>
        {status}
      </span>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)", padding: "120px 40px 40px", color: "white", textAlign: "center" }}>
        <h1 style={{ margin: "0 0 8px", fontSize: 34, fontWeight: 700 }}>Find the Perfect Property</h1>
        <p style={{ margin: "0 0 32px", opacity: 0.8, fontSize: 16 }}>Search in our property listings</p>

        {/* Search bar */}
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, maxWidth: 600, margin: "0 auto" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, location..."
            style={{ flex: 1, padding: "12px 18px", borderRadius: 10, border: "none", fontSize: 15, outline: "none" }}
          />
          <button type="submit" style={{ padding: "12px 24px", background: "#f59e0b", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
            Search
          </button>
        </form>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 40px" }}>

        {/* Filters */}
        <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}
              style={{ padding: "9px 14px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, outline: "none", background: "white", cursor: "pointer" }}>
              <option value="">All</option>
              <option value="Apartment">Apartment</option>
              <option value="House">House</option>
              <option value="Villa">Villa</option>
              <option value="Penthouse">Penthouse</option>
              <option value="Office">Office</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              style={{ padding: "9px 14px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, outline: "none", background: "white", cursor: "pointer" }}>
              <option value="">All</option>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="rented">Rented</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Min price (Euro)</label>
            <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="0"
              style={{ padding: "9px 14px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, outline: "none", width: 110 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Max price (Euro)</label>
            <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="999999"
              style={{ padding: "9px 14px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, outline: "none", width: 110 }} />
          </div>
          <button onClick={fetchProperties} style={{ padding: "9px 20px", background: "#2563eb", color: "white", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            Filter
          </button>
          <button onClick={handleReset} style={{ padding: "9px 20px", background: "white", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            Reset
          </button>
        </div>

        {/* Results count */}
        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>
          {loading ? "Loading..." : `${properties.length} properties found`}
        </p>

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#94a3b8", fontSize: 18 }}>Loading...</div>
        ) : properties.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#94a3b8" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏠</div>
            <p style={{ fontSize: 18, fontWeight: 600 }}>No properties found</p>
            <p style={{ fontSize: 14 }}>Try changing the filters</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
            {properties.map((p) => (
              <div key={p.id} style={{ background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #e2e8f0", transition: "transform 0.2s, box-shadow 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.07)"; }}
              >
                {/* Image */}
                <div style={{ position: "relative", height: 200, overflow: "hidden" }}>
                  <img
                    src={p.image_url || DEFAULT_IMG}
                    alt={p.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => { e.target.src = DEFAULT_IMG; }}
                  />
                  <div style={{ position: "absolute", top: 12, right: 12 }}>{statusBadge(p.status)}</div>
                  <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(0,0,0,0.6)", color: "white", borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>
                    {p.type}
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: "16px 20px" }}>
                  <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#1e293b" }}>{p.title}</h3>
                  <p style={{ margin: "0 0 12px", color: "#64748b", fontSize: 13 }}>📍 {p.location}</p>
                  {p.description && (
                    <p style={{ margin: "0 0 12px", color: "#94a3b8", fontSize: 13, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {p.description}
                    </p>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: "#2563eb" }}>
                      Euro {Number(p.price).toLocaleString()}
                    </span>
                    {p.seller_name && (
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>by {p.seller_name}</span>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div style={{ padding: "12px 20px", borderTop: "1px solid #f1f5f9" }}>
                  <button
                    onClick={() => handleViewDetails(p)}
                    style={{ width: "100%", padding: "10px 0", background: "#2563eb", color: "white", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer" }}
                    onMouseEnter={(e) => (e.target.style.background = "#1d4ed8")}
                    onMouseLeave={(e) => (e.target.style.background = "#2563eb")}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}