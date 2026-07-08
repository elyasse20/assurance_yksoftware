import { Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();

  // While restoring from localStorage, wait
  if (user === undefined) return null;

  if (!user) return <Navigate to="/login" replace />;

  return children;
}

