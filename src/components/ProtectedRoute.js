import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { user, userData } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && userData?.role !== role) {
    return <Navigate to={userData?.role === "admin" ? "/admin" : "/dashboard"} replace />;
  }
  return children;
}
