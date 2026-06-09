// B40: Admin route guard (react-router variant). Pairs with PrivateRoute.
// Reads the user from localStorage (set by App.jsx on login) and checks for
// the lowercased "admin" role.

import { Navigate, Outlet } from "react-router-dom";

export default function AdminRoute() {
  const token = localStorage.getItem("token");
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }
  if (!token || !user) return <Navigate to="/login" replace />;

  const role = String(user.role || "").toLowerCase();
  const roles = (user.roles || []).map((r) => String(r).toLowerCase());
  const isAdmin = role === "admin" || roles.includes("admin");

  return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
}
