import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "./context/AuthContext";
import { API_BASE } from "../config";
import { FaEdit, FaTrash, FaUsers, FaBuilding, FaUser, FaArrowLeft, FaArrowRight, FaList, FaUserCircle, FaAirbnb } from "react-icons/fa";

export default function ClientTable({ onEdit }) {
  const [clients, setClients] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [clientsPerPage] = useState(5);
  const { user } = useAuth();

  useEffect(() => {
    axios
      .get(`${API_BASE}/clients`, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${user?.token}`,
        },
      })
      .then((res) => setClients(res.data))
      .catch((err) => console.error(err));
  }, [user?.token, clients]);

  const indexOfLastClient = currentPage * clientsPerPage;
  const indexOfFirstClient = indexOfLastClient - clientsPerPage;
  const currentClients = clients.slice(indexOfFirstClient, indexOfLastClient);
  const totalPages = Math.ceil(clients.length / clientsPerPage);

  const handleEdit = (client) => {
    onEdit(client);
  };

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer ce client ?")) {
      try {
        await axios.delete(`${API_BASE}/clients/${id}`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        setClients(clients.filter((c) => c._id !== id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    /*  <div className="card border-0 shadow-lg">
            <div className="card-header bg-primary text-white py-3">
              <h4 className="mb-0 fw-semibold d-flex align-items-center gap-2">
                <FaList /> Liste des Opérations
              </h4>
            </div>
            <div className="card-body p-4"> */
    <div className="card border-0 shadow-lg">
      <div className="card-header bg-primary text-white py-3">
        <h4 className="mb-0 fw-semibold d-flex align-items-center gap-2">
          <FaUsers />
          Liste des Clients
        </h4>
      </div>
      <div className="card-body p-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th className="fw-semibold">Type</th>
                <th className="fw-semibold">Nom</th>
                <th className="fw-semibold">Prénom</th>
                <th className="fw-semibold">Téléphone</th>
                <th className="fw-semibold">Adresse</th>
                <th className="fw-semibold">Date Début</th>
                <th className="fw-semibold">Budget</th>
                {/* <th className="fw-semibold">Credit</th> */}

                <th className="fw-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentClients.length > 0 ? (
                currentClients.map((c) => (
                  <tr key={c._id} className="border-bottom">
                    <td>
                      <span className={`badge d-flex align-items-center gap-1 ${
                        c.type === "particulier" ? "bg-info" : "bg-warning"
                      }`}>
                        {c.type === "particulier" ? <FaUser /> : <FaBuilding />}
                        {c.type === "particulier" ? "Part." : "Société"}
                      </span>
                    </td>
                    <td className="fw-semibold">{c.nom}</td>
                    <td>{c.prenom || <span className="text-muted">--</span>}</td>
                    <td>
                      <span className="text-primary fw-medium">{c.tel}</span>
                    </td>
                    <td>
                      <small className="text-muted">{c.adresse}</small>
                    </td>
                    <td>
                      {c.date_debut ? (
                        new Date(c.date_debut).toLocaleDateString("fr-FR")
                      ) : (
                        <span className="text-muted">--</span>
                      )}
                    </td>
                    <td>
                      <span className="fw-bold text-success">
                        {c.budget?.toLocaleString()} DH
                      </span>
                     
                    </td>
                    {/* <td>
                      {

                      c.credit>=0 ?
                       <span className="fw-bold text-success">
                        {c.credit?.toLocaleString()} DH
                      </span>
                      :
                      <span className="fw-bold text-danger">
                        {c.credit?.toLocaleString()} DH
                      </span>
}
                    </td> */}
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
                  <td colSpan="8" className="text-center py-5">
                    <div className="text-muted">
                      <FaUsers className="fs-1 mb-3 opacity-50" />
                      <p className="mb-0 fw-semibold">Aucun client trouvé</p>
                      <small>Commencez par ajouter un nouveau client</small>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {clients.length > 0 && (
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