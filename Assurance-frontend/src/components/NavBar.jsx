import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { 
  FaUser, 
  FaCog, 
  FaSignOutAlt, 
  FaPlus, 
  FaBars,
  FaShieldAlt,
  FaUserEdit,
  FaHistory
} from "react-icons/fa";

export function Navbar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-lg">
      <div className="container-fluid">
        {/* Brand */}
        <Link className="navbar-brand fw-bold d-flex align-items-center gap-2" to="/clients">
          {user.role === "admin" ? (
            <>
              <FaShieldAlt className="text-primary" />
              <span>Admin Dashboard</span>
            </>
          ) : (
            <>
              <FaUserEdit className="text-info" />
              <span>Agent de Saisie</span>
            </>
          )}
        </Link>

        {/* Toggle Button */}
        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <FaBars />
        </button>

        {/* Navigation Items */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            {/* Add Operation */}
            <li className="nav-item">
              <Link 
                className="nav-link d-flex align-items-center gap-2 fw-semibold" 
                to="/operations"
              >
                <FaPlus className="fs-sm" />
                Ajouter une Opération
              </Link>
            </li>

            {/* Configuration Dropdown */}
            <li className="nav-item dropdown">
              <span
                className="nav-link dropdown-toggle d-flex align-items-center gap-2 fw-semibold cursor-pointer"
                id="configDropdown"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <FaCog className="fs-sm" />
                Configuration
              </span>
              <ul
                className="dropdown-menu dropdown-menu-dark shadow-lg border-0"
                aria-labelledby="configDropdown"
              >
                {/* Admin & Agent Common Items */}
                {["clients", "natures", "categories", "parametres", "compagnes","tva"].map((el) => (
                  <li key={el}>
                    <Link 
                      className="dropdown-item d-flex align-items-center gap-2 py-2 fw-semibold"
                      to={`/${el}`}
                    >
                      <FaCog className="text-light fs-xs opacity-75" />
                      Liste des {el==="tva"?"TVA":el.charAt(0).toUpperCase() + el.slice(1)}
                    </Link>
                  </li>
                ))}

                <li><hr className="dropdown-divider" /></li>

                {/* Credit History */}
                <li>
                  <Link 
                    className="dropdown-item d-flex align-items-center gap-2 py-2 fw-semibold"
                    to="/credit-history"
                  >
                    <FaHistory className="text-warning fs-xs" />
                    Historique Crédit & Paiements
                  </Link>
                </li>
                
                {/* Admin Only - Users Management */}
                {user.role === "admin" && (
                  <li>
                    <Link 
                      className="dropdown-item d-flex align-items-center gap-2 py-2 fw-semibold"
                      to="/users"
                    >
                      <FaUser className="text-primary fs-xs" />
                      Gestion des Utilisateurs
                    </Link>
                  </li>
                )}
              </ul>
            </li>
          </ul>

          {/* User Info & Logout */}
          <div className="navbar-nav">
            <div className="nav-item dropdown">
              <span
                className="nav-link dropdown-toggle d-flex align-items-center gap-2 fw-semibold cursor-pointer"
                id="userDropdown"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <FaUser className="fs-sm" />
                <span className="d-none d-md-inline">{user.name || user.email}</span>
              </span>
              <ul
                className="dropdown-menu dropdown-menu-dark dropdown-menu-end shadow-lg border-0"
                aria-labelledby="userDropdown"
              >
                <li>
                  <div className="dropdown-header text-light fw-semibold">
                    Connecté en tant que
                  </div>
                </li>
                <li>
                  <div className="dropdown-item-text">
                    <small className="text-muted">Rôle:</small>
                    <div className="fw-semibold text-capitalize">
                      {user.role === "admin" ? (
                        <span className="text-primary">Administrateur</span>
                      ) : (
                        <span className="text-info">Agent de Saisie</span>
                      )}
                    </div>
                  </div>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button 
                    className="dropdown-item d-flex align-items-center gap-2 fw-semibold text-danger"
                    onClick={handleLogout}
                  >
                    <FaSignOutAlt />
                    Déconnexion
                  </button>
                </li>
              </ul>
            </div>
            
            {/* Mobile Logout Button */}
            <div className="d-lg-none mt-2">
              <button 
                className="btn btn-outline-light w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                onClick={handleLogout}
              >
                <FaSignOutAlt />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}