const TABS = [
  { key: "main", label: "Overview" },
  { key: "favorites", label: "Favorites" },
  { key: "profile", label: "Profile" },
];

export default function BuyerSubnav({ activeTab, onChange, onGoHome, onLogout }) {
  return (
    <div className="buyer-subnav-row">
      <div className="buyer-subnav">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`buyer-subnav-btn ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => onChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="buyer-subnav-actions">
        <button type="button" className="buyer-subnav-action" onClick={onGoHome}>
          Home
        </button>
        <button type="button" className="buyer-subnav-action buyer-subnav-action-danger" onClick={onLogout}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
