import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useAuth } from "./context/AuthContext";
import { API_BASE } from "../config";
import { FaEdit, FaTrash, FaList, FaArrowLeft, FaArrowRight, FaTags } from "react-icons/fa";

export default function CompagneTable({ onEdit, reloadTrigger }) {
  const [compagnes, setCompagnes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(5);
  const { user } = useAuth();
  const lastReload = useRef(null);

  const fetchCompagnes = async () => {
    try {
      const res = await axios.get(`${API_BASE}/compagnes`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      setCompagnes(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!user?.token) return;
    if (lastReload.current === reloadTrigger) return;
    lastReload.current = reloadTrigger;
    fetchCompagnes();
  }, [user?.token, reloadTrigger]);

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer cette compagne ?")) {
      try {
        await axios.delete(`${API_BASE}/compagnes/${id}`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        await fetchCompagnes();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentCompagnes = compagnes.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(compagnes.length / rowsPerPage);

  return (
    <div className="mt-4">
      {/* Main Card */}
      <div className="card border-0 shadow-lg">
        <div className="card-header bg-primary text-white py-3">
          <h4 className="mb-0 fw-semibold d-flex align-items-center gap-2">
            <FaList /> Liste des Compagnes
          </h4>
        </div>

        <div className="card-body p-4">
          <div className="table-responsive">
            <table className="table table-hover align-middle text-center mb-0">
              <thead className="table-dark">
                <tr>
                  <th className="fw-semibold">Nom</th>
                  <th className="fw-semibold">Catégories</th>
                  <th className="fw-semibold">Paramètres</th>
                  <th className="fw-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentCompagnes.length > 0 ? (
                  currentCompagnes.map((compagne) => (
                    <tr key={compagne._id} className="border-bottom">
                      {/* Nom */}
                      <td className="fw-bold text-dark">
                        <FaTags className="text-primary me-2" />
                        {compagne.compagneName}
                      </td>

                      {/* Catégories */}
                      <td>
                        {compagne.categories && compagne.categories.length > 0 ? (
                          <div className="d-flex flex-wrap justify-content-center gap-2">
                            {compagne.categories.map((cat, i) => (
                              <span
                                key={i}
                                className="badge bg-secondary-subtle text-dark border px-3 py-2"
                              >
                                {cat.name} <small>({cat.indec})</small>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted small">Aucune catégorie</span>
                        )}
                      </td>

                      {/* Paramètres */}
                      <td>
                        {compagne.categories && compagne.categories.length > 0 ? (
                          <div className="text-start"  style={{
                                    display: "grid",
                                   gridTemplateColumns: "auto auto auto"
                                }} >
                            {compagne.categories.map((category, ci) => (
                              <div
                                key={ci}
                                
                                className="mb-2 p-2 border rounded bg-light-subtle"
                              >
                                <div className="fw-semibold text-primary mb-1">
                                  {category.name}
                                </div>
                                {category.parameters?.length ? (
                                  <div className="d-flex flex-wrap gap-1">
                                    {category.parameters.map((param, pi) => (
                                      <span
                                        key={pi}
                                        className="badge bg-light border text-dark"
                                      >
                                        {param.name}: {param.percent}%
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-muted small">
                                    Aucun paramètre
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted small">Aucune donnée</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-2">
                          <button
                            className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                            onClick={() => onEdit(compagne)}
                          >
                            <FaEdit />
                            <span>Modifier</span>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                            onClick={() => handleDelete(compagne._id)}
                          >
                            <FaTrash />
                            <span>Supprimer</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-5">
                      <div className="text-muted">
                        <FaList className="fs-1 mb-3 opacity-50" />
                        <p className="mb-0 fw-semibold">
                          Aucune compagne trouvée
                        </p>
                        <small>Ajoutez une nouvelle compagne pour commencer</small>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {compagnes.length > 0 && (
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
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Suivant <FaArrowRight />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
