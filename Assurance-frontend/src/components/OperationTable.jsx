import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "./context/AuthContext";
import { API_BASE } from "../config";
import {
  FaEdit,
  FaTrash,
  FaList,
  FaArrowLeft,
  FaArrowRight,
  FaEye,
} from "react-icons/fa";
import { Link } from "react-router-dom";

export default function OperationTable({ reload }) {
  const [operations, setOperations] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [editParams, setEditParams] = useState([]);
  const [openDetails, setOpenDetails] = useState(null);
  const [compagne, setCompagne] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [reglements, setReglements] = useState({}); // Map of operationId -> payment data

  const perPage = 5;

  const { user } = useAuth();
  const headers = { Authorization: `Bearer ${user?.token}` };

  /* ===================================================
     LOAD DATA
  =================================================== */
  useEffect(() => {
    if (!user?.token) return;

    // Load compagnes
    axios
      .get(`${API_BASE}/compagnes`, { headers })
      .then((r) => setCompagne(r.data || []))
      .catch(console.error);

    // Load productions + reglements
    axios
      .get(`${API_BASE}/productions`, { headers })
      .then(async (r) => {
        const ops = r.data || [];
        setOperations(ops);

        const reglementMap = {};
        await Promise.all(
          ops.map((op) =>
            axios
              .get(`${API_BASE}/regelements/${op._id}`, { headers })
              .then((regRes) => {
                if (regRes.data && regRes.data.payments) {
                  reglementMap[op._id] = regRes.data;
                }
              })
              .catch(() => {
                // no reglement is ok
              })
          )
        );

        setReglements(reglementMap);
      })
      .catch(console.error);
  }, [reload, user?.token]);

  /* ===================================================
     CHECK IF OPERATION IS FULLY PAID
  =================================================== */
  const isOperationFullyPaid = (op) => {
    const reglement = reglements[op._id];
    if (!reglement) return false;

    const totalPaid = (reglement.payments || []).reduce(
      (sum, p) => sum + (p.montant || 0),
      0
    );

    const operationTTC = (op.parameters || []).reduce(
      (sum, p) =>
        sum +
        (p.primes || 0) +
        (p.taxe || 0) +
        (p.taxepara || 0) +
        (p.accessoire || 0) +
        (p.cnpc || 0),
      0
    );

    return totalPaid >= operationTTC;
  };

  /* ===================================================
     DELETE OPERATION
  =================================================== */
  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette operation ?")) return;

    try {
      await axios.delete(`${API_BASE}/productions/${id}`, { headers });
      setOperations((prev) => prev.filter((o) => o._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  /* ===================================================
     HANDLE EDIT CHANGES
  =================================================== */
  const handleChange = (e) => {
    const { name, value, type } = e.target;

    // Convert numbers safely
    const parsedValue = type === "number" ? Number(value) : value;

    setEditData((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
  };

  const handleParamChange = (index, field, value) => {
    const updated = [...editParams];
    updated[index] = { ...updated[index], [field]: value };
    setEditParams(updated);
  };

  /* ===================================================
     GET COMMISSION PERCENT FROM API
  =================================================== */
  const getPercentForParameter = (categoryName, paramName) => {
    if (!compagne.length) return 0;

    const cmp = compagne[0]; // assume one compagne
    const cat = cmp.categories?.find((c) => c.name === categoryName);
    if (!cat) return 0;

    const param = cat.parameters?.find((p) => p.name === paramName);
    if (!param) return 0;

    return param.percent || 0;
  };

  /* ===================================================
     CALCULATE TOTALS
  =================================================== */
  const calcRowTotals = (op, p) => {
    const total =
      (p.primes || 0) +
      (p.taxe || 0) +
      (p.taxepara || 0) +
      (p.accessoire || 0) +
      (p.cnpc || 0);

    const percent = getPercentForParameter(op.category, p.name);
    const commission = (p.primes || 0) * (percent / 100);

    // ✅ TVA comes from DB field tvaRate
    const tva = commission * (Number(op.tvaRate ?? 0) / 100);

    const montantTotal = total - commission + tva;

    return { total, commission, tva, montantTotal };
  };

  const calcOperationMontantTotal = (op) => {
    if (!op.parameters || !Array.isArray(op.parameters)) return 0;

    return op.parameters.reduce((sum, p) => {
      const { montantTotal } = calcRowTotals(op, p);
      return sum + montantTotal;
    }, 0);
  };

  const grandTotalMontant = operations.reduce((acc, op) => {
    return acc + calcOperationMontantTotal(op);
  }, 0);

  /* ===================================================
     SAVE EDIT
  =================================================== */
  const handleSave = async (id) => {
    try {
      const payload = { ...editData, parameters: editParams };

      await axios.put(`${API_BASE}/productions/${id}`, payload, { headers });

      setOperations((prev) =>
        prev.map((o) => (o._id === id ? { ...o, ...payload } : o))
      );

      setEditId(null);
      setOpenDetails(null);
      alert("Updated successfully!");
    } catch (err) {
      console.error(err);
    }
  };

  /* ===================================================
     PAGINATION
  =================================================== */
  const indexOfLast = currentPage * perPage;
  const indexOfFirst = indexOfLast - perPage;
  const currentOps = operations.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(operations.length / perPage);

  return (
    <div>
      <div className="card border-0 shadow-lg">
        <div className="card-header bg-primary text-white py-3">
          <h4 className="mb-0 fw-semibold d-flex align-items-center gap-2">
            <FaList /> Liste des Opérations
          </h4>
        </div>

        <div className="card-body p-4">
          <div className="table-responsive">
            <table className="table table-hover align-middle text-center mb-0">
              <thead className="table-dark">
                <tr>
                  <th>Nature</th>
                  <th>Client</th>
                  <th>Catégorie</th>
                  <th>Police</th>
                  <th>Mois</th>
                  <th>Date Effet</th>
                  <th>TVA</th>
                  <th>TTC</th>
                  <th>Total montant</th>
                  <th>Actions</th>
                  <th>Reglement</th>
                </tr>
              </thead>

              <tbody>
                {currentOps.flatMap((op) => {
                  const editing = editId === op._id;

                  const mainRow = (
                    <tr key={op._id}>
                      <td>
                        {editing ? (
                          <input
                            name="natureOperation"
                            className="form-control"
                            value={editData.natureOperation || ""}
                            onChange={handleChange}
                          />
                        ) : (
                          op.natureOperation
                        )}
                      </td>

                      <td>
                        {editing ? (
                          <input
                            name="client"
                            className="form-control"
                            value={editData.client || ""}
                            onChange={handleChange}
                          />
                        ) : (
                          op.client
                        )}
                      </td>

                      <td>
                        {editing ? (
                          <input
                            name="category"
                            className="form-control"
                            value={editData.category || ""}
                            onChange={handleChange}
                          />
                        ) : (
                          <span className="badge bg-secondary">
                            {op.category}
                          </span>
                        )}
                      </td>

                      <td>
                        {editing ? (
                          <input
                            name="numpolice"
                            className="form-control"
                            value={editData.numpolice || ""}
                            onChange={handleChange}
                          />
                        ) : (
                          <span className="fw-bold text-primary">
                            {op.numpolice}
                          </span>
                        )}
                      </td>

                      <td>
                        {editing ? (
                          <input
                            type="date"
                            name="moisDem"
                            className="form-control"
                            value={editData.moisDem ? editData.moisDem.slice(0, 10) : ""}
                            onChange={handleChange}
                          />
                        ) : op.moisDem ? (
                          new Date(op.moisDem).toLocaleDateString("fr-FR", {
                            month: "short",
                            year: "2-digit",
                          })
                        ) : (
                          "-"
                        )}
                      </td>

                      <td>
                        {editing ? (
                          <input
                            type="date"
                            name="dateEff"
                            className="form-control"
                            value={editData.dateEff ? editData.dateEff.slice(0, 10) : ""}
                            onChange={handleChange}
                          />
                        ) : op.dateEff ? (
                          new Date(op.dateEff).toLocaleDateString("fr-FR")
                        ) : (
                          "-"
                        )}
                      </td>

                      {/* ✅ TVA RATE FIELD */}
                      <td>
                        {editing ? (
                          <input
                            name="tvaRate"
                            type="number"
                            className="form-control"
                            value={editData.tvaRate ?? 0}
                            onChange={handleChange}
                          />
                        ) : (
                          <span className="badge bg-secondary">
                            {op.tvaRate ?? 0} %
                          </span>
                        )}
                      </td>

                      {/* TTC */}
                      <td className="fw-bold text-success fs-6">
                        {(
                          (op.parameters || []).reduce(
                            (t, p) =>
                              t +
                              (p.primes || 0) +
                              (p.taxe || 0) +
                              (p.taxepara || 0) +
                              (p.accessoire || 0) +
                              (p.cnpc || 0),
                            0
                          ) || 0
                        ).toFixed(2)}{" "}
                        DH
                      </td>

                      {/* Total Montant */}
                      <td className="fw-bold text-primary">
                        {calcOperationMontantTotal(op).toFixed(2)} DH
                      </td>

                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          {editing ? (
                            <>
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => handleSave(op._id)}
                              >
                                Save All
                              </button>

                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => {
                                  setEditId(null);
                                  setOpenDetails(null);
                                }}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="btn btn-sm btn-outline-info"
                                onClick={() =>
                                  setOpenDetails(openDetails === op._id ? null : op._id)
                                }
                              >
                                <FaEye />
                              </button>

                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => {
                                  setEditId(op._id);
                                  setOpenDetails(op._id);
                                  setEditData({
                                    natureOperation: op.natureOperation,
                                    client: op.client,
                                    category: op.category,
                                    numpolice: op.numpolice,
                                    moisDem: op.moisDem,
                                    dateEff: op.dateEff,
                                    tvaRate: op.tvaRate, // ✅ include
                                  });
                                  setEditParams(op.parameters || []);
                                }}
                              >
                                <FaEdit />
                              </button>

                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(op._id)}
                              >
                                <FaTrash />
                              </button>
                            </>
                          )}
                        </div>
                      </td>

                      <td>
                        {isOperationFullyPaid(op) ? (
                          <span className="badge bg-success">Payé</span>
                        ) : (
                          <Link
                            to={"/regelements/" + op._id}
                            className="badge bg-warning text-dark underline-hover"
                          >
                            En attente
                          </Link>
                        )}
                      </td>
                    </tr>
                  );

                  const detailsRow =
                    openDetails === op._id ? (
                      <tr key={`${op._id}-details`}>
                        <td colSpan="11">
                          <table className="table table-bordered bg-light mt-3">
                            <thead className="table-secondary text-center">
                              <tr>
                                <th>Paramètre</th>
                                <th>Primes</th>
                                <th>Taxe</th>
                                <th>Taxepara</th>
                                <th>Accessoire</th>
                                <th>CNPC</th>
                                <th>Total</th>
                                <th>Commission</th>
                                <th>TVA</th>
                                <th>Montant Total</th>
                              </tr>
                            </thead>

                            <tbody>
                              {(editing ? editParams : op.parameters || []).map((p, i) => {
                                const { total, commission, tva, montantTotal } = calcRowTotals(op, p);

                                return (
                                  <tr key={i}>
                                    <td>
                                      {editing ? (
                                        <input
                                          className="form-control"
                                          value={p.name || ""}
                                          onChange={(e) =>
                                            handleParamChange(i, "name", e.target.value)
                                          }
                                        />
                                      ) : (
                                        p.name
                                      )}
                                    </td>

                                    <td>
                                      {editing ? (
                                        <input
                                          type="number"
                                          className="form-control"
                                          value={p.primes || 0}
                                          onChange={(e) =>
                                            handleParamChange(i, "primes", Number(e.target.value))
                                          }
                                        />
                                      ) : (
                                        p.primes
                                      )}
                                    </td>

                                    <td>
                                      {editing ? (
                                        <input
                                          type="number"
                                          className="form-control"
                                          value={p.taxe || 0}
                                          onChange={(e) =>
                                            handleParamChange(i, "taxe", Number(e.target.value))
                                          }
                                        />
                                      ) : (
                                        p.taxe
                                      )}
                                    </td>

                                    <td>
                                      {editing ? (
                                        <input
                                          type="number"
                                          className="form-control"
                                          value={p.taxepara || 0}
                                          onChange={(e) =>
                                            handleParamChange(i, "taxepara", Number(e.target.value))
                                          }
                                        />
                                      ) : (
                                        p.taxepara
                                      )}
                                    </td>

                                    <td>
                                      {editing ? (
                                        <input
                                          type="number"
                                          className="form-control"
                                          value={p.accessoire || 0}
                                          onChange={(e) =>
                                            handleParamChange(i, "accessoire", Number(e.target.value))
                                          }
                                        />
                                      ) : (
                                        p.accessoire
                                      )}
                                    </td>

                                    <td>
                                      {editing ? (
                                        <input
                                          type="number"
                                          className="form-control"
                                          value={p.cnpc || 0}
                                          onChange={(e) =>
                                            handleParamChange(i, "cnpc", Number(e.target.value))
                                          }
                                        />
                                      ) : (
                                        p.cnpc
                                      )}
                                    </td>

                                    <td className="fw-bold">{total.toFixed(2)}</td>
                                    <td className="fw-bold text-warning">{commission.toFixed(2)}</td>
                                    <td className="fw-bold text-info">{tva.toFixed(2)}</td>
                                    <td className="fw-bold text-primary">{montantTotal.toFixed(2)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    ) : null;

                  return [mainRow, detailsRow].filter(Boolean);
                })}
              </tbody>
            </table>
          </div>

          {/* Total general */}
          {operations.length > 0 && (
            <div className="mt-3 text-end fw-bold">
              Total général Montant: {grandTotalMontant.toFixed(2)} DH
            </div>
          )}

          {/* Pagination */}
          {operations.length > 0 && (
            <div className="d-flex justify-content-between mt-4 pt-3 border-top">
              <button
                className="btn btn-outline-secondary"
                onClick={() => setCurrentPage((p) => p - 1)}
                disabled={currentPage === 1}
              >
                <FaArrowLeft /> Précédent
              </button>

              <span>
                Page {currentPage} sur {totalPages}
              </span>

              <button
                className="btn btn-primary"
                onClick={() => setCurrentPage((p) => p + 1)}
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
