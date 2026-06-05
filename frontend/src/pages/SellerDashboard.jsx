export default function SellerDashboard({ user, setPage, setRootPage, onLogout }) {
  const actions = [
    { icon: "🏠", label: "My Properties",  sub: "View and manage your listings",  page: "myProperties"   },
    { icon: "➕", label: "Add Property",    sub: "Create a new listing",           page: "addProperty"    },
    { icon: "✉️", label: "Messages",        sub: "View buyer inquiries",           page: "sellerMessages" },
  ];

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div className="dashboard-brand-row">
          <div className="dashboard-brand" onClick={() => setRootPage && setRootPage("home")}>
            <div className="brand-logo"><div className="logo-dot" /></div>
            <span className="brand-name">UrbanKeys</span>
          </div>
          <button className="btn-ghost" onClick={() => setRootPage && setRootPage("home")}>Home</button>
        </div>
        <h2 className="dash-welcome">Seller Dashboard 👋</h2>
        <p className="dash-sub">Welcome back, {user?.name?.split(" ")[0]}. Manage your properties below.</p>
      </div>

      <div className="dash-body">
        <div className="dash-cards" style={{ maxWidth: 700 }}>
          {actions.map(a => (
            <div key={a.page} className="dash-card seller-action-card" onClick={() => setPage(a.page)}
              style={{ cursor: "pointer" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{a.icon}</div>
              <div className="dash-card-label" style={{ fontSize: "0.95rem", fontWeight: 600, textTransform: "none", color: "var(--text)" }}>{a.label}</div>
              <div className="dash-card-label" style={{ marginBottom: 0 }}>{a.sub}</div>
            </div>
          ))}
        </div>

        <div className="profile-card" style={{ marginTop: "2rem", maxWidth: 420 }}>
          <p className="profile-card-title">Account</p>
          <div className="profile-top">
            <div className="profile-avatar">
              {user?.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <div>
              <p className="profile-name">{user?.name}</p>
              <p className="profile-email">{user?.email}</p>
              <span className="profile-role-badge" style={{ background: "#05966918", color: "#059669" }}>seller</span>
            </div>
          </div>
          <button className="btn-submit" style={{ background: "var(--error)" }} onClick={onLogout}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}