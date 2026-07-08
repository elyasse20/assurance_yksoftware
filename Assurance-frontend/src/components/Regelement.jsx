import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Navbar } from "./NavBar";
import {
  FaMoneyBill,
  FaPlusCircle,
  FaTrash,
  FaCreditCard,
  FaUniversity,
  FaCalendarAlt,
  FaHashtag,
  FaFileUpload,
  FaUser,
  FaTag,
  FaSave,
  FaArrowLeft,
  FaHistory,
} from "react-icons/fa";
import { useAuth } from "./context/AuthContext";
import { API_BASE } from "../config";

export default function Regelement() {
  const { id } = useParams();
  const { user } = useAuth();
  const headers = { Authorization: `Bearer ${user?.token}` };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [reglement, setReglement] = useState({
    natureOperation: "",
    client: "",
    dateEff: "",
    moisDem: "",
    compagne: "",
    category: "",
    numpolice: "",
    montantTotal: 0, // TTC
  });

  // Already paid for THIS operation (from DB)
  const [initialPaid, setInitialPaid] = useState(0);

  // Client credit (all operations - all paid)
  const [clientCredit, setClientCredit] = useState(0);

  // Old payments (read-only)
  const [paymentHistory, setPaymentHistory] = useState([]);

  // New payments to add now
  const [payments, setPayments] = useState([
    {
      mode: "CHEQUE",
      montant: "",
      dateEcheance: "",
      banque: "",
      numero: "",
      emporteur: "",
      dateVirement: "",
      doc: null,
      commentaire: "",
    },
  ]);

  // ===== Helpers =====
  const calcTTC = (parameters = []) => {
    return (parameters || []).reduce((sum, p) => {
      return (
        sum +
        (Number(p?.primes) || 0) +
        (Number(p?.taxe) || 0) +
        (Number(p?.taxepara) || 0) +
        (Number(p?.accessoire) || 0) +
        (Number(p?.cnpc) || 0)
      );
    }, 0);
  };

  const emptyPaymentRow = () => ({
    mode: "CHEQUE",
    montant: "",
    dateEcheance: "",
    banque: "",
    numero: "",
    emporteur: "",
    dateVirement: "",
    doc: null,
    commentaire: "",
  });

  // ====== FETCH PRODUCTION + CLIENT CREDIT + REGLEMENT ======
  useEffect(() => {
    if (!user?.token || !id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        // 1) Production
        const prodRes = await axios.get(`${API_BASE}/productions/${id}`, {
          headers,
        });
        const op = prodRes.data || {};

        const ttc = calcTTC(op.parameters || []);

        setReglement((prev) => ({
          ...prev,
          natureOperation: op.natureOperation || "",
          client: op.client || "",
          dateEff: op.dateEff || "",
          moisDem: op.moisDem || "",
          compagne: op.compagne || "",
          category: op.category || "",
          numpolice: op.numpolice || "",
          montantTotal: ttc,
        }));

        // 2) Client credit (all operations - all payments)
        try {
          const clientName = op.client;

          // Fetch all productions for this client
          const allProdRes = await axios.get(
            `${API_BASE}/productions?client=${encodeURIComponent(clientName)}`,
            { headers }
          );
          const allOperations = allProdRes.data || [];

          const totalOperationsTTC = allOperations.reduce((sum, operation) => {
            return sum + calcTTC(operation.parameters || []);
          }, 0);

          // Fetch all reglements for this client
          const allRegRes = await axios.get(
            `${API_BASE}/regelements?client=${encodeURIComponent(clientName)}`,
            { headers }
          );
          const allReglements = allRegRes.data || [];

          const totalPaidAll = allReglements.reduce((sum, reg) => {
            const regTotal = (reg.payments || []).reduce((pSum, p) => {
              return pSum + (Number(p?.montant) || 0);
            }, 0);
            return sum + regTotal;
          }, 0);

          const calculatedCredit = Math.max(totalOperationsTTC - totalPaidAll, 0);
          setClientCredit(calculatedCredit);
        } catch (clientErr) {
          console.error(
            "Could not calculate client credit:",
            clientErr?.response?.data || clientErr.message
          );
          setClientCredit(0);
        }

        // 3) Existing reglement for this production (payments already stored)
        try {
          const regRes = await axios.get(`${API_BASE}/regelements/${id}`, {
            headers,
          });
          const reg = regRes.data || {};

          setReglement((prev) => ({
            ...prev,
            natureOperation: reg.natureOperation || prev.natureOperation,
            client: reg.client || prev.client,
            dateEff: reg.dateEff || prev.dateEff,
            moisDem: reg.moisDem || prev.moisDem,
            compagne: reg.compagne || prev.compagne,
            category: reg.category || prev.category,
            numpolice: reg.numpolice || prev.numpolice,
            montantTotal:
              typeof reg.montantTotal === "number" ? reg.montantTotal : prev.montantTotal,
          }));

          const alreadyPaid = (reg.payments || []).reduce((sum, p) => {
            return sum + (Number(p?.montant) || 0);
          }, 0);
          setInitialPaid(alreadyPaid);

          if (Array.isArray(reg.payments) && reg.payments.length > 0) {
            setPaymentHistory(
              reg.payments.map((p) => ({
                mode: p.mode || "CHEQUE",
                montant: Number(p.montant) || 0,
                dateEcheance: p.dateEcheance ? p.dateEcheance.slice(0, 10) : "",
                banque: p.banque || "",
                numero: p.numero || "",
                emporteur: p.emporteur || "",
                dateVirement: p.dateVirement ? p.dateVirement.slice(0, 10) : "",
                doc: p.doc || null,
                commentaire: p.commentaire || "",
              }))
            );
          } else {
            setPaymentHistory([]);
          }

          // Keep new payments empty row ready for input
          setPayments([emptyPaymentRow()]);
        } catch (regErr) {
          // 404 = no reglement yet, OK
          if (regErr.response?.status !== 404) {
            console.error("Erreur get /regelements/:id", regErr);
          }
          setInitialPaid(0);
          setPaymentHistory([]);
          setPayments([emptyPaymentRow()]);
        }
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement du règlement");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.token]);

  // ====== HANDLERS PAIEMENT ======
  const handlePaymentChange = (index, field, value) => {
    setPayments((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleFileChange = (index, file) => {
    setPayments((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], doc: file };
      return copy;
    });
  };

  const addPayment = () => setPayments((prev) => [...prev, emptyPaymentRow()]);

  const removePayment = (index) => {
    setPayments((prev) => prev.filter((_, i) => i !== index));
  };

  // ====== CALCULATIONS (FIXED) ======

  // New payments total (what user typed now)
  const newPaymentsTotal = useMemo(() => {
    return payments.reduce((sum, p) => {
      const m = parseFloat(p.montant || "0");
      return sum + (isNaN(m) ? 0 : m);
    }, 0);
  }, [payments]);

  // Total paid for THIS operation after adding the new payments
  const totalPaidAfter = useMemo(() => {
    return (Number(initialPaid) || 0) + (Number(newPaymentsTotal) || 0);
  }, [initialPaid, newPaymentsTotal]);

  // Remaining for this operation BEFORE adding new payments
  const remainingForThisOperation = useMemo(() => {
    return Math.max((Number(reglement.montantTotal) || 0) - (Number(initialPaid) || 0), 0);
  }, [reglement.montantTotal, initialPaid]);

  // Remaining for this operation AFTER adding new payments (this is the correct reste à payer)
  const resteAPayer = useMemo(() => {
    return Math.max((Number(reglement.montantTotal) || 0) - (Number(totalPaidAfter) || 0), 0);
  }, [reglement.montantTotal, totalPaidAfter]);

  // "Ce règlement" = new payments only
  const newPaymentAmount = newPaymentsTotal;

  // Maximum allowed to pay in THIS session = min(clientCredit, remaining for this operation)
  const maxPayableAmount = useMemo(() => {
    return Math.min(Number(clientCredit) || 0, Number(remainingForThisOperation) || 0);
  }, [clientCredit, remainingForThisOperation]);

  const exceedsCredit = useMemo(() => {
    return newPaymentsTotal > maxPayableAmount;
  }, [newPaymentsTotal, maxPayableAmount]);

  // ====== SUBMIT ======
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate: new payments must be > 0
    if (newPaymentsTotal <= 0) {
      setError("❌ Veuillez entrer au moins un montant de paiement");
      return;
    }

    // Validate: cannot exceed allowed max for this session
    if (newPaymentsTotal > maxPayableAmount) {
      setError(
        `❌ Le montant du paiement (${newPaymentsTotal.toFixed(
          2
        )} DH) dépasse le maximum autorisé (${maxPayableAmount.toFixed(2)} DH).`
      );
      return;
    }

    try {
      // Only send payments with montant > 0
      const validPayments = payments
        .map((p) => {
          const m = parseFloat(p.montant || "0");
          return {
            ...p,
            montant: isNaN(m) ? 0 : m,
          };
        })
        .filter((p) => p.montant > 0);

      if (validPayments.length === 0) {
        setError("❌ Aucun paiement valide à enregistrer");
        return;
      }

      const formData = new FormData();
      formData.append("production", id);
      formData.append("reglementId", id);
      formData.append("natureOperation", reglement.natureOperation);
      formData.append("client", reglement.client);
      formData.append("dateEff", reglement.dateEff);
      formData.append("moisDem", reglement.moisDem);
      formData.append("compagne", reglement.compagne);
      formData.append("category", reglement.category);
      formData.append("numpolice", reglement.numpolice);
      formData.append("montantTotal", String(reglement.montantTotal));

      validPayments.forEach((p, i) => {
        formData.append(`payments[${i}][mode]`, p.mode);
        formData.append(`payments[${i}][montant]`, String(p.montant));
        formData.append(`payments[${i}][dateEcheance]`, p.dateEcheance || "");
        formData.append(`payments[${i}][banque]`, p.banque || "");
        formData.append(`payments[${i}][numero]`, p.numero || "");
        formData.append(`payments[${i}][emporteur]`, p.emporteur || "");
        formData.append(`payments[${i}][dateVirement]`, p.dateVirement || "");
        formData.append(`payments[${i}][commentaire]`, p.commentaire || "");
        if (p.doc) formData.append(`payments[${i}][doc]`, p.doc);
      });

      await axios.post(`${API_BASE}/regelements/${id}/paiement`, formData, {
        headers: {
          ...headers,
          // Axios will set multipart boundary automatically
        },
      });

      alert("Règlement enregistré avec succès ✅");
      window.location.reload();
    } catch (err) {
      console.error("Full error:", err);
      console.error("Error response data:", err.response?.data);
      console.error("Error message:", err.message);
      setError(
        `❌ Erreur: ${
          err.response?.data?.message || err.response?.data?.error || err.message
        }`
      );
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container py-4">Chargement...</div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="container my-4">
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-lg">
              <div className="card-header bg-primary text-white py-3">
                <div className="d-flex align-items-center justify-content-between">
                  <h4 className="mb-0 fw-semibold">
                    <FaMoneyBill className="me-2" />
                    Règlement de l'opération
                  </h4>

                  <div className="d-flex flex-column text-end">
                    <span className="badge bg-light text-primary fs-6">
                      Montant TTC à payer : {reglement.montantTotal.toFixed(2)} DH
                    </span>

                    <span className="badge bg-warning text-dark fs-6 mt-2">
                      Crédit client : <strong>{clientCredit.toFixed(2)} DH</strong>
                    </span>

                    <span className="badge bg-info text-white fs-6 mt-2">
                      Max à payer (session) :{" "}
                      <strong>{maxPayableAmount.toFixed(2)} DH</strong>
                    </span>

                    <small className="mt-2">
                      Déjà payé : <strong>{initialPaid.toFixed(2)} DH</strong>
                    </small>

                    <small>
                      Ce règlement : <strong>{newPaymentAmount.toFixed(2)} DH</strong>
                    </small>

                    <small>
                      Total payé après ce règlement :{" "}
                      <strong>{totalPaidAfter.toFixed(2)} DH</strong>
                    </small>

                    <small>
                      Reste à payer :{" "}
                      <strong className={resteAPayer > 0 ? "text-danger" : "text-success"}>
                        {resteAPayer.toFixed(2)} DH
                      </strong>
                    </small>
                  </div>
                </div>
              </div>

              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  <div className="row g-4">
                    {/* ERROR ALERT */}
                    {error && (
                      <div className="col-12">
                        <div className="alert alert-danger py-2">{error}</div>
                      </div>
                    )}

                    {/* WARNING: Exceeds Max */}
                    {exceedsCredit && !error && (
                      <div className="col-12">
                        <div className="alert alert-warning py-2 d-flex align-items-center gap-2">
                          <span>⚠️</span>
                          <strong>
                            Le paiement ({newPaymentsTotal.toFixed(2)} DH) dépasse le maximum
                            autorisé ({maxPayableAmount.toFixed(2)} DH).
                          </strong>
                        </div>
                      </div>
                    )}

                    {/* ====== INFOS GÉNÉRALES (READONLY) ====== */}
                    <div className="col-12">
                      <h5 className="text-secondary mb-3 border-bottom pb-2">
                        <FaTag className="me-2" />
                        Informations de l'opération
                      </h5>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold text-dark">Nature d'opération</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                          <FaTag className="text-primary" />
                        </span>
                        <input
                          type="text"
                          className="form-control border-start-0"
                          value={reglement.natureOperation}
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold text-dark">Client</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                          <FaUser className="text-primary" />
                        </span>
                        <input
                          type="text"
                          className="form-control border-start-0"
                          value={reglement.client}
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold text-dark">Numéro police</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                          <FaHashtag className="text-primary" />
                        </span>
                        <input
                          type="text"
                          className="form-control border-start-0"
                          value={reglement.numpolice}
                          readOnly
                        />
                      </div>
                    </div>

                    {/* ====== PAYMENT HISTORY ====== */}
                    {paymentHistory.length > 0 && (
                      <div className="col-12 mt-4">
                        <h5 className="text-secondary mb-3 border-bottom pb-2">
                          <FaHistory className="me-2" />
                          Historique des paiements
                        </h5>
                        <div className="table-responsive">
                          <table className="table table-sm table-striped table-hover">
                            <thead className="table-light">
                              <tr>
                                <th>Mode</th>
                                <th>Montant</th>
                                <th>Date</th>
                                <th>Banque</th>
                                <th>N° Chèque</th>
                                <th>Commentaire</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paymentHistory.map((p, idx) => (
                                <tr key={idx}>
                                  <td>
                                    <span className="badge bg-secondary">{p.mode}</span>
                                  </td>
                                  <td className="fw-bold text-success">
                                    {Number(p.montant || 0).toFixed(2)} DH
                                  </td>
                                  <td className="small">
                                    {p.dateEcheance || p.dateVirement
                                      ? new Date(p.dateEcheance || p.dateVirement).toLocaleDateString(
                                          "fr-FR"
                                        )
                                      : "-"}
                                  </td>
                                  <td className="small">{p.banque || "-"}</td>
                                  <td className="small">{p.numero || "-"}</td>
                                  <td className="small text-muted">{p.commentaire || "-"}</td>
                                </tr>
                              ))}

                              <tr className="table-secondary fw-bold">
                                <td colSpan="1">TOTAL PAYÉ</td>
                                <td className="text-success">
                                  {paymentHistory
                                    .reduce((sum, p) => sum + (Number(p.montant) || 0), 0)
                                    .toFixed(2)}{" "}
                                  DH
                                </td>
                                <td colSpan="4"></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* ====== SECTION PAIEMENT ====== */}
                    <div className="col-12 mt-4">
                      <h5 className="text-secondary mb-3 border-bottom pb-2">
                        <FaMoneyBill className="me-2" />
                        {paymentHistory.length > 0
                          ? "Ajouter un nouveau paiement"
                          : "Règlement / Moyens de paiement"}
                      </h5>
                    </div>

                    <div className="col-12">
                      <div className="card border-0 shadow-sm">
                        <div className="card-body">
                          {payments.map((p, index) => (
                            <div key={index} className="border rounded-3 p-3 mb-3 bg-light-subtle">
                              <div className="row g-3 align-items-end">
                                {/* MODE */}
                                <div className="col-md-3">
                                  <label className="form-label fw-semibold text-dark">Mode</label>
                                  <div className="input-group">
                                    <span className="input-group-text bg-light border-end-0">
                                      <FaCreditCard className="text-primary" />
                                    </span>
                                    <select
                                      className="form-select border-start-0"
                                      value={p.mode}
                                      onChange={(e) =>
                                        handlePaymentChange(index, "mode", e.target.value)
                                      }
                                    >
                                      <option value="CHEQUE">Chèque / Effet</option>
                                      <option value="ESPECE">Espèce</option>
                                      <option value="VIREMENT">Virement</option>
                                      <option value="AUTRE">Autre</option>
                                    </select>
                                  </div>
                                </div>

                                {/* MONTANT */}
                                <div className="col-md-2">
                                  <label className="form-label fw-semibold text-dark">Montant</label>
                                  <div className="input-group">
                                    <input
                                      type="number"
                                      className="form-control"
                                      value={p.montant}
                                      onChange={(e) =>
                                        handlePaymentChange(index, "montant", e.target.value)
                                      }
                                      placeholder="0.00"
                                      step="0.01"
                                      min="0"
                                    />
                                    <span className="input-group-text">DH</span>
                                  </div>
                                </div>

                                {/* DATE ÉCHÉANCE / VIREMENT */}
                                {(p.mode === "CHEQUE" || p.mode === "VIREMENT") && (
                                  <div className="col-md-3">
                                    <label className="form-label fw-semibold text-dark">
                                      {p.mode === "CHEQUE" ? "Date d'échéance" : "Date de virement"}
                                    </label>
                                    <div className="input-group">
                                      <span className="input-group-text bg-light border-end-0">
                                        <FaCalendarAlt className="text-primary" />
                                      </span>
                                      <input
                                        type="date"
                                        className="form-control border-start-0"
                                        value={p.mode === "CHEQUE" ? p.dateEcheance : p.dateVirement}
                                        onChange={(e) =>
                                          handlePaymentChange(
                                            index,
                                            p.mode === "CHEQUE" ? "dateEcheance" : "dateVirement",
                                            e.target.value
                                          )
                                        }
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* BANQUE */}
                                {(p.mode === "CHEQUE" || p.mode === "VIREMENT") && (
                                  <div className="col-md-3">
                                    <label className="form-label fw-semibold text-dark">Banque</label>
                                    <div className="input-group">
                                      <span className="input-group-text bg-light border-end-0">
                                        <FaUniversity className="text-primary" />
                                      </span>
                                      <input
                                        type="text"
                                        className="form-control border-start-0"
                                        value={p.banque}
                                        onChange={(e) =>
                                          handlePaymentChange(index, "banque", e.target.value)
                                        }
                                        placeholder="Nom de la banque"
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* NUMÉRO */}
                                {(p.mode === "CHEQUE" || p.mode === "VIREMENT") && (
                                  <div className="col-md-3">
                                    <label className="form-label fw-semibold text-dark">Numéro</label>
                                    <div className="input-group">
                                      <span className="input-group-text bg-light border-end-0">
                                        <FaHashtag className="text-primary" />
                                      </span>
                                      <input
                                        type="text"
                                        className="form-control border-start-0"
                                        value={p.numero}
                                        onChange={(e) =>
                                          handlePaymentChange(index, "numero", e.target.value)
                                        }
                                        placeholder="N° chèque / virement"
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* EMPORTEUR (CHEQUE ONLY) */}
                                {p.mode === "CHEQUE" && (
                                  <div className="col-md-3">
                                    <label className="form-label fw-semibold text-dark">Emporteur</label>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={p.emporteur}
                                      onChange={(e) =>
                                        handlePaymentChange(index, "emporteur", e.target.value)
                                      }
                                      placeholder="Nom de l'emporteur"
                                    />
                                  </div>
                                )}

                                {/* DOCUMENT */}
                                <div className="col-md-3">
                                  <label className="form-label fw-semibold text-dark">Joindre document</label>
                                  <div className="input-group">
                                    <span className="input-group-text bg-light">
                                      <FaFileUpload className="text-primary" />
                                    </span>
                                    <input
                                      type="file"
                                      className="form-control"
                                      onChange={(e) => handleFileChange(index, e.target.files?.[0])}
                                    />
                                  </div>
                                </div>

                                {/* COMMENTAIRE */}
                                <div className="col-md-5">
                                  <label className="form-label fw-semibold text-dark">
                                    {p.mode === "AUTRE" ? "Préciser / Commentaire" : "Commentaire"}
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={p.commentaire}
                                    onChange={(e) =>
                                      handlePaymentChange(index, "commentaire", e.target.value)
                                    }
                                    placeholder="Remarques..."
                                  />
                                </div>

                                {/* DELETE */}
                                <div className="col-md-1 text-end">
                                  {payments.length > 1 && (
                                    <button
                                      type="button"
                                      className="btn btn-outline-danger btn-sm"
                                      onClick={() => removePayment(index)}
                                    >
                                      <FaTrash />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}

                          <div className="d-flex justify-content-between align-items-center">
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2"
                              onClick={addPayment}
                            >
                              <FaPlusCircle /> Ajouter un paiement
                            </button>

                            <div className="fw-semibold">
                              Total nouveau paiement :
                              <span className="badge bg-dark fs-6 ms-2">
                                {newPaymentsTotal.toFixed(2)} DH
                              </span>
                            </div>
                          </div>

                          {/* Récap */}
                          <div className="mt-3 text-end">
                            <span className="me-3">
                              Montant TTC : <strong>{reglement.montantTotal.toFixed(2)} DH</strong>
                            </span>
                            <span className="me-3">
                              Déjà payé : <strong>{initialPaid.toFixed(2)} DH</strong>
                            </span>
                            <span className="me-3">
                              Ce règlement : <strong>{newPaymentAmount.toFixed(2)} DH</strong>
                            </span>
                            <span className="me-3">
                              Total payé après : <strong>{totalPaidAfter.toFixed(2)} DH</strong>
                            </span>
                            <span>
                              Reste à payer :{" "}
                              <strong className={resteAPayer > 0 ? "text-danger" : "text-success"}>
                                {resteAPayer.toFixed(2)} DH
                              </strong>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ====== BOUTONS ====== */}
                    <div className="col-12 mt-4">
                      <div className="d-flex justify-content-between">
                        <button
                          type="button"
                          className="btn btn-outline-secondary px-4 py-2 d-flex align-items-center gap-2"
                          onClick={() => window.history.back()}
                        >
                          <FaArrowLeft /> Retour
                        </button>

                        <button
                          type="submit"
                          className="btn btn-success px-4 d-flex align-items-center gap-2"
                          disabled={newPaymentsTotal <= 0 || exceedsCredit}
                        >
                          <FaSave /> Enregistrer le règlement
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              {/* end card-body */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
