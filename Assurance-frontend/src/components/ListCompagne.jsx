import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./context/AuthContext";
import { API_BASE } from "../config";
import { Navbar } from "./NavBar";
import CompagneTable from "./CompagneTable";
import {
  FaPlus,
  FaEyeSlash,
  FaTag,
  FaList,
  FaSave,
  FaTimes,
  FaEdit,
} from "react-icons/fa";

export default function ListCompagne() {
  const { user, logout } = useAuth();
  const [editId, setEditId] = useState(null);
  const [add, setAdd] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [allParams, setAllParams] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);

  const [formData, setFormData] = useState({
    compagneName: "",
    categories: [
      { name: "", indec: "", parameters: [{ name: "", percent: 0 }] },
    ],
  });

  // Load data
  useEffect(() => {
    const headers = { Authorization: `Bearer ${user?.token}` };

    axios
      .get(`${API_BASE}/parametres`, { headers })
      .then((res) => setAllParams(res.data || []))
      .catch(console.error);

    axios
      .get(`${API_BASE}/categories`, { headers })
      .then((res) => setAvailableCategories(res.data || []))
      .catch(console.error);
  }, [user]);

  // Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (categoryIndex, field, value) => {
    const updated = [...formData.categories];
    updated[categoryIndex][field] = value;
    setFormData((prev) => ({ ...prev, categories: updated }));
  };

  const handleParameterChange = (categoryIndex, paramIndex, field, value) => {
    const updated = [...formData.categories];
    updated[categoryIndex].parameters[paramIndex][field] =
      field === "percent" ? Number(value) : value;
    setFormData((prev) => ({ ...prev, categories: updated }));
  };

  const addCategory = () => {
    setFormData((prev) => ({
      ...prev,
      categories: [
        ...prev.categories,
        { name: "", indec: "", parameters: [{ name: "", percent: 0 }] },
      ],
    }));
  };

  const removeCategory = (index) => {
    const updated = [...formData.categories];
    updated.splice(index, 1);
    setFormData((prev) => ({ ...prev, categories: updated }));
  };

  const addParameter = (catIndex) => {
    const updated = [...formData.categories];
    updated[catIndex].parameters.push({ name: "", percent: 0 });
    setFormData((prev) => ({ ...prev, categories: updated }));
  };

  const removeParameter = (catIndex, paramIndex) => {
    const updated = [...formData.categories];
    updated[catIndex].parameters.splice(paramIndex, 1);
    setFormData((prev) => ({ ...prev, categories: updated }));
  };

  // Edit compagne
  const handleEdit = (compagne) => {
    setEditId(compagne._id);
    setAdd(true);
    setFormData({
      compagneName: compagne.compagneName || "",
      categories:
        compagne.categories && compagne.categories.length > 0
          ? compagne.categories.map((cat) => ({
              ...cat,
              parameters:
                cat.parameters && cat.parameters.length > 0
                  ? cat.parameters
                  : [{ name: "", percent: 0 }],
            }))
          : [{ name: "", indec: "", parameters: [{ name: "", percent: 0 }] }],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${user?.token}`,
    };

    const validCategories = formData.categories
      .filter((c) => c.name && c.indec)
      .map((c) => ({
        ...c,
        parameters: c.parameters.filter(
          (p) => p.name && Number(p.percent) > 0
        ),
      }))
      .filter((c) => c.parameters.length > 0);

    if (validCategories.length === 0)
      return alert("❌ Veuillez ajouter des catégories valides");

    const data = {
      compagneName: formData.compagneName,
      categories: validCategories,
    };

    try {
      if (editId) {
        await axios.put(
          `${API_BASE}/compagnes/${editId}`,
          data,
          { headers }
        );
        alert("✅ Compagne modifiée");
      } else {
        await axios.post(`${API_BASE}/compagnes`, data, {
          headers,
        });
        alert("✅ Compagne ajoutée");
      }
      resetForm();
      setReloadKey((k) => k + 1);
    } catch (err) {
      console.error(err);
      alert("❌ Erreur serveur");
    }
  };

  const resetForm = () => {
    setEditId(null);
    setFormData({
      compagneName: "",
      categories: [{ name: "", indec: "", parameters: [{ name: "", percent: 0 }] }],
    });
    setAdd(false);
  };

  return (
    <>
      <Navbar lg={logout} />
      <div className="container-fluid py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h3 fw-bold text-primary mb-1">Gestion des Compagnes</h1>
            <p className="text-muted mb-0">
              Créez, modifiez et gérez vos campagnes marketing
            </p>
          </div>
          <button
            className={`btn ${
              add ? "btn-outline-danger" : "btn-primary"
            } d-flex align-items-center gap-2`}
            onClick={() => setAdd(!add)}
          >
            {add ? (
              <>
                <FaEyeSlash /> Cacher le formulaire
              </>
            ) : (
              <>
                <FaPlus /> Nouvelle Compagne
              </>
            )}
          </button>
        </div>

        {/* FORM */}
        {add && (
          <div className="card border-0 shadow-lg mb-4">
            <div className="card-header bg-primary text-white py-3">
              <h4 className="mb-0 fw-semibold d-flex align-items-center gap-2">
                {editId ? (
                  <>
                    <FaEdit /> Modifier la Compagne
                  </>
                ) : (
                  <>
                    <FaPlus /> Nouvelle Compagne
                  </>
                )}
              </h4>
            </div>

            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                {/* Nom */}
                <div className="mb-3">
                  <label className="form-label fw-semibold text-dark">
                    Nom de la Compagne
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-primary">
                      <FaTag />
                    </span>
                    <input
                      type="text"
                      name="compagneName"
                      value={formData.compagneName}
                      onChange={handleChange}
                      className="form-control border-start-0"
                      placeholder="Entrez le nom de la compagne"
                      required
                    />
                  </div>
                </div>

                {/* Catégories */}
                {formData.categories.map((cat, ci) => {
                  const availableCats = availableCategories.filter(
                    (c) =>
                      !formData.categories
                        .filter((_, i) => i !== ci)
                        .map((x) => x.name)
                        .includes(c.name)
                  );

                  return (
                    <div key={ci} className="card border-0 shadow-sm mb-3">
                      <div className="card-body bg-light rounded-3">
                        <div className="row g-3 align-items-center mb-3">
                          <div className="col-md-5">
                            <select
                              className="form-select"
                              value={cat.name}
                              onChange={(e) =>
                                handleCategoryChange(ci, "name", e.target.value)
                              }
                              required
                            >
                              <option value="">-- Catégorie --</option>
                              {availableCats.map((c) => (
                                <option key={c._id} value={c.name}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-md-5">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Indice"
                              value={cat.indec}
                              onChange={(e) =>
                                handleCategoryChange(ci, "indec", e.target.value)
                              }
                              required
                            />
                          </div>
                          <div className="col-md-2 text-end">
                            {formData.categories.length > 1 && (
                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => removeCategory(ci)}
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Paramètres */}
                        {cat.parameters.map((param, pi) => {
                          const availableParams = allParams.filter(
                            (p) =>
                              !cat.parameters
                                .filter((_, i) => i !== pi)
                                .map((x) => x.name)
                                .includes(p.name)
                          );
                          return (
                            <div
                              key={pi}
                              className="row g-2 align-items-center mb-2"
                            >
                              <div className="col-md-7">
                                <select
                                  className="form-select"
                                  value={param.name}
                                  onChange={(e) =>
                                    handleParameterChange(
                                      ci,
                                      pi,
                                      "name",
                                      e.target.value
                                    )
                                  }
                                  required
                                >
                                  <option value="">-- Paramètre --</option>
                                  {availableParams.map((p) => (
                                    <option key={p._id} value={p.name}>
                                      {p.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-md-4">
                                <input
                                  type="number"
                                  className="form-control"
                                  placeholder="%"
                                  value={param.percent}
                                  onChange={(e) =>
                                    handleParameterChange(
                                      ci,
                                      pi,
                                      "percent",
                                      e.target.value
                                    )
                                  }
                                  required
                                />
                              </div>
                              <div className="col-md-1 text-end">
                                {cat.parameters.length > 1 && (
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => removeParameter(ci, pi)}
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        <div className="text-end mt-2">
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => addParameter(ci)}
                          >
                            + Ajouter un paramètre
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="text-end mb-3">
                  <button
                    type="button"
                    className="btn btn-outline-dark btn-sm"
                    onClick={addCategory}
                  >
                    + Ajouter une catégorie
                  </button>
                </div>

                {/* Buttons */}
                <div className="d-flex gap-2">
                  {editId ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-outline-secondary d-flex align-items-center gap-2"
                        onClick={resetForm}
                      >
                        <FaTimes /> Annuler
                      </button>
                      <button
                        type="submit"
                        className="btn btn-success d-flex align-items-center gap-2"
                      >
                        <FaSave /> Mettre à jour
                      </button>
                    </>
                  ) : (
                    <button
                      type="submit"
                      className="btn btn-primary d-flex align-items-center gap-2 mx-auto"
                    >
                      <FaSave /> Enregistrer la Compagne
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Table */}
        <CompagneTable onEdit={handleEdit} reloadTrigger={reloadKey} />
      </div>
    </>
  );
}
