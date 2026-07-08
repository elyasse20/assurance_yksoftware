import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "./context/AuthContext";
import { API_BASE } from "../config";
import ParamsTable from "./ParamsTable";
import EditSimpleItem from "./EditSimpleItem";
import { Navbar } from "./NavBar";
import { FaPlus, FaCog, FaEdit } from "react-icons/fa";

export default function AddSimpleItem({ title, endpoint }) {
  const { user, logout } = useAuth();
  const [name, setName] = useState("");
  const [rate, setRate] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAdd, setIsAdd] = useState(true);
  const [ele, setEle] = useState(null);

  function handleEdit(element) {
    setIsAdd(false);
    setEle(element);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate depending on endpoint
    if (endpoint && endpoint.toLowerCase() === "tva") {
      if (rate === "" || isNaN(Number(rate))) return alert("Le taux est requis et doit être un nombre");
    } else {
      if (!name.trim()) return alert("Le nom est requis");
    }

    try {
      // Build payload according to endpoint
      const payload = endpoint && endpoint.toLowerCase() === "tva"
        ? { rate: Number(rate), isActive }
        : { name };

      await axios.post(
        `${API_BASE}/${endpoint}`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      alert(`✅ ${title} ajouté(e) avec succès`);
      // reset fields
      setName("");
      setRate("");
      setIsActive(false);
      // trigger table refresh
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error(err);
      alert(`❌ Erreur lors de l'ajout de ${title.toLowerCase()}`);
    }
  };

  const getArticle = (title) => {
    if (title === "Parametre") return "un";
    if (title === "TVA") return "la";
    return "une";
  };

  return (
    <>
      <Navbar />
      <div className="container-fluid py-4">
        {/* Page Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h3 fw-bold text-primary mb-1">
              Gestion des {title === "Parametre" ? "Paramètres" : title + "s"}
            </h1>
            <p className="text-muted mb-0">
              {isAdd 
                ? `Ajouter ${getArticle(title)} ${title.toLowerCase()}`
                : `Modification de ${title.toLowerCase()}`
              }
            </p>
          </div>
          {!isAdd && (
            <button 
              className="btn btn-outline-secondary d-flex align-items-center gap-2"
              onClick={() => setIsAdd(true)}
            >
              <FaPlus />
              Nouveau
            </button>
          )}
        </div>

        <div className="row g-4" >
          {/* Form Section */}
          <div className="col-lg-5" >
            {isAdd ? (
              <div className="card border-0 shadow-lg" style={{minHeight:"425px"}}>
                <div className="card-header bg-primary text-white py-3">
                  <h4 className="mb-0 fw-semibold d-flex align-items-center gap-2">
                    <FaPlus />
                    Ajouter {getArticle(title)} {title}
                  </h4>
                </div>
                <div className="card-body" >
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label className="form-label fw-semibold">
                        {endpoint && endpoint.toLowerCase() === "tva" ? "Taux (%)" : `Nom ${title === "Parametre" ? "du paramètre" : `de la ${title.toLowerCase()}`}`}
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light">
                          <FaCog className="text-primary" />
                        </span>
                        {endpoint && endpoint.toLowerCase() === "tva" ? (
                          <input
                            type="number"
                            step="0.01"
                            className="form-control border-start-0"
                            placeholder="Entrez le taux (ex: 18)"
                            value={rate}
                            onChange={(e) => setRate(e.target.value)}
                            required
                          />
                        ) : (
                          <input
                            type="text"
                            className="form-control border-start-0"
                            placeholder={`Entrez le nom ${title === "Parametre" ? "du paramètre" : `de la ${title.toLowerCase()}`}`}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                          />
                        )}
                      </div>
                    </div>
                    {endpoint && endpoint.toLowerCase() === "tva" && (
                      <div className="mb-4 form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="tvaActive"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="tvaActive">
                          Activer ce taux
                        </label>
                      </div>
                    )}
                    <div className="d-grid">
                      <button 
                        type="submit" 
                        className="btn btn-primary d-flex align-items-center justify-content-center gap-2 fw-semibold"
                      >
                        <FaPlus />
                        Ajouter {title}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <EditSimpleItem
                el={ele}
                endpoint={endpoint}
                title={title}
                onCancel={() => setIsAdd(true)}
                onSaved={() => {
                  setIsAdd(true);
                  setRefreshKey((k) => k + 1);
                }}
              />
            )}
          </div>

          {/* Table Section */}
          <div className="col-lg-7">
            <ParamsTable 
              endpoint={endpoint} 
              handleEdit={handleEdit} 
              title={title} 
              refreshKey={refreshKey}
            />
          </div>
        </div>
      </div>
    </>
  );
}