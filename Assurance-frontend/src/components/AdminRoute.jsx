// import { Navigate } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";

// export default function AdminRoute({ children }) {
//   const { user } = useAuth();
//   if (!user) return <Navigate to="/" />;
//   return user.role === "admin" ? children : <Navigate to="/unauthorized" />;
// }
import { Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

export default function AdminRoute({ children }) {
  const { user } = useAuth();

  if (user === undefined) return null; // still loading
  if (!user) return <Navigate to="/" />;
  if (user.role !== "admin") return <Navigate to="/unauthorized" />;

  return children;
}
