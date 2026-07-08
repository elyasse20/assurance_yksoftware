import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./context/AuthContext";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config";
import { FaSave, FaTimes, FaEdit, FaCheckCircle } from "react-icons/fa";

export default function EditSimpleItem({ title, endpoint, el, onCancel, onSaved }) {
  const { user } = useAuth();
  const [item, setItem] = useState(() => {
    if (el) return el;
    if (endpoint && endpoint.toLowerCase() === "tva") return { rate: "", isActive: false, _id: "" };
    return { name: "", _id: "" };
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (el) {
      setItem(el);
    } else {
      if (endpoint && endpoint.toLowerCase() === "tva") setItem({ rate: "", isActive: false, _id: "" });
      else setItem({ name: "", _id: "" });
    }
  }, [el, endpoint]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (endpoint && endpoint.toLowerCase() === "tva") {
      if (item.rate === "" || isNaN(Number(item.rate))) return alert("Le taux est requis et doit être un nombre");
    } else {
      if (!item.name.trim()) return alert("Le nom est requis");
    }

    setIsLoading(true);
    try {
      const payload = endpoint && endpoint.toLowerCase() === "tva"
        ? { rate: Number(item.rate), isActive: Boolean(item.isActive) }
        : { name: item.name };

      await axios.put(
        `${API_BASE}/${endpoint}/${item._id}`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );
      alert(`✅ ${title} modifié(e) avec succès`);
      // notify parent to refresh list
      if (typeof onSaved === "function") onSaved();
      setTimeout(() => {
        onCancel();
        navigate(`/${endpoint}`);
      }, 500);
    } catch (err) {
      console.error(err);
      alert(`❌ Erreur lors de la modification de ${title.toLowerCase()}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getArticle = (title) => {
    if (title === "Parametre") return "un";
    if (title === "TVA") return "la";
    return "une";
  };

  const getDisplayTitle = (title) => {
    return title === "Parametre" ? "Paramètre" : title;
  };

  return (
    <div className="">
      <div className="card border-0 shadow-lg h-100">
        <div className="card-header bg-primary text-white py-3">
          <h4 className="mb-0 fw-semibold d-flex align-items-center gap-2">
            <FaEdit />
            Modifier {getArticle(title)} {getDisplayTitle(title)}
          </h4>
        </div>
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              {endpoint && endpoint.toLowerCase() === "tva" ? (
                <>
                  <label className="form-label fw-semibold mb-3">Taux (%)</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <FaEdit className="text-primary" />
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control border-start-0 fw-medium"
                      value={item.rate}
                      onChange={(e) => setItem({ ...item, rate: e.target.value })}
                      placeholder="Entrez le nouveau taux (ex: 18)"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="form-check mt-3 mb-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="editTvaActive"
                      checked={Boolean(item.isActive)}
                      onChange={(e) => setItem({ ...item, isActive: e.target.checked })}
                      disabled={isLoading}
                    />
                    <label className="form-check-label" htmlFor="editTvaActive">
                      Activer ce taux
                    </label>
                  </div>
                  <div className="form-text text-muted mt-2">Modifiez le taux de {getArticle(title)} {title.toLowerCase()} existant</div>
                </>
              ) : (
                <>
                  <label className="form-label fw-semibold mb-3">
                    Nom {title === "Parametre" ? "du paramètre" : `de la ${title.toLowerCase()}`}
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <FaEdit className="text-primary" />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 fw-medium"
                      value={item.name}
                      onChange={(e) => setItem({ ...item, name: e.target.value })}
                      placeholder={`Entrez le nouveau nom ${title === "Parametre" ? "du paramètre" : `de la ${title.toLowerCase()}`}`}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="form-text text-muted mt-2">
                    Modifiez le nom de {getArticle(title)} {title.toLowerCase()} existant
                  </div>
                </>
              )}
            </div>

            {/* Current Value Display */}
            {(endpoint && endpoint.toLowerCase() === "tva") ? (
              el?.rate !== undefined && (
                <div className="alert alert-light border mb-4">
                  <div className="d-flex align-items-center gap-2">
                    <FaCheckCircle className="text-primary" />
                    <div>
                      <strong className="text-dark">Valeur actuelle:</strong>
                      <div className="fw-semibold text-dark mt-1">{el.rate}% {el.isActive ? "(Actif)" : "(Inactif)"}</div>
                    </div>
                  </div>
                </div>
              )
            ) : (
              el?.name && (
                <div className="alert alert-light border mb-4">
                  <div className="d-flex align-items-center gap-2">
                    <FaCheckCircle className="text-primary" />
                    <div>
                      <strong className="text-dark">Valeur actuelle:</strong>
                      <div className="fw-semibold text-dark mt-1">{el.name}</div>
                    </div>
                  </div>
                </div>
              )
            )}

            <div className="d-flex gap-2 pt-2">
              <button 
                type="button" 
                className="btn btn-outline-secondary d-flex align-items-center gap-2 flex-grow-1"
                onClick={onCancel}
                disabled={isLoading}
              >
                <FaTimes />
                Annuler
              </button>
              <button 
                type="submit" 
                className="btn btn-primary d-flex align-items-center gap-2 flex-grow-1 fw-semibold"
                disabled={isLoading || (endpoint && endpoint.toLowerCase() === "tva" ? (item.rate === "" || isNaN(Number(item.rate))) : !item.name.trim())}
              >
                {isLoading ? (
                  <>
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">Chargement...</span>
                    </div>
                    Modification...
                  </>
                ) : (
                  <>
                    <FaSave />
                    Enregistrer
                  </>
                )}
              </button>
            </div>

            {/* Validation States */}
            {(endpoint && endpoint.toLowerCase() === "tva") ? (
              (item.rate === "" || isNaN(Number(item.rate))) && (
                <div className="alert alert-warning border-0 mt-3 mb-0">
                  <small>Veuillez saisir un taux valide pour {title.toLowerCase()}</small>
                </div>
              )
            ) : (
              !item.name.trim() && (
                <div className="alert alert-warning border-0 mt-3 mb-0">
                  <small>Veuillez saisir un nom valide pour {title.toLowerCase()}</small>
                </div>
              )
            )}
          </form>
        </div>
      </div>
    </div>
  );
}