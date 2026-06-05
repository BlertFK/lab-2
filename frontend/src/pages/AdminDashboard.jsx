import { useState, useEffect } from "react";

const API = "http://localhost:5000/api";
function getToken() { return localStorage.getItem("token"); }
const getHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });

const inputStyle = {
  width: "100%", padding: "10px 14px", borderRadius: 8,
  border: "1px solid #e2e8f0", fontSize: 14, outline: "none",
  boxSizing: "border-box", marginTop: 6, fontFamily: "'Segoe UI', sans-serif",
};
const labelStyle = { fontSize: 13, fontWeight: 600, color: "#475569", display: "block" };
const btnDanger = {
  background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5",
  borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontWeight: 600, fontSize: 13,
};
const btnWarning = {
  background: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d",
  borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontWeight: 600, fontSize: 13, marginRight: 6,
};

const Modal = ({ title, onClose, onSave, saving, children }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ background: "white", borderRadius: 16, padding: 32, width: 460, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1e293b" }}>{title}</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#94a3b8" }}>x</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{children}</div>
      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "11px 0", borderRadius: 8, border: "1px solid #e2e8f0", background: "white", color: "#64748b", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Cancel</button>
        <button onClick={onSave} disabled={saving} style={{ flex: 1, padding: "11px 0", borderRadius: 8, border: "none", background: saving ? "#93c5fd" : "#2563eb", color: "white", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  </div>
);

export default function AdminDashboard({ onLogout }) {
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // User modal
  const [userModal, setUserModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [userForm, setUserForm] = useState({ name: "", email: "", password: "", role: "buyer" });
  const [userLoading, setUserLoading] = useState(false);

  // Property modal (edit only)
  const [propModal, setPropModal] = useState(false);
  const [editProp, setEditProp] = useState(null);
  const [propForm, setPropForm] = useState({ title: "", description: "", price: "", location: "", type: "", status: "available", image_url: "" });
  const [propLoading, setPropLoading] = useState(false);

  const showMsg = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/users`, { headers: getHeaders() });
      setUsers(await res.json());
    } catch { showMsg("Error loading data", "error"); }
    setLoading(false);
  };

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/properties`, { headers: getHeaders() });
      setProperties(await res.json());
    } catch { showMsg("Error loading data", "error"); }
    setLoading(false);
  };

  useEffect(() => {
    if (tab === "users") fetchUsers();
    else fetchProperties();
  }, [tab]);

  // ── USER CRUD ──────────────────────────────
  const openAddUser = () => {
    setEditUser(null);
    setUserForm({ name: "", email: "", password: "", role: "buyer" });
    setUserModal(true);
  };

  const openEditUser = (u) => {
    setEditUser(u);
    setUserForm({ name: u.name, email: u.email, password: "", role: u.role });
    setUserModal(true);
  };

  const saveUser = async () => {
    if (!userForm.name || !userForm.email || (!editUser && !userForm.password)) {
      showMsg("Please fill in all fields!", "error"); return;
    }
    setUserLoading(true);
    try {
      let res;
      if (editUser) {
        const body = { name: userForm.name, email: userForm.email, role: userForm.role };
        if (userForm.password) body.password = userForm.password;
        res = await fetch(`${API}/admin/users/${editUser.id}`, {
          method: "PUT", headers: getHeaders(), body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`${API}/auth/register`, {
          method: "POST", headers: getHeaders(), body: JSON.stringify(userForm),
        });
      }
      const data = await res.json();
      if (res.ok) {
        showMsg(editUser ? "User updated successfully!" : "User added successfully!");
        setUserModal(false);
        fetchUsers();
      } else {
        showMsg(data.message || "An error occurred", "error");
      }
    } catch { showMsg("An error occurred", "error"); }
    setUserLoading(false);
  };

  const deleteUser = async (id) => {
    if (!confirm("Delete this user?")) return;
    const res = await fetch(`${API}/admin/users/${id}`, { method: "DELETE", headers: getHeaders() });
    if (res.ok) { setUsers((p) => p.filter((u) => u.id !== id)); showMsg("Deleted successfully!"); }
    else showMsg("Error deleting user", "error");
  };

  // ── PROPERTY — edit and delete only ──────
  const openEditProp = (p) => {
    setEditProp(p);
    setPropForm({ title: p.title, description: p.description || "", price: p.price, location: p.location, type: p.type, status: p.status, image_url: p.image_url || "" });
    setPropModal(true);
  };

  const saveProp = async () => {
    if (!propForm.title || !propForm.price || !propForm.location) {
      showMsg("Please fill in all required fields!", "error"); return;
    }
    setPropLoading(true);
    try {
      const res = await fetch(`${API}/admin/properties/${editProp.id}`, {
        method: "PUT", headers: getHeaders(), body: JSON.stringify(propForm),
      });
      const data = await res.json();
      if (res.ok) {
        showMsg("Property updated successfully!");
        setPropModal(false);
        fetchProperties();
      } else {
        showMsg(data.message || "An error occurred", "error");
      }
    } catch { showMsg("An error occurred", "error"); }
    setPropLoading(false);
  };

  const deleteProp = async (id) => {
    if (!confirm("Delete this property?")) return;
    const res = await fetch(`${API}/admin/properties/${id}`, { method: "DELETE", headers: getHeaders() });
    if (res.ok) { setProperties((p) => p.filter((x) => x.id !== id)); showMsg("Deleted successfully!"); }
    else showMsg("Error deleting property", "error");
  };
  
  const roleBadge = (role) => {
    const c = { admin: ["#fef3c7","#92400e","#fcd34d"], seller: ["#dbeafe","#1e40af","#93c5fd"], buyer: ["#d1fae5","#065f46","#6ee7b7"] };
    const [bg, color, border] = c[role] || c.buyer;
    return <span style={{ background: bg, color, border: `1px solid ${border}`, borderRadius: 999, padding: "2px 12px", fontSize: 12, fontWeight: 600 }}>{role}</span>;
  };

  const statusBadge = (status) => {
    const c = { available: ["#d1fae5","#065f46","#6ee7b7"], sold: ["#fee2e2","#991b1b","#fca5a5"], rented: ["#ede9fe","#5b21b6","#c4b5fd"] };
    const [bg, color, border] = c[status] || c.available;
    return <span style={{ background: bg, color, border: `1px solid ${border}`, borderRadius: 999, padding: "2px 12px", fontSize: 12, fontWeight: 600 }}>{status}</span>;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)", padding: "28px 40px", color: "white", boxShadow: "0 4px 20px rgba(37,99,235,0.3)" }}>
        <div style={{ maxWidth: 1150, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", opacity: 0.7, marginBottom: 4 }}>RentEase Platform</div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>Admin Dashboard</h1>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ textAlign: "center", background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "10px 20px" }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{users.length}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>Users</div>
            </div>
            <div style={{ textAlign: "center", background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "10px 20px" }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{properties.length}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>Properties</div>
            </div>
            <button onClick={onLogout} style={{ padding: "10px 20px", background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {message && (
        <div style={{ position: "fixed", top: 24, right: 24, zIndex: 1000, background: message.type === "error" ? "#fee2e2" : "#d1fae5", color: message.type === "error" ? "#991b1b" : "#065f46", border: `1px solid ${message.type === "error" ? "#fca5a5" : "#6ee7b7"}`, borderRadius: 10, padding: "12px 20px", fontWeight: 600, fontSize: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
          {message.text}
        </div>
      )}

      {/* User Modal */}
      {userModal && (
        <Modal title={editUser ? "Edit User" : "Add User"} onClose={() => setUserModal(false)} onSave={saveUser} saving={userLoading}>
          <div><label style={labelStyle}>Full Name *</label><input style={inputStyle} placeholder="Jane Doe" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} /></div>
          <div><label style={labelStyle}>Email *</label><input style={inputStyle} type="email" placeholder="jane@email.com" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} /></div>
          <div><label style={labelStyle}>Password {editUser ? "(leave blank to keep unchanged)" : "*"}</label><input style={inputStyle} type="password" placeholder="Min. 6 characters" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} /></div>
          <div>
            <label style={labelStyle}>Role *</label>
            <select style={{ ...inputStyle, background: "white" }} value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </Modal>
      )}

      {/* Property Modal - edit only */}
      {propModal && (
        <Modal title="Edit Property" onClose={() => setPropModal(false)} onSave={saveProp} saving={propLoading}>
          <div><label style={labelStyle}>Title *</label><input style={inputStyle} placeholder="2+1 Apartment" value={propForm.title} onChange={(e) => setPropForm({ ...propForm, title: e.target.value })} /></div>
          <div><label style={labelStyle}>Description</label><textarea style={{ ...inputStyle, height: 80, resize: "vertical" }} placeholder="Property description..." value={propForm.description} onChange={(e) => setPropForm({ ...propForm, description: e.target.value })} /></div>
          <div><label style={labelStyle}>Price (Euro) *</label><input style={inputStyle} type="number" placeholder="85000" value={propForm.price} onChange={(e) => setPropForm({ ...propForm, price: e.target.value })} /></div>
          <div><label style={labelStyle}>Location *</label><input style={inputStyle} placeholder="Pristina" value={propForm.location} onChange={(e) => setPropForm({ ...propForm, location: e.target.value })} /></div>
          <div><label style={labelStyle}>Type</label><input style={inputStyle} placeholder="Apartment / House / Office" value={propForm.type} onChange={(e) => setPropForm({ ...propForm, type: e.target.value })} /></div>
          <div>
            <label style={labelStyle}>Status</label>
            <select style={{ ...inputStyle, background: "white" }} value={propForm.status} onChange={(e) => setPropForm({ ...propForm, status: e.target.value })}>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="rented">Rented</option>
            </select>
          </div>
          <div><label style={labelStyle}>Image URL</label><input style={inputStyle} placeholder="https://..." value={propForm.image_url} onChange={(e) => setPropForm({ ...propForm, image_url: e.target.value })} /></div>
        </Modal>
      )}

      <div style={{ maxWidth: 1150, margin: "0 auto", padding: "32px 40px" }}>

        {/* Tabs */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div style={{ display: "flex", gap: 4, background: "#e2e8f0", borderRadius: 12, padding: 4 }}>
            {["users", "properties"].map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: "10px 28px", borderRadius: 9, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, transition: "all 0.2s", background: tab === t ? "white" : "transparent", color: tab === t ? "#2563eb" : "#64748b", boxShadow: tab === t ? "0 2px 8px rgba(0,0,0,0.1)" : "none" }}>
                {t === "users" ? "Users" : "Properties"}
              </button>
            ))}
          </div>
          {tab === "users" && (
            <button onClick={openAddUser} style={{ padding: "10px 24px", background: "#2563eb", color: "white", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer", boxShadow: "0 2px 8px rgba(37,99,235,0.3)" }}>
              Add User
            </button>
          )}
        </div>

        {/* Table */}
        <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)", overflow: "hidden", border: "1px solid #e2e8f0" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
              <div style={{ fontWeight: 500 }}>Loading...</div>
            </div>
          ) : tab === "users" ? (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  {["ID", "Name", "Email", "Role", "Date", "Actions"].map((h) => (
                    <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>No users found</td></tr>
                ) : users.map((u, i) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "white" : "#fafafa" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "white" : "#fafafa")}
                  >
                    <td style={{ padding: "14px 20px", color: "#94a3b8", fontSize: 13 }}>#{u.id}</td>
                    <td style={{ padding: "14px 20px", fontWeight: 600, color: "#1e293b" }}>{u.name}</td>
                    <td style={{ padding: "14px 20px", color: "#475569", fontSize: 14 }}>{u.email}</td>
                    <td style={{ padding: "14px 20px" }}>{roleBadge(u.role)}</td>
                    <td style={{ padding: "14px 20px", color: "#94a3b8", fontSize: 13 }}>{new Date(u.created_at).toLocaleDateString("en-GB")}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <button onClick={() => openEditUser(u)} style={btnWarning}
                        onMouseEnter={(e) => { e.target.style.background = "#f59e0b"; e.target.style.color = "white"; }}
                        onMouseLeave={(e) => { e.target.style.background = "#fef3c7"; e.target.style.color = "#92400e"; }}
                      >Edit</button>
                      <button onClick={() => deleteUser(u.id)} style={btnDanger}
                        onMouseEnter={(e) => { e.target.style.background = "#dc2626"; e.target.style.color = "white"; }}
                        onMouseLeave={(e) => { e.target.style.background = "#fee2e2"; e.target.style.color = "#dc2626"; }}
                      >Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  {["ID", "Title", "Price", "Location", "Type", "Status", "Actions"].map((h) => (
                    <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {properties.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>No properties found</td></tr>
                ) : properties.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "white" : "#fafafa" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "white" : "#fafafa")}
                  >
                    <td style={{ padding: "14px 20px", color: "#94a3b8", fontSize: 13 }}>#{p.id}</td>
                    <td style={{ padding: "14px 20px", fontWeight: 600, color: "#1e293b", maxWidth: 160 }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                    </td>
                    <td style={{ padding: "14px 20px", color: "#2563eb", fontWeight: 700 }}>Euro {Number(p.price).toLocaleString()}</td>
                    <td style={{ padding: "14px 20px", color: "#475569", fontSize: 14 }}>{p.location}</td>
                    <td style={{ padding: "14px 20px", color: "#475569", fontSize: 14 }}>{p.type}</td>
                    <td style={{ padding: "14px 20px" }}>{statusBadge(p.status)}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <button onClick={() => openEditProp(p)} style={btnWarning}
                        onMouseEnter={(e) => { e.target.style.background = "#f59e0b"; e.target.style.color = "white"; }}
                        onMouseLeave={(e) => { e.target.style.background = "#fef3c7"; e.target.style.color = "#92400e"; }}
                      >Edit</button>
                      <button onClick={() => deleteProp(p.id)} style={btnDanger}
                        onMouseEnter={(e) => { e.target.style.background = "#dc2626"; e.target.style.color = "white"; }}
                        onMouseLeave={(e) => { e.target.style.background = "#fee2e2"; e.target.style.color = "#dc2626"; }}
                      >Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ marginTop: 16, color: "#94a3b8", fontSize: 13, textAlign: "right" }}>
          Total: <strong style={{ color: "#475569" }}>{tab === "users" ? users.length : properties.length}</strong> {tab === "users" ? "users" : "properties"}
        </div>
      </div>
    </div>
  );
}