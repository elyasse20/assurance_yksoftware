import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./context/AuthContext";
import { API_BASE } from "../config";
import { Navbar } from "./NavBar";
import ClientTable from "./Table";
import { 
  FaUserPlus, 
  FaUserEdit, 
  FaSave, 
  FaTimes,
  FaBuilding,
  FaIdCard,
  FaPhone,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaFileUpload,
  FaEyeSlash,
  FaPlus,
  FaCreditCard
} from "react-icons/fa";

export default function ListClient() {
  const { user, logout } = useAuth();
  const fileInputRef = useRef(null);
  const [editId, setEditId] = useState(null);
    const [add, setadd] = useState(false);
  const [formData, setFormData] = useState({
    type: "particulier",
    cin: "",
    nom: "",
    prenom: "",
    tel: "",
    adresse: "",
    doc: null,
    ice: "",
    if: "",
    rc: "",
    budget: 0,
    credit: 0,
  });

  useEffect(() => {
    console.log(user);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFile = (e) => {
    setFormData((prev) => ({ ...prev, doc: e.target.files[0] }));
  };
  
  // receive data from ClientTable edit
  const handleEdit = (client) => {
    setEditId(client._id);
    setFormData({
      type: client.type || "particulier",
      cin: client.cin || "",
      nom: client.nom || "",
      prenom: client.prenom || "",
      tel: client.tel || "",
      adresse: client.adresse || "",
      doc: null,
      ice: client.ice || "",
      if: client.if || "",
      rc: client.rc || "",
      budget: client.budget || 0,
      credit: client.credit || 0,
    });
    setadd(true)
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) =>
      data.append(key, value instanceof Date ? value.toISOString() : value)
    );

    try {
      if (editId) {
        await axios.put(`${API_BASE}/clients/${editId}`, data, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${user?.token}`,
          },
        });
        alert("✅ Client modifié avec succès");
        setEditId(null);
      } else {
        await axios.post(`${API_BASE}/clients`, data, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${user?.token}`,
          },
        });
        alert("✅ Client ajouté avec succès");
      }

      setFormData({
        type: "particulier",
        cin: "",
        nom: "",
        prenom: "",
        tel: "",
        adresse: "",
        doc: null,
        ice: "",
        if: "",
        rc: "",
        budget: 0,
        credit: 0,
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error(err);
      alert("❌ Erreur lors de l'envoi du client");
    }
  };

  const resetForm = () => {
    setEditId(null);
    setFormData({
      type: "particulier",
      cin: "",
      nom: "",
      prenom: "",
      tel: "",
      adresse: "",
      doc: null,
      ice: "",
      if: "",
      rc: "",
      budget: 0,
      credit: 0,
    });
    setadd(false)
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <Navbar />
      <div className="container-fluid py-4">
         <div className="row mb-4">
                  <div className="col">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
  <h1 className="h3 fw-bold text-primary mb-1">Gestion des Clients</h1>
            <p className="text-muted mb-0">
              {editId ? "Modification du client" : "Ajout et consultation des clients"}
            </p>
                      </div>
                      <button 
                        className={`btn ${add ? 'btn-outline-danger' : 'btn-primary'} d-flex align-items-center gap-2`}
                        onClick={() => setadd(!add)}
                      >
                        {add ? <><FaEyeSlash /> Cacher le formulaire</> : <><FaPlus /> Nouveau Client</>}
                      </button>
                    </div>
                  </div>
                </div>
        {/* Page Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          {/* <div>
            <h1 className="h3 fw-bold text-primary mb-1">Gestion des Clients</h1>
            <p className="text-muted mb-0">
              {editId ? "Modification du client" : "Ajout et consultation des clients"}
            </p>
          </div> */}
          {/* {!editId && (
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-primary fs-6">
                {formData.type === "particulier" ? "Particulier" : "Société"}
              </span>
            </div>
          )} */}
        </div>

        <div className="row g-4">
          {/* Form Section */}
          {add && <div className="">
            <div className="card border-0 shadow-lg h-100">
              <div className="card-header bg-primary text-white py-3">
                <h4 className="mb-0 fw-semibold d-flex align-items-center gap-2">
                  {editId ? <FaUserEdit /> : <FaUserPlus />}
                  {editId ? "Modifier le Client" : "Nouveau Client"}
                </h4>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  {/* Type Selection */}
                  <div className="mb-3 row g-2">
                    <div className="col-md-4">
                    <label className="form-label fw-semibold">Type de Client</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <FaBuilding className="text-primary" />
                      </span>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="form-select border-start-0"
                      >
                        <option value="particulier">Particulier</option>
                        <option value="societe">Société</option>
                      </select>
                    </div>
                  
</div>
                  {/* Nom / Prénom */}
                  {/* <div className="row g-2 mb-3"> */}
                  
                    <div className={ "col-md-4" }>
                      <label className="form-label fw-semibold">Nom</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light">
                          <FaIdCard className="text-primary" />
                        </span>
                        <input
                          type="text"
                          name="nom"
                          value={formData.nom}
                          onChange={handleChange}
                          className="form-control border-start-0"
                          placeholder="Nom du client"
                          required
                        />
                      </div>
                    </div>
                  
                    {formData.type === "particulier" ? (
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">Prénom</label>
                        <input
                          type="text"
                          name="prenom"
                          value={formData.prenom}
                          onChange={handleChange}
                          className="form-control"
                          placeholder="Prénom du client"
                          required
                        />
                      </div>
                    ):(<div className="col-md-4">
                    <label className="form-label fw-semibold">Téléphone</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <FaPhone className="text-primary" />
                      </span>
                      <input
                        type="text"
                        name="tel"
                        value={formData.tel}
                        onChange={handleChange}
                        className="form-control border-start-0"
                        placeholder="Numéro de téléphone"
                        required
                      />
                    </div>
                  </div>)}</div>
                  {/* </div> */}

                  {/* CIN for Particulier */}
                  {formData.type === "particulier" && (
                    <div className="mb-3">
                      <label className="form-label fw-semibold">CIN</label>
                      <input
                        type="text"
                        name="cin"
                        value={formData.cin}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="Numéro CIN"
                        required
                      />
                    </div>
                  )}

                  {/* Téléphone */}
                  {formData.type === "particulier" &&(<div className="mb-3">
                    <label className="form-label fw-semibold">Téléphone</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <FaPhone className="text-primary" />
                      </span>
                      <input
                        type="text"
                        name="tel"
                        value={formData.tel}
                        onChange={handleChange}
                        className="form-control border-start-0"
                        placeholder="Numéro de téléphone"
                        required
                      />
                    </div>
                  </div>)}

 

                  {/* Société Fields */}
                  {formData.type === "societe" && (
                    <div className="row g-2 mb-3">
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">ICE</label>
                        <input
                          type="text"
                          name="ice"
                          value={formData.ice}
                          onChange={handleChange}
                          className="form-control"
                          placeholder="ICE"
                          required
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">IF</label>
                        <input
                          type="text"
                          name="if"
                          value={formData.if}
                          onChange={handleChange}
                          className="form-control"
                          placeholder="Identifiant Fiscal"
                          required
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">RC</label>
                        <input
                          type="text"
                          name="rc"
                          value={formData.rc}
                          onChange={handleChange}
                          className="form-control"
                          placeholder="Registre Commerce"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Budget & Credit */}
                  <div className="mb-4 g-2 row">
                    <div className="col">
                    <label className="form-label fw-semibold">Budget</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <FaMoneyBillWave className="text-primary" />
                      </span>
                      <input
                        type="number"
                        name="budget"
                        value={formData.budget}
                        onChange={handleChange}
                        className="form-control border-start-0"
                        placeholder="Budget alloué"
                        required
                      />
                      <span className="input-group-text">DH</span>
                    </div>
                    </div>
{/* 
                    <div className="col-md-3">
                    <label className="form-label fw-semibold">Crédit</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <FaCreditCard className="text-primary" />
                      </span>
                      <input
                        type="number"
                        name="credit"
                        value={formData.credit}
                        onChange={handleChange}
                        className="form-control border-start-0"
                        placeholder="Crédit du client"
                        required
                      />
                      <span className="input-group-text">DH</span>
                    </div>
                    </div> */}
                  {/* </div> */}
                  {/* Document Upload */}
                  {/* <div className="mb-4"> */}
                  <div className="col">
                    <label className="form-label fw-semibold">Document</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <FaFileUpload className="text-primary" />
                      </span>
                      <input
                        type="file"
                        name="doc"
                        ref={fileInputRef}
                        onChange={handleFile}
                        className="form-control border-start-0"
                        accept="image/*,application/pdf"
                      />
                    </div>
                    <div className="form-text">Formats acceptés: images, PDF</div>
                    </div>
                                     {/* Adresse */}
                  <div className="col">
                    <label className="form-label fw-semibold">Adresse</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <FaMapMarkerAlt className="text-primary" />
                      </span>
                      <input
                        type="text"
                        name="adresse"
                        value={formData.adresse}
                        onChange={handleChange}
                        className="form-control border-start-0"
                        placeholder="Adresse complète"
                        required
                      />
                    </div>
                  </div>
                  </div>

                  {/* Submit Buttons */}
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
                          className="btn btn-primary d-flex align-items-center gap-2 "
                        >
                          <FaSave /> Mettre à jour
                        </button>
                      </>
                    ) : (
                      <div className="d-flex w-100">
                      <button
                        type="submit"
                        className="btn btn-primary m-auto  gap-2"
                      >
                        <FaUserPlus /> Ajouter le Client
                      </button></div>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
          }

          {/* Table Section */}
          <div className="">
             
            <ClientTable onEdit={handleEdit} />
          </div>
        </div>
      </div>
    </>
  );
}