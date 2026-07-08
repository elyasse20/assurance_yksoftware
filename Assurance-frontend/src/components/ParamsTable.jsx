import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "./context/AuthContext";
import { API_BASE } from "../config";
import { FaEdit, FaTrash, FaList, FaArrowLeft, FaArrowRight } from "react-icons/fa";

export default function ParamsTable({ endpoint, handleEdit, title, refreshKey }) {
  const [parametres, setParametres] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [parametresPerPage] = useState(5);
  const { user } = useAuth();

  // Load data when user, endpoint or refreshKey changes
  useEffect(() => {
    if (!user?.token) return;
    let mounted = true;
    const fetchParams = async () => {
      try {
        const res = await axios.get(`${API_BASE}/${endpoint}`, {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        });
        if (mounted) setParametres(res.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchParams();
    return () => { mounted = false; };
  }, [endpoint, user?.token, refreshKey]);

  // Pagination logic
  const indexOfLast = currentPage * parametresPerPage;
  const indexOfFirst = indexOfLast - parametresPerPage;
  const currentItems = parametres.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(parametres.length / parametresPerPage);

  const getIndex = (id) => parametres.findIndex((el) => el._id === id) + 1;

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  
  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cet élément ?")) return;
    try {
      await axios.delete(`${API_BASE}/${endpoint}/${id}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      setParametres((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const getDisplayName = (endpoint) => {
    const names = {
      'clients': 'Clients',
      'natures': 'Natures',
      'categories': 'Catégories',
      'parametres': 'Paramètres',
      'compagnes': 'Campagnes',
      'users': 'Utilisateurs',
      "tva": "TVA"
    };
    return names[endpoint] || endpoint;
  };

  return (
    <div className="card border-0 shadow-lg h-100">
      <div className="card-header bg-dark text-white py-3">
        <h4 className="mb-0 fw-semibold d-flex align-items-center gap-2">
          <FaList />
          Liste des {getDisplayName(endpoint)}
        </h4>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th className="fw-semibold" style={{ width: '80px' }}>#</th>
                <th className="fw-semibold">{getDisplayName(endpoint)!=="TVA"? "Nom":"Taux"}</th>
{        getDisplayName(endpoint)=="TVA"&&        <th className="fw-semibold">Active</th>
}
                <th className="fw-semibold text-center" style={{ width: '150px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((c) => (
                  <tr key={c._id} className="border-bottom">
                    <td className="fw-semibold text-muted">
                      {getIndex(c._id)}
                    </td>
                    <td>
                      <span className="fw-medium text-dark">{getDisplayName(endpoint)!=="TVA"? c.name : c.rate+" %"}</span>
                    </td>
{        getDisplayName(endpoint)=="TVA"&&        <td>
                      <span className={`badge ${c.isActive ? 'bg-success' : 'bg-secondary'}`}>
                        {c.isActive ? 'Oui' : 'Non'}
                      </span>
                    </td>
}
                    <td className="text-center">
                      <div className="d-flex justify-content-center gap-1">
                        <button
                          className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                          onClick={() => handleEdit(c)}
                        >
                          <FaEdit className="fs-xs" />
                          <span>Modifier</span>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                          onClick={() => handleDelete(c._id)}
                        >
                          <FaTrash className="fs-xs" />
                          <span>Supprimer</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="text-center py-5">
                    <div className="text-muted">
                      <FaList className="fs-1 mb-3 opacity-50" />
                      <p className="mb-0 fw-semibold">Aucun élément trouvé</p>
                      <small>Commencez par ajouter un nouvel élément</small>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {parametres.length > 0 && (
          <div className="d-flex justify-content-between align-items-center p-4 border-top">
            <button
              className="btn btn-outline-secondary d-flex align-items-center gap-2"
              onClick={prevPage}
              disabled={currentPage === 1}
            >
              <FaArrowLeft /> Précédent
            </button>

            <span className="fw-semibold text-dark">
              Page {currentPage} sur {totalPages}
            </span>

            <button
              className="btn btn-primary d-flex align-items-center gap-2"
              onClick={nextPage}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Suivant <FaArrowRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}