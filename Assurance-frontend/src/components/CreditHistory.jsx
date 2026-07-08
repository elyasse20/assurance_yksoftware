// ✅ CreditHistory with PDF export (Client / All / Compagne+Category)
// Install once:
// npm i jspdf jspdf-autotable

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Navbar } from "./NavBar";
import {
  FaHistory,
  FaUser,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaCreditCard,
  FaArrowLeft,
  FaSearch,
  FaTag,
  FaFilePdf,
} from "react-icons/fa";
import { useAuth } from "./context/AuthContext";
import { API_BASE } from "../config";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function CreditHistory() {
  const { user } = useAuth();
  const headers = { Authorization: `Bearer ${user?.token}` };

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allRows, setAllRows] = useState([]);

  // filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompagne, setSelectedCompagne] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // ✅ Helper: build rows from reglements
  const buildRowsFromReglements = (reglements = []) => {
    const rows = [];

    reglements.forEach((reglement) => {
      const clientName = reglement.client?.nom
        ? `${reglement.client.nom} ${reglement.client.prenom || ""}`.trim()
        : String(
            reglement.clientName ||
              reglement.client ||
              reglement.nomClient ||
              ""
          ).trim();

      const clientId = reglement.client?._id || reglement.clientId || null;

      const operationDate =
        reglement.dateEff || reglement.createdAt || new Date().toISOString();

      const operationAmount = Number(reglement.montantTotal) || 0;

      // ⚠️ Adjust these mappings if your backend uses different keys:
      const compagne =
        reglement.compagne ||
        reglement.production?.compagne ||
        reglement.operation?.compagne ||
        "";

      const category =
        reglement.category ||
        reglement.production?.category ||
        reglement.operation?.category ||
        "";

      // OPERATION (credit)
      rows.push({
        type: "OPERATION",
        rowDate: operationDate,

        clientId,
        clientName,

        reglementId: reglement._id,
        operationId: reglement.production,

        compagne,
        category,

        creditAmount: operationAmount,
        paidAmount: 0,

        paymentMode: "-",
        bankName: "-",
        chequeNumber: "-",
        comment: "-",
      });

      // PAYMENTS
      (reglement.payments || []).forEach((payment) => {
        const paymentDate =
          payment.dateEcheance ||
          payment.dateVirement ||
          operationDate ||
          new Date().toISOString();

        rows.push({
          type: "PAIEMENT",
          rowDate: paymentDate,

          clientId,
          clientName,

          reglementId: reglement._id,
          operationId: reglement.production,

          compagne,
          category,

          creditAmount: 0,
          paidAmount: Number(payment.montant) || 0,

          paymentMode: payment.mode || "-",
          bankName: payment.banque || "-",
          chequeNumber: payment.numero || "-",
          comment: payment.commentaire || "-",
        });
      });
    });

    rows.sort((a, b) => new Date(b.rowDate) - new Date(a.rowDate));
    return rows;
  };

  useEffect(() => {
    if (!user?.token) return;

    const fetchInitialData = async () => {
      try {
        setLoading(true);

        const [clientsRes, regsRes] = await Promise.all([
          axios.get(`${API_BASE}/clients`, { headers }),
          axios.get(`${API_BASE}/regelements/all`, { headers }),
        ]);

        setClients(clientsRes.data || []);
        setAllRows(buildRowsFromReglements(regsRes.data || []));
      } catch (err) {
        console.error("Error fetching initial data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [user?.token]);

  // suggestions for search
  const filteredClients = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];
    return clients.filter((client) =>
      `${client.nom} ${client.prenom || ""}`.toLowerCase().includes(term)
    );
  }, [clients, searchTerm]);

  // dropdown options
  const compagneOptions = useMemo(() => {
    const set = new Set();
    allRows.forEach((r) => r.compagne && set.add(r.compagne));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allRows]);

  const categoryOptions = useMemo(() => {
    const set = new Set();
    allRows.forEach((r) => {
      if (selectedCompagne && r.compagne !== selectedCompagne) return;
      if (r.category) set.add(r.category);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allRows, selectedCompagne]);

  useEffect(() => {
    setSelectedCategory("");
  }, [selectedCompagne]);

  // ✅ filtered rows shown in UI
  const tableRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    let base = allRows;

    if (term) {
      base = base.filter((r) =>
        (r.clientName || "").toLowerCase().includes(term)
      );
    }
    if (selectedCompagne) {
      base = base.filter((r) => r.compagne === selectedCompagne);
    }
    if (selectedCategory) {
      base = base.filter((r) => r.category === selectedCategory);
    }

    return [...base].sort((a, b) => new Date(b.rowDate) - new Date(a.rowDate));
  }, [allRows, searchTerm, selectedCompagne, selectedCategory]);

  // ✅ totals for current filtered view
  const totals = useMemo(() => {
    const totalCredit = tableRows
      .filter((r) => r.type === "OPERATION")
      .reduce((s, r) => s + (Number(r.creditAmount) || 0), 0);

    const totalPaid = tableRows
      .filter((r) => r.type === "PAIEMENT")
      .reduce((s, r) => s + (Number(r.paidAmount) || 0), 0);

    return {
      totalCredit,
      totalPaid,
      remaining: Math.max(totalCredit - totalPaid, 0),
    };
  }, [tableRows]);

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedCompagne("");
    setSelectedCategory("");
  };

  // ✅ PDF export helpers
  const makeFileSafe = (s = "") =>
    String(s).replace(/[\\/:*?"<>|]/g, "-").trim();

  const buildPdfTitle = () => {
    const clientPart = searchTerm ? `Client: ${searchTerm}` : "Tous les clients";
    const comp = selectedCompagne ? ` | Compagne: ${selectedCompagne}` : "";
    const cat = selectedCategory ? ` | Catégorie: ${selectedCategory}` : "";
    return `${clientPart}${comp}${cat}`;
  };

  const downloadFacturePDF = () => {
    // If you want to force "one client only", you can validate here:
    // if (!searchTerm) return alert("Choisissez un client (recherche) pour la facture.");

    const doc = new jsPDF({ unit: "pt", format: "a4" });

    const title = "FACTURE / HISTORIQUE CRÉDIT & PAIEMENTS";
    const subtitle = buildPdfTitle();
    const now = new Date().toLocaleString("fr-FR");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(title, 40, 40);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(subtitle, 40, 60);
    doc.text(`Date génération: ${now}`, 40, 75);

    doc.setFont("helvetica", "bold");
    doc.text(`Total Crédit: ${totals.totalCredit.toFixed(2)} DH`, 40, 100);
    doc.text(`Total Payé:  ${totals.totalPaid.toFixed(2)} DH`, 40, 115);
    doc.text(`Reste:       ${totals.remaining.toFixed(2)} DH`, 40, 130);

    const rowsForPdf = [...tableRows].sort(
      (a, b) => new Date(a.rowDate) - new Date(b.rowDate) // PDF often nicer ASC
    );

    autoTable(doc, {
      startY: 150,
      head: [
        [
          "Date",
          "Client",
          "Type",
          "Compagne",
          "Catégorie",
          "Crédit",
          "Paiement",
          "Mode",
          "Banque",
          "N°",
          "Commentaire",
        ],
      ],
      body: rowsForPdf.map((r) => [
        new Date(r.rowDate).toLocaleDateString("fr-FR"),
        r.clientName || "-",
        r.type,
        r.compagne || "-",
        r.category || "-",
        (Number(r.creditAmount) || 0).toFixed(2),
        (Number(r.paidAmount) || 0).toFixed(2),
        r.paymentMode || "-",
        r.bankName || "-",
        r.chequeNumber || "-",
        r.comment || "-",
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fontSize: 8 },
      theme: "striped",
    });

    const fileName = makeFileSafe(
      `facture-${searchTerm || "tous"}-${selectedCompagne || "all"}-${
        selectedCategory || "all"
      }.pdf`
    );

    doc.save(fileName);
  };

  // ✅ quick export modes
  const exportAll = () => {
    clearAllFilters();
    // wait state update? we export current view, so export after UI already "all":
    // simplest: export directly from unfiltered data:
    // build a temp view:
    const tempRows = [...allRows].sort((a, b) => new Date(b.rowDate) - new Date(a.rowDate));
    const tempTotals = {
      totalCredit: tempRows.filter(r => r.type==="OPERATION").reduce((s,r)=>s+(Number(r.creditAmount)||0),0),
      totalPaid: tempRows.filter(r => r.type==="PAIEMENT").reduce((s,r)=>s+(Number(r.paidAmount)||0),0),
    };
    tempTotals.remaining = Math.max(tempTotals.totalCredit - tempTotals.totalPaid, 0);

    // quick hack: temporarily generate PDF based on temp values (no state)
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("FACTURE / HISTORIQUE CRÉDIT & PAIEMENTS", 40, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Tous les clients | Toutes compagnes | Toutes catégories", 40, 60);
    doc.text(`Date génération: ${new Date().toLocaleString("fr-FR")}`, 40, 75);

    doc.setFont("helvetica", "bold");
    doc.text(`Total Crédit: ${tempTotals.totalCredit.toFixed(2)} DH`, 40, 100);
    doc.text(`Total Payé:  ${tempTotals.totalPaid.toFixed(2)} DH`, 40, 115);
    doc.text(`Reste:       ${tempTotals.remaining.toFixed(2)} DH`, 40, 130);

    autoTable(doc, {
      startY: 150,
      head: [["Date", "Client", "Type", "Compagne", "Catégorie", "Crédit", "Paiement"]],
      body: [...tempRows].sort((a,b)=>new Date(a.rowDate)-new Date(b.rowDate)).map((r) => [
        new Date(r.rowDate).toLocaleDateString("fr-FR"),
        r.clientName || "-",
        r.type,
        r.compagne || "-",
        r.category || "-",
        (Number(r.creditAmount) || 0).toFixed(2),
        (Number(r.paidAmount) || 0).toFixed(2),
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      theme: "striped",
    });

    doc.save("facture-tous-clients.pdf");
  };

  return (
    <>
      <Navbar />

      <div className="container-fluid my-4">
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-lg">
              <div className="card-header bg-primary text-white py-3">
                <div className="d-flex align-items-center justify-content-between">
                  <h4 className="mb-0 fw-semibold">
                    <FaHistory className="me-2" />
                    Historique Crédit & Paiements
                  </h4>

                  <div className="d-flex gap-2">
                    {(searchTerm || selectedCompagne || selectedCategory) && (
                      <button
                        className="btn btn-outline-light btn-sm"
                        onClick={clearAllFilters}
                      >
                        Afficher tout
                      </button>
                    )}

                    {/* ✅ PDF buttons */}
                    <button
                      className="btn btn-light btn-sm d-flex align-items-center gap-2"
                      onClick={downloadFacturePDF}
                      title="Exporter la vue actuelle (client/compagne/catégorie)"
                    >
                      <FaFilePdf />
                      Export PDF (vue)
                    </button>

                    <button
                      className="btn btn-outline-light btn-sm d-flex align-items-center gap-2"
                      onClick={exportAll}
                      title="Exporter tout l'historique"
                    >
                      <FaFilePdf />
                      PDF (tout)
                    </button>

                    <button
                      className="btn btn-light btn-sm d-flex align-items-center gap-2"
                      onClick={() => window.history.back()}
                    >
                      <FaArrowLeft /> Retour
                    </button>
                  </div>
                </div>
              </div>

              <div className="card-body p-4">
                {/* FILTERS */}
                <div className="row g-3 mb-4">
                  {/* client search */}
                  <div className="col-lg-4 col-12">
                    <label className="form-label fw-semibold text-dark">
                      <FaSearch className="me-2" />
                      Client
                    </label>

                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <FaUser className="text-primary" />
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0"
                        placeholder="Tapez un nom/prénom..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    {searchTerm && filteredClients.length > 0 && (
                      <div
                        className="list-group mt-2"
                        style={{ maxHeight: "200px", overflowY: "auto" }}
                      >
                        {filteredClients.map((client) => (
                          <button
                            key={client._id}
                            type="button"
                            className="list-group-item list-group-item-action"
                            onClick={() =>
                              setSearchTerm(
                                `${client.nom} ${client.prenom || ""}`.trim()
                              )
                            }
                          >
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <strong>
                                  {client.nom} {client.prenom || ""}
                                </strong>
                                <br />
                                <small className="text-muted">
                                  Crédit:{" "}
                                  <strong className="text-info">
                                    {client.credit?.toFixed(2)} DH
                                  </strong>
                                </small>
                              </div>
                              <span className="badge bg-primary">
                                {client.tel}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* compagne */}
                  <div className="col-lg-4 col-12">
                    <label className="form-label fw-semibold text-dark">
                      <FaTag className="me-2" />
                      Compagne
                    </label>
                    <select
                      className="form-select"
                      value={selectedCompagne}
                      onChange={(e) => setSelectedCompagne(e.target.value)}
                    >
                      <option value="">Toutes</option>
                      {compagneOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* category */}
                  <div className="col-lg-4 col-12">
                    <label className="form-label fw-semibold text-dark">
                      <FaTag className="me-2" />
                      Catégorie
                    </label>
                    <select
                      className="form-select"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      disabled={!categoryOptions.length}
                    >
                      <option value="">Toutes</option>
                      {categoryOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* SUMMARY */}
                <div className="row g-3 mb-3">
                  <div className="col-md-4">
                    <div className="alert alert-primary mb-0">
                      <strong>Total Crédit:</strong>{" "}
                      {totals.totalCredit.toFixed(2)} DH
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="alert alert-success mb-0">
                      <strong>Total Payé:</strong>{" "}
                      {totals.totalPaid.toFixed(2)} DH
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="alert alert-warning mb-0">
                      <strong>Reste:</strong> {totals.remaining.toFixed(2)} DH
                    </div>
                  </div>
                </div>

                {/* TABLE */}
                <div className="col-12">
                  <h5 className="mb-3 border-bottom pb-2">
                    <FaHistory className="me-2" />
                    Historique (Crédit + Paiements)
                  </h5>

                  {loading ? (
                    <div className="alert alert-info">Chargement...</div>
                  ) : tableRows.length === 0 ? (
                    <div className="alert alert-warning">
                      Aucun élément trouvé
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover table-striped">
                        <thead className="table-primary">
                          <tr>
                            <th>Client</th>
                            <th>
                              <FaCalendarAlt className="me-2" />
                              Date
                            </th>
                            <th>Type</th>
                            <th>Compagne</th>
                            <th>Catégorie</th>
                            <th>
                              <FaMoneyBillWave className="me-2" />
                              Crédit
                            </th>
                            <th>
                              <FaCreditCard className="me-2" />
                              Paiement
                            </th>
                            <th>Mode</th>
                            <th>Banque</th>
                            <th>N°</th>
                            <th>Commentaire</th>
                          </tr>
                        </thead>

                        <tbody>
                          {tableRows.map((item, idx) => (
                            <tr key={idx}>
                              <td>{item.clientName || "-"}</td>
                              <td>
                                <strong>
                                  {new Date(item.rowDate).toLocaleDateString(
                                    "fr-FR"
                                  )}
                                </strong>
                              </td>
                              <td>
                                <span
                                  className={`badge ${
                                    item.type === "OPERATION"
                                      ? "bg-warning text-dark"
                                      : "bg-secondary"
                                  }`}
                                >
                                  {item.type}
                                </span>
                              </td>
                              <td>{item.compagne || "-"}</td>
                              <td>{item.category || "-"}</td>
                              <td>
                                <strong className="text-primary">
                                  {Number(item.creditAmount || 0).toFixed(2)} DH
                                </strong>
                              </td>
                              <td>
                                <strong className="text-success">
                                  {Number(item.paidAmount || 0).toFixed(2)} DH
                                </strong>
                              </td>
                              <td>{item.paymentMode || "-"}</td>
                              <td>{item.bankName || "-"}</td>
                              <td>{item.chequeNumber || "-"}</td>
                              <td>
                                <small className="text-muted">
                                  {item.comment || "-"}
                                </small>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                {/* end table */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
