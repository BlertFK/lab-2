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

const getPageFromPath = (pathname) => {
  if (pathname === "/login") return "login";
  if (pathname === "/register") return "register";
  if (pathname === "/admin") return "admin";
  if (pathname === "/dashboard") return "dashboard";
  if (pathname === "/properties") return "properties";
  if (pathname === "/property-details") return "propertyDetails";
  return "home";
};

const getPathFromPage = (page) => {
  if (page === "login") return "/login";
  if (page === "register") return "/register";
  if (page === "admin") return "/admin";
  if (page === "dashboard") return "/dashboard";
  if (page === "properties") return "/properties";
  if (page === "propertyDetails") return "/property-details";
  return "/";
};

export default function App() {
  const [page, setPageState] = useState(() => {
    const pathPage = getPageFromPath(window.location.pathname);
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");
    const expiresAt = Number(localStorage.getItem("authExpiresAt") || 0);

    if (savedUser && savedToken && expiresAt > Date.now()) {
      try {
        return pathPage;
      } catch {
        return pathPage;
      }
    }

    return pathPage;
  });
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [user, setUser] = useState(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    const expiresAt = Number(localStorage.getItem("authExpiresAt") || 0);

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
    if (params?.id) {
      setSelectedProperty({ id: params.id });
    }
    if (pageName === "property-detail") {
      setPageState("propertyDetails");
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
      const token = localStorage.getItem("token");
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
        setPageState(restoredUser.role === "admin" ? "admin" : "dashboard");
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

  const showNavbar = page === "home" || page === "properties" || page === "propertyDetails" || (!user && page === "dashboard");

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
        <AdminDashboard onLogout={handleLogout} />
      )}

      {page === "dashboard" && user && (
        <Dashboard user={user} setPage={setPage} onLogout={handleLogout} showToast={showToast} />
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
