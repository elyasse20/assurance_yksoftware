import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "./context/AuthContext";
import { API_BASE } from "../config";
import { FaEdit, FaTrash, FaUser, FaArrowLeft, FaArrowRight } from "react-icons/fa";

export default function UserTable({ onEdit, reloadTrigger }) {
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(5);
  const { user } = useAuth();

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/users/allusers`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user?.token, reloadTrigger]);

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer cet utilisateur ?")) {
      try {
        await axios.delete(`${API_BASE}/users/${id}`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        fetchUsers();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const indexOfLast = currentPage * perPage;
  const indexOfFirst = indexOfLast - perPage;
  const currentUsers = users.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(users.length / perPage);

  return (
    <div className="card border-0 shadow-lg">
      <div className="card-header bg-primary text-white py-3">
        <h4 className="mb-0 fw-semibold d-flex align-items-center gap-2">
          <FaUser /> Liste des Utilisateurs
        </h4>
      </div>
      <div className="card-body p-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle text-center mb-0">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Nom d’utilisateur</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.length > 0 ? (
                currentUsers.map((u, index) => (
                  <tr key={u._id}>
                    <td>{indexOfFirst + index + 1}</td>
                    <td className="fw-semibold">{u.username}</td>
                    <td>{u.email}</td>
                    <td>
                      <span
                        className={`badge ${
                          u.role === "admin"
                            ? "bg-success"
                            : "bg-secondary text-dark"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex justify-content-center gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                          onClick={() => onEdit(u)}
                        >
                          <FaEdit /> Modifier
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                          onClick={() => handleDelete(u._id)}
                        >
                          <FaTrash /> Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted">
                    <FaUser className="fs-1 mb-3 opacity-50" />
                    <p className="fw-semibold mb-0">Aucun utilisateur trouvé</p>
                    <small>Ajoutez un nouvel utilisateur pour commencer</small>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {users.length > 0 && (
          <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
            <button
              className="btn btn-outline-secondary d-flex align-items-center gap-2"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              <FaArrowLeft /> Précédent
            </button>
            <span className="fw-semibold text-dark">
              Page {currentPage} sur {totalPages || 1}
            </span>
            <button
              className="btn btn-primary d-flex align-items-center gap-2"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Suivant <FaArrowRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
