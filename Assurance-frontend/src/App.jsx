import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./components/context/AuthContext";
import Login from "./pages/Login";
import NotAuthorized from "./pages/NotAuthorized";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AddSimpleItem from "./components/AddSimpleItem";
// import AddCompagne from "./components/AddCompagne";
import ListClient from "./components/ListClient";
import ListOperation from "./components/ListOperation";
import ListCompagne from "./components/ListCompagne";
import ListUser from "./components/ListUser";
import Regelement from "./components/Regelement";
import CreditHistory from "./components/CreditHistory";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Login page */}
          <Route path="/login" element={<Login />} />
          
          {/* Home redirects to clients */}
          <Route path="/" element={<Navigate to="/clients" replace />} />

          <Route
            path="/clients"
            element={
              <ProtectedRoute>
                <ListClient />
              </ProtectedRoute>
            }
          />

          <Route
            path="/categories"
            element={
              <ProtectedRoute>
                <AddSimpleItem title="Categorie" endpoint="categories" />
              </ProtectedRoute>
            }
          />
             <Route
            path="/tva"
            element={
              <ProtectedRoute>
                <AddSimpleItem title="TVA" endpoint="tva" />
              </ProtectedRoute>
            }
          />
  <Route
            path="/operations"
            element={
              <ProtectedRoute>
                <ListOperation />
              </ProtectedRoute>
            }
          />
            <Route
            path="/regelements/:id"
            element={
              <ProtectedRoute>
                <Regelement />
              </ProtectedRoute>
            }
          />
            <Route
            path="/credit-history"
            element={
              <ProtectedRoute>
                <CreditHistory />
              </ProtectedRoute>
            }
          />
            <Route
            path="/compagnes"
            element={
              <ProtectedRoute>
                <ListCompagne />
              </ProtectedRoute>
            }
          />
             <Route
            path="/users"
            element={
              <AdminRoute>
                <ListUser />
              </AdminRoute>
            }
          />
          <Route
            path="/parametres"
            element={
              <ProtectedRoute>
                <AddSimpleItem title="Parametre" endpoint="parametres" />
              </ProtectedRoute>
            }
          />

      

          <Route
            path="/natures"
            element={
              <ProtectedRoute>
                <AddSimpleItem title="Nature" endpoint="natures" />
              </ProtectedRoute>
            }
          />

       

          <Route path="/unauthorized" element={<NotAuthorized />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
