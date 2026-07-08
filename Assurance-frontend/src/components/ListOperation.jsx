import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useAuth } from "./context/AuthContext";
import { API_BASE } from "../config";
import { Navbar } from "./NavBar";
import OperationTable from "./OperationTable";
import { 
  FaPlus, 
  FaEye, 
  FaEyeSlash, 
  FaArrowRight, 
  FaArrowLeft, 
  FaSave, 
  FaEdit,
  FaCalculator,
  FaCalendarAlt,
  FaTag,
  FaUser,
  FaHashtag
} from "react-icons/fa";

export default function ListOperation() {
  const { user, logout } = useAuth();
  const [editId, setEditId] = useState(null);
  const [step, setStep] = useState(1);
  const [reload, setReload] = useState(false);
  const [add, setadd] = useState(false);
  const [allCompagnes, setAllCompagnes] = useState([]);
  const [allNatures, setAllNatures] = useState([]);
  const [allClients, setAllClients] = useState([]);
  const [displayMonth, setDisplayMonth] = useState("");
  const [compagneParams, setCompagneParams] = useState([]);
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    natureOperation: "",
    client: "",
    dateEff: "",
    moisDem: "",
    compagne: "",
    category: "",
    numpolice: "",
    parameters: [],
  });

  // Load compagnes and natures
  useEffect(() => {
    const headers = { Authorization: `Bearer ${user?.token}` };
    
    const loadData = async () => {
      try {
        const [compagnesRes, naturesRes, clientsRes] = await Promise.all([
          axios.get(`${API_BASE}/compagnes`, { headers }),
          axios.get(`${API_BASE}/natures`, { headers }),
          axios.get(`${API_BASE}/clients`, { headers })
        ]);
        
        setAllCompagnes(compagnesRes.data || []);
        setAllNatures(naturesRes.data || []);
        setAllClients(clientsRes.data || []);
      } catch (err) {
        console.error("Error loading data:", err);
      }
    };

    loadData();
  }, [user]);

  // Handle field changes with improved cascade logic
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "compagne") {
      // Find selected compagne and its categories
      const selectedCompagne = allCompagnes.find(c => c.compagneName === value);
      const compagneCategories = selectedCompagne?.categories || [];
      
      setCategories(compagneCategories);
      
      // Reset dependent fields
      setFormData((prev) => ({ 
        ...prev, 
        compagne: value,
        category: "",
        client: "",
        numpolice: ""
      }));
      setCompagneParams([]);
      
      console.log("Compagne selected:", value);
      console.log("Available categories:", compagneCategories);
    } 
    else if (name === "category") {
      // Find selected category details
      const selectedCategory = categories.find(cat => cat.name === value);
      
      if (selectedCategory) {
        // Auto-fill client and police number with indec
        const policeNumber = selectedCategory.indec ? `${selectedCategory.indec}-` : "";
        
        setFormData((prev) => ({ 
          ...prev, 
          category: value,
          client: "",
          numpolice: policeNumber
        }));
        
        // Load parameters for step 2
        setCompagneParams(selectedCategory.parameters || []);
        
        console.log("Category selected:", value);
        console.log("Auto-filled police number:", policeNumber);
        console.log("Available parameters:", selectedCategory.parameters);
      }
    }
    else if (name === "moisDem") {
      // Format month display
      const [year, month] = value.split("-");
      const formatted = new Date(year, month - 1).toLocaleDateString("fr-FR", {
        month: "short",
        year: "2-digit",
      });
      setDisplayMonth(formatted);
      setFormData((prev) => ({ ...prev, moisDem: value }));
    } 
    else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle parameter value changes
  const handleValueChange = (paramName, field, value) => {
    setFormData((prev) => {
      const exists = prev.parameters.some((p) => p.name === paramName);
      const updated = exists
        ? prev.parameters.map((p) =>
            p.name === paramName ? { ...p, [field]: Number(value) || 0 } : p
          )
        : [
            ...prev.parameters,
            { 
              name: paramName, 
              primes: 0, 
              taxe: 0, 
              taxepara: 0, 
              accessoire: 0, 
              cnpc: 0, 
              [field]: Number(value) || 0 
            },
          ];
      return { ...prev, parameters: updated };
    });
  };

  // Calculate parameter total
  const computeParamTotal = (param) =>
    (param.primes || 0) +
    (param.taxe || 0) +
    (param.taxepara || 0) +
    (param.accessoire || 0) +
    (param.cnpc || 0);

  // Calculate general total
  const totalGeneral = useMemo(
    () => formData.parameters.reduce((sum, p) => sum + computeParamTotal(p), 0),
    [formData.parameters]
  );

  // Edit operation
  const handleEdit = (operation) => {
    setEditId(operation._id);
    setFormData({
      natureOperation: operation.natureOperation || "",
      client: operation.client || "",
      dateEff: operation.dateEff ? operation.dateEff.split("T")[0] : "",
      moisDem: operation.moisDem || "",
      compagne: operation.compagne || "",
      category: operation.category || "",
      numpolice: operation.numpolice || "",
      parameters: operation.parameters || [],
    });

    // Load categories and parameters for the edited operation
    const matchedCompagne = allCompagnes.find(
      (c) => c.compagneName === operation.compagne
    );
    const compagneCategories = matchedCompagne?.categories || [];
    setCategories(compagneCategories);
    
    const matchedCategory = compagneCategories.find(
      cat => cat.name === operation.category
    );
    setCompagneParams(matchedCategory?.parameters || []);
    
    setStep(1);
    setadd(true); // Show form when editing
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    const headers = { Authorization: `Bearer ${user?.token}` };
    const payload = { ...formData };

    try {
      if (editId) {
        await axios.put(`${API_BASE}/productions/${editId}`, payload, { headers });
        alert("✅ Opération modifiée avec succès");
      } else {
        await axios.post(`${API_BASE}/productions`, payload, { headers });
        alert("✅ Opération enregistrée");
      }
      resetForm();
      setReload((prev) => !prev);
    } catch (err) {
      console.error(err);
      alert("❌ Erreur lors de l'envoi");
    }
    setadd(false)
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      natureOperation: "",
      client: "",
      dateEff: "",
      moisDem: "",
      compagne: "",
      category: "",
      numpolice: "",
      parameters: [],
    });
    setCompagneParams([]);
    setCategories([]);
    setDisplayMonth("");
    setStep(1);
    setEditId(null);
    setadd(false)
  };

  // Function to show form from table
  const showForm = () => {
    setadd(true);
  };

  return (
    <>
      <Navbar lg={logout} />
      <div className="container-fluid py-4">
        {/* Header Section */}
        <div className="row mb-4">
          <div className="col">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="h3 fw-bold text-primary mb-1">Gestion des Opérations</h1>
                <p className="text-muted mb-0">Gérez vos opérations commerciales en toute simplicité</p>
              </div>
              <button 
                className={`btn ${add ? 'btn-outline-danger' : 'btn-primary'} d-flex align-items-center gap-2`}
                onClick={() => setadd(!add)}
              >
                {add ? <><FaEyeSlash /> Cacher le formulaire</> : <><FaPlus /> Nouvelle Opération</>}
              </button>
            </div>
          </div>
        </div>

        {/* FORM */}
        {add && (
          <div className="row mb-4">
            <div className="col-12">
              <div className="card border-0 shadow-lg">
                <div className="card-header bg-primary text-white py-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <h4 className="mb-0 fw-semibold">
                      {editId ? <><FaEdit className="me-2" />Modifier l'opération</> : <><FaPlus className="me-2" />Nouvelle Opération</>}
                    </h4>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-light text-primary fs-6">Étape {step}/2</span>
                    </div>
                  </div>
                </div>
                
                <div className="card-body p-4">
                  <form onSubmit={handleSubmit}>
                    {/* --- STEP 1 --- */}
                    {step === 1 && (
                      <div className="row g-4">
                        <div className="col-12">
                          <h5 className="text-secondary mb-3 border-bottom pb-2">
                            <FaTag className="me-2" />Informations générales
                          </h5>
                        </div>

                        {/* Nature Operation */}
                        <div className="col-md-6">
                          <label className="form-label fw-semibold text-dark">Nature d'opération</label>
                          <div className="input-group">
                            <span className="input-group-text bg-light border-end-0">
                              <FaTag className="text-primary" />
                            </span>
                            <select
                              name="natureOperation"
                              value={formData.natureOperation}
                              onChange={handleChange}
                              className="form-select border-start-0"
                              required
                            >
                              <option value="">Sélectionner une nature</option>
                              {allNatures.map((n) => (
                                <option key={n._id} value={n.name}>{n.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Date Effet */}
                        <div className="col-md-6">
                          <label className="form-label fw-semibold text-dark">Date d'effet</label>
                          <div className="input-group">
                            <span className="input-group-text bg-light border-end-0">
                              <FaCalendarAlt className="text-primary" />
                            </span>
                            <input
                              type="date"
                              name="dateEff"
                              value={formData.dateEff}
                              onChange={handleChange}
                              className="form-control border-start-0"
                              required
                            />
                          </div>
                        </div>

                        {/* Mois Emission */}
                        <div className="col-md-6">
                          <label className="form-label fw-semibold text-dark">Mois d'émission</label>
                          <div className="input-group">
                            <span className="input-group-text bg-light border-end-0">
                              <FaCalendarAlt className="text-primary" />
                            </span>
                            <input
                              type="month"
                              name="moisDem"
                              value={formData.moisDem}
                              onChange={handleChange}
                              className="form-control border-start-0"
                              required
                            />
                            <span className="input-group-text bg-primary text-white fw-semibold">
                              {displayMonth || "—"}
                            </span>
                          </div>
                        </div>

                        {/* Compagne */}
                        <div className="col-md-6">
                          <label className="form-label fw-semibold text-dark">Compagne</label>
                          <div className="input-group">
                            <span className="input-group-text bg-light border-end-0">
                              <FaTag className="text-primary" />
                            </span>
                            <select
                              name="compagne"
                              value={formData.compagne}
                              onChange={handleChange}
                              className="form-select border-start-0"
                              required
                            >
                              <option value="">Sélectionner une compagne</option>
                              {allCompagnes.map((compagne) => (
                                <option key={compagne._id} value={compagne.compagneName}>
                                  {compagne.compagneName}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Category (appears when compagne is selected) */}
                        {formData.compagne && categories.length > 0 && (
                          <div className="col-md-6">
                            <label className="form-label fw-semibold text-dark">Catégorie</label>
                            <div className="input-group">
                              <span className="input-group-text bg-light border-end-0">
                                <FaTag className="text-primary" />
                              </span>
                              <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="form-select border-start-0"
                                required
                              >
                                <option value="">Sélectionner une catégorie</option>
                                {categories.map((cat) => (
                                  <option key={cat._id || cat.name} value={cat.name}>
                                    {cat.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <small className="text-muted">
                              {categories.length} catégorie(s) disponible(s)
                            </small>
                          </div>
                        )}

                        {/* No categories message */}
                        {formData.compagne && categories.length === 0 && (
                          <div className="col-12">
                            <div className="alert alert-warning">
                              <small>Aucune catégorie disponible pour cette compagne</small>
                            </div>
                          </div>
                        )}

                        {/* Client (auto-filled when category selected) */}
                        <div className="col-md-6">
                          <label className="form-label fw-semibold text-dark">Client</label>
                          <div className="input-group">
                            <span className="input-group-text bg-light border-end-0">
                              <FaUser className="text-primary" />
                            </span>
                            <select
                              name="client"
                              value={formData.client}
                              onChange={handleChange}
                              className="form-select border-start-0"
                              required
                            >
                              <option value="">Sélectionner un client</option>
                              {allClients.map((client) => (
                                <option key={client._id} value={client.nom + ' ' + client.prenom}>
                                  {client.nom} {client.prenom}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Police Number (auto-filled with indec when category selected) */}
                        <div className="col-md-6">
                          <label className="form-label fw-semibold text-dark">Numéro Police</label>
                          <div className="input-group">
                            <span className="input-group-text bg-light border-end-0">
                              <FaHashtag className="text-primary" />
                            </span>
                            <input
                              type="text"
                              name="numpolice"
                              value={formData.numpolice}
                              onChange={handleChange}
                              className="form-control border-start-0"
                              placeholder="Numéro de police"
                              required
                            />
                          </div>
                          {formData.category && (
                            <small className="text-success">
                              Préfixe auto-généré depuis l'indec de la catégorie
                            </small>
                          )}
                        </div>

                        {/* Continue Button */}
                        <div className="col-12 mt-4">
                          <div className="d-flex justify-content-end">
                            <button 
                              type="button" 
                              className="btn btn-primary px-4 py-2 d-flex align-items-center gap-2"
                              onClick={() => setStep(2)}
                              disabled={!formData.category}
                            >
                              Continuer <FaArrowRight />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* --- STEP 2 --- */}
                    {step === 2 && (
                      <div className="row g-4">
                        <div className="col-12">
                          <h5 className="text-secondary mb-3 border-bottom pb-2">
                            <FaCalculator className="me-2" />Paramètres et Calculs
                          </h5>
                        </div>

                        <div className="col-12">
                          {compagneParams.length > 0 ? (
                            <div className="row g-3">
                              {compagneParams.map((p, index) => {
                                const checked = formData.parameters.some((x) => x.name === p.name);
                                const current = formData.parameters.find((x) => x.name === p.name) || {};
                                const total = computeParamTotal(current);
                                
                                return (
                                  <div key={index} className="col-12">
                                    <div className="card border-0 shadow-sm">
                                      <div className="card-body">
                                        <div className="form-check form-switch mb-3">
                                          <input
                                            type="checkbox"
                                            className="form-check-input"
                                            role="switch"
                                            checked={checked}
                                            onChange={(e) =>
                                              e.target.checked
                                                ? setFormData((prev) => ({
                                                    ...prev,
                                                    parameters: [
                                                      ...prev.parameters,
                                                      { name: p.name, primes: 0, taxe: 0, taxepara: 0, accessoire: 0, cnpc: 0 },
                                                    ],
                                                  }))
                                                : setFormData((prev) => ({
                                                    ...prev,
                                                    parameters: prev.parameters.filter((x) => x.name !== p.name),
                                                  }))
                                            }
                                          />
                                          <label className="form-check-label fw-semibold fs-6 text-dark">
                                            {p.name} <span className="text-primary">({p.percent}%)</span>
                                          </label>
                                        </div>

                                        {checked && (
                                          <>
                                            <div className="row g-3 mb-3">
                                              {[
                                                { key: "primes", label: "Primes", color: "primary" },
                                                { key: "taxe", label: "Taxe", color: "success" },
                                                { key: "taxepara", label: "Taxe Para", color: "warning" },
                                                { key: "accessoire", label: "Accessoire", color: "info" },
                                                { key: "cnpc", label: "CNPC", color: "danger" },
                                              ].map((f) => (
                                                <div key={f.key} className="col-md-2 col-6">
                                                  <label className="form-label small fw-semibold text-muted mb-1">
                                                    {f.label}
                                                  </label>
                                                  <div className="input-group input-group-sm">
                                                    <input
                                                      type="number"
                                                      className="form-control"
                                                      value={current[f.key] || ""}
                                                      onChange={(e) => handleValueChange(p.name, f.key, e.target.value)}
                                                      placeholder="0"
                                                      step="0.01"
                                                    />
                                                    <span className="input-group-text">DH</span>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center border-top pt-3">
                                              <span className="text-muted small">Total du paramètre</span>
                                              <span className="badge bg-dark fs-6 px-3 py-2">
                                                {total.toFixed(2)} DH
                                              </span>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-5">
                              <div className="text-muted">
                                <FaCalculator className="display-4 mb-3 opacity-50" />
                                <p className="fs-5">Aucun paramètre disponible pour cette catégorie</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* General Total */}
                        {formData.parameters.length > 0 && (
                          <div className="col-12">
                            <div className="card bg-gradient-primary text-black">
                              <div className="card-body text-center py-4">
                                <h5 className="card-title mb-2">Total Général</h5>
                                <h2 className="display-4 fw-bold mb-0">{totalGeneral.toFixed(2)} DH</h2>
                                <p className="mb-0 opacity-75">Somme totale de tous les paramètres</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="col-12 mt-4">
                          <div className="d-flex justify-content-between">
                            <button 
                              type="button" 
                              className="btn btn-outline-secondary px-4 py-2 d-flex align-items-center gap-2"
                              onClick={() => setStep(1)}
                            >
                              <FaArrowLeft /> Retour
                            </button>

                            <div className="d-flex gap-2">
                              {editId ? (
                                <>
                                  <button type="button" className="btn btn-outline-danger px-4" onClick={resetForm}>
                                    Annuler
                                  </button>
                                  <button type="submit" className="btn btn-success px-4 d-flex align-items-center gap-2">
                                    <FaSave /> Mettre à jour
                                  </button>
                                </>
                              ) : (
                                <button type="submit" className="btn btn-success px-4 d-flex align-items-center gap-2">
                                  <FaSave /> Enregistrer
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Operations Table */}
        <div className="row">
          <div className="col">
            <OperationTable onEdit={handleEdit} reload={reload} func={showForm} />
          </div>
        </div>
      </div>
    </>
  );
}