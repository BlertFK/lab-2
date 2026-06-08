import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { toggleSidebar, toggleTheme } from "../features/ui/uiSlice";
import {
  LayoutDashboard, Building2, FileText, Users, Settings,
  LogOut, ChevronLeft, ChevronRight, Moon, Sun, FileEdit,
} from "lucide-react";
import NotificationsBell from "../components/NotificationsBell";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "agent", "seller", "buyer", "manager"] },
  { to: "/admin",     label: "Admin Panel", icon: Settings,        roles: ["admin"] },
  { to: "/admin/cms", label: "CMS",          icon: FileEdit,        roles: ["admin"] },
  { to: "/properties",label: "Properties",   icon: Building2,       roles: ["admin", "manager", "agent", "seller"] },
];

export default function DashboardLayout() {
  const sidebarOpen = useSelector((s) => s.ui.sidebarOpen);
  const theme       = useSelector((s) => s.ui.theme);
  const dispatch    = useDispatch();
  const navigate    = useNavigate();

  const raw  = localStorage.getItem("user");
  const user = raw ? JSON.parse(raw) : null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const filtered = navItems.filter((item) => !item.roles || item.roles.includes(user?.role));

  return (
    <div className={`dash-shell ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
      {/* Sidebar */}
      <aside className="dash-sidebar">
        <div className="dash-sidebar__brand">
          {sidebarOpen && <span className="brand-name">UrbanKeys</span>}
          <button
            className="sidebar-toggle"
            onClick={() => dispatch(toggleSidebar())}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        <nav className="dash-sidebar__nav">
          {filtered.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/dashboard"}
              className={({ isActive }) => `dash-nav-link ${isActive ? "dash-nav-link--active" : ""}`}
            >
              <Icon size={20} />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="dash-sidebar__bottom">
          <button className="dash-nav-link" onClick={handleLogout}>
            <LogOut size={20} />
            {sidebarOpen && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="dash-main">
        {/* Topbar */}
        <header className="dash-topbar">
          <div className="dash-topbar__left">
            <span className="dash-topbar__greeting">
              Hello, {user?.name || user?.first_name || "User"} 👋
            </span>
          </div>
          <div className="dash-topbar__right">
            <button
              onClick={() => dispatch(toggleTheme())}
              className="nav-icon-btn"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <NotificationsBell />
            <div className="dash-avatar">
              {(user?.name || user?.email || "U")[0].toUpperCase()}
            </div>
          </div>
        </header>

        <div className="dash-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
