import { Navigate, Outlet } from "react-router-dom";

export default function PrivateRoute() {
  const token = localStorage.getItem("token");
  const user  = localStorage.getItem("user");
  return token && user ? <Outlet /> : <Navigate to="/login" replace />;
}
