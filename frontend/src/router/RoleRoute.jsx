// B40: Role / permission guard.
//
// Usage:
//   <RoleRoute user={user} roles={["admin"]} setPage={setPage}>...</RoleRoute>
//   <RoleRoute user={user} permission="users.view" setPage={setPage}>...</RoleRoute>
//
// Falls back to a friendly "no access" panel if the user is logged in but
// lacks the required role/permission. Redirects to /login if not logged in.

import { useEffect } from "react";

function hasRole(user, roles) {
  if (!roles?.length) return true;
  const want = roles.map((r) => String(r).toLowerCase());
  const userRoles = (user.roles || [user.role]).filter(Boolean).map((r) => String(r).toLowerCase());
  return userRoles.some((r) => want.includes(r));
}

function hasPermission(user, perm) {
  if (!perm) return true;
  const isAdmin = (user.roles || [user.role]).some(
    (r) => String(r || "").toLowerCase() === "admin"
  );
  if (isAdmin) return true;
  return (user.permissions || []).includes(perm);
}

export default function RoleRoute({
  user,
  roles,
  permission,
  setPage,
  fallback = "login",
  children,
  denied = null,
}) {
  useEffect(() => {
    if (!user && typeof setPage === "function") setPage(fallback);
  }, [user, setPage, fallback]);

  if (!user) return null;
  const okRole = hasRole(user, roles);
  const okPerm = hasPermission(user, permission);
  if (!okRole || !okPerm) {
    return (
      denied ?? (
        <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
          <h2 style={{ color: "#1e293b" }}>Access denied</h2>
          <p>You don't have permission to view this page.</p>
        </div>
      )
    );
  }
  return children;
}
