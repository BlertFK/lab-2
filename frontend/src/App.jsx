import { useState, useCallback, useEffect } from "react";

import { apiFetch } from "./utils/api";

import "./styles/style.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Toast from "./components/Toast";

import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import PropertiesPage from "./pages/PropertiesPage";
import PropertyDetails from "./pages/PropertyDetails";
import AgenciesPage from "./pages/AgenciesPage";
import AgencyDetailPage from "./pages/AgencyDetailPage";
import PlansPage from "./pages/PlansPage";
import ReportBuilderPage from "./pages/reports/ReportBuilderPage";
import CmsPagesListPage from "./pages/admin/cms/CmsPagesListPage";
import CmsPageEditorPage from "./pages/admin/cms/CmsPageEditorPage";
import CmsPublicPage from "./pages/public/CmsPublicPage";

// Known fixed pages - anything else is treated as a potential CMS slug
const FIXED_PAGES = new Set([
  "home", "login", "register", "admin", "dashboard", "properties",
  "propertyDetails", "agencies", "agencyDetail", "plans", "reports",
  "cms", "cms-editor",
]);

const getPageFromPath = (pathname) => {
  if (pathname === "/" || pathname === "") return "home";
  if (pathname === "/login") return "login";
  if (pathname === "/register") return "register";
  if (pathname === "/admin") return "admin";
  if (pathname === "/dashboard") return "dashboard";
  if (pathname === "/properties") return "properties";
  if (pathname === "/property-details") return "propertyDetails";
  if (pathname === "/agencies") return "agencies";
  if (pathname === "/agency-detail") return "agencyDetail";
  if (pathname === "/plans") return "plans";
  if (pathname === "/reports") return "reports";
  if (pathname === "/admin/cms/editor") return "cms-editor";
  if (pathname === "/admin/cms") return "cms";
  // Any other path like /test or /about → treat as CMS slug
  const slug = pathname.replace(/^\//, "");
  if (slug) return `cms-slug:${slug}`;
  return "home";
};

const getPathFromPage = (page) => {
  if (page === "home") return "/";
  if (page === "login") return "/login";
  if (page === "register") return "/register";
  if (page === "admin") return "/admin";
  if (page === "dashboard") return "/dashboard";
  if (page === "properties") return "/properties";
  if (page === "propertyDetails") return "/property-details";
  if (page === "agencies") return "/agencies";
  if (page === "agencyDetail") return "/agency-detail";
  if (page === "plans") return "/plans";
  if (page === "reports") return "/reports";
  if (page === "cms") return "/admin/cms";
  if (page === "cms-editor") return "/admin/cms/editor";
  if (page.startsWith("cms-slug:")) return `/${page.replace("cms-slug:", "")}`;
  return "/";
};

export default function App() {
  const [selectedCmsPageId, setSelectedCmsPageId] = useState(null);

  const [page, setPageState] = useState(() => {
    return getPageFromPath(window.location.pathname);
  });

  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedAgency, setSelectedAgency]     = useState(null);

  const [user, setUser] = useState(() => {
    const savedToken  = localStorage.getItem("token");
    const savedUser   = localStorage.getItem("user");
    const expiresAt   = Number(localStorage.getItem("authExpiresAt") || 0);

    if (!savedToken || !savedUser || expiresAt <= Date.now()) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("authExpiresAt");
      return null;
    }
    try {
      return JSON.parse(savedUser);
    } catch {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("authExpiresAt");
      return null;
    }
  });

  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);

  const setPage = useCallback((pageName, params = {}) => {
    if (params?.id && (pageName === "property-detail" || pageName === "propertyDetails")) {
      setSelectedProperty({ id: params.id });
    }
    if (params?.id && (pageName === "agency-detail" || pageName === "agencyDetail")) {
      localStorage.setItem("activeAgencyId", params.id);
      setSelectedAgency({ id: params.id });
    }
    if (pageName === "property-detail") {
      setPageState("propertyDetails");
    } else if (pageName === "agency-detail") {
      setPageState("agencyDetail");
    } else {
      setPageState(pageName);
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setPageState(getPageFromPath(window.location.pathname));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      const token     = localStorage.getItem("token");
      const expiresAt = Number(localStorage.getItem("authExpiresAt") || 0);

      if (!token || expiresAt <= Date.now()) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("authExpiresAt");
        return;
      }

      try {
        const data = await apiFetch("/auth/me");
        const restoredUser = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          createdAt: data.user.created_at,
        };
        setUser(restoredUser);
        localStorage.setItem("user", JSON.stringify(restoredUser));
        setPageState((currentPage) => {
          // Preserve public pages and CMS slug pages on session restore
          const preservedPages = [
            "home", "properties", "propertyDetails", "agencies",
            "agencyDetail", "plans", "reports", "cms", "cms-editor",
          ];
          if (preservedPages.includes(currentPage)) return currentPage;
          if (currentPage.startsWith("cms-slug:")) return currentPage;
          return restoredUser.role === "admin" ? "admin" : "dashboard";
        });
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("authExpiresAt");
        setUser(null);
        setPageState("home");
      }
    };

    restoreSession();
  }, []);

  useEffect(() => {
    const nextPath = getPathFromPage(page);
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
  }, [page]);

  const handleLoginSuccess = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("authExpiresAt", String(Date.now() + 7 * 24 * 60 * 60 * 1000));
    showToast(`Welcome back, ${userData.name}!`, "success");
    setPageState(userData.role === "admin" ? "admin" : "dashboard");
  }, [showToast]);

  const handleLogout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("authExpiresAt");
    localStorage.removeItem("dashboardView");
    showToast("You've been signed out.", "success");
    setPageState("home");
  }, [showToast]);

  const isCmsSlugPage = page.startsWith("cms-slug:");
  const cmsSlug = isCmsSlugPage ? page.replace("cms-slug:", "") : null;

  const showNavbar = [
    "home", "properties", "propertyDetails", "agencies",
    "agencyDetail", "plans",
  ].includes(page) || isCmsSlugPage || (!user && page === "dashboard");

  return (
    <>
      {showNavbar && (
        <Navbar page={page} setPage={setPage} user={user} onLogout={handleLogout} />
      )}

      {page === "login" && (
        <LoginPage setPage={setPage} onLoginSuccess={handleLoginSuccess} />
      )}
      {page === "register" && (
        <RegisterPage setPage={setPage} showToast={showToast} />
      )}

      {page === "admin" && user?.role === "admin" && (
        <AdminDashboard onLogout={handleLogout} setPage={setPage} />
      )}

      {page === "dashboard" && user && (
        <Dashboard user={user} setPage={setPage} onLogout={handleLogout} showToast={showToast} />
      )}

      {page === "reports" && (user?.role === "admin" || user?.role === "seller") && (
        <ReportBuilderPage setPage={user?.role === "seller" ? () => setPage("dashboard") : () => setPage("admin")} />
      )}

      {page === "cms" && user?.role === "admin" && (
        <CmsPagesListPage
          setPage={setPage}
          onSelectPage={(id) => {
            setSelectedCmsPageId(id);
            setPageState("cms-editor");
          }}
        />
      )}

      {page === "cms-editor" && user?.role === "admin" && (
        <CmsPageEditorPage
          pageId={selectedCmsPageId}
          setPage={setPage}
        />
      )}

      {/* CMS public pages — any slug like /test, /about, /contact */}
      {isCmsSlugPage && (
        <>
          <CmsPublicPage slug={cmsSlug} setPage={setPage} />
          <Footer />
        </>
      )}

      {page === "home" && (
        <>
          <Home setPage={setPage} user={user} showToast={showToast} />
          <Footer />
        </>
      )}

      {page === "properties" && (
        <>
          <PropertiesPage setPage={setPage} setSelectedProperty={setSelectedProperty} />
          <Footer />
        </>
      )}

      {page === "propertyDetails" && (
        <PropertyDetails property={selectedProperty} setPage={setPage} user={user} />
      )}

      {page === "agencies" && (
        <>
          <AgenciesPage setPage={setPage} setSelectedAgency={setSelectedAgency} />
          <Footer />
        </>
      )}

      {page === "agencyDetail" && (
        <>
          <AgencyDetailPage agency={selectedAgency} setPage={setPage} />
          <Footer />
        </>
      )}

      {page === "plans" && (
        <>
          <PlansPage user={user} setPage={setPage} showToast={showToast} />
          <Footer />
        </>
      )}

      {!user && page === "dashboard" && (
        <>
          <Home setPage={setPage} user={user} showToast={showToast} />
          <Footer />
        </>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  );
}
