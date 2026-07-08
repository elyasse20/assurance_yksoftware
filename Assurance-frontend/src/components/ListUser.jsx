import { useState } from "react";
import axios from "axios";
import { useAuth } from "./context/AuthContext";
import { API_BASE } from "../config";
import { Navbar } from "./NavBar";
import UserTable from "./UserTable";
import {
  FaPlus,
  FaEyeSlash,
  FaUser,
  FaEnvelope,
  FaLock,
  FaUserShield,
  FaSave,
  FaTimes,
  FaEdit,
} from "react-icons/fa";

export default function ListUser() {
  const { user, logout } = useAuth();
  const [editId, setEditId] = useState(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [add, setAdd] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
  });

  const handleEdit = (u) => {
    setEditId(u._id);
    setFormData({
      username: u.username || "",
      email: u.email || "",
      password: "",
      role: u.role || "user",
    });
    setAdd(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await axios.put(
          `${API_BASE}/users/${editId}`,
          formData,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${user?.token}`,
            },
          }
        );
        alert("✅ Utilisateur modifié avec succès");
      } else {
        await axios.post(`${API_BASE}/users/register`, formData, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}`,
          },
        });
        alert("✅ Utilisateur ajouté avec succès");
      }

      setFormData({
        username: "",
        email: "",
        password: "",
        role: "user",
      });
      setEditId(null);
      setAdd(false);
      setReloadTrigger((x) => x + 1);
    } catch (err) {
      console.error(err);
      alert("❌ Erreur lors de l’envoi de l’utilisateur");
    }
  };

  const cancelEdit = () => {
    setEditId(null);
    setAdd(false);
    setFormData({
      username: "",
      email: "",
      password: "",
      role: "user",
    });
  };

  return (
    <>
      <Navbar lg={logout} />
      <div className="container-fluid py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h3 fw-bold text-primary mb-1">Gestion des Utilisateurs</h1>
            <p className="text-muted mb-0">
              Créez, modifiez et gérez les comptes utilisateurs
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
                <FaPlus /> Nouvel Utilisateur
              </>
            )}
          </button>
        </div>

        {/* Form */}
        {add && (
          <div className="card border-0 shadow-lg mb-4">
            <div className="card-header bg-primary text-white py-3">
              <h4 className="mb-0 fw-semibold d-flex align-items-center gap-2">
                {editId ? (
                  <>
                    <FaEdit /> Modifier l’utilisateur
                  </>
                ) : (
                  <>
                    <FaPlus /> Nouvel Utilisateur
                  </>
                )}
              </h4>
            </div>

            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  {/* Username */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-dark">
                      Nom d’utilisateur
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <FaUser className="text-primary" />
                      </span>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className="form-control border-start-0"
                        placeholder="Nom d’utilisateur"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-dark">Email</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <FaEnvelope className="text-primary" />
                      </span>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="form-control border-start-0"
                        placeholder="Adresse email"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-dark">
                      {editId
                        ? "Nouveau mot de passe (optionnel)"
                        : "Mot de passe"}
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <FaLock className="text-primary" />
                      </span>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="form-control border-start-0"
                        placeholder="Mot de passe"
                        required={!editId}
                      />
                    </div>
                  </div>

                  {/* Role */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-dark">Rôle</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <FaUserShield className="text-primary" />
                      </span>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="form-select border-start-0"
                      >
                        <option value="user">Utilisateur</option>
                        <option value="admin">Administrateur</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="d-flex justify-content-between align-items-center mt-4">
                  {editId ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-outline-secondary d-flex align-items-center gap-2"
                        onClick={cancelEdit}
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
                      <FaSave /> Enregistrer l’utilisateur
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Table */}
        <UserTable onEdit={handleEdit} reloadTrigger={reloadTrigger} />
      </div>
    </>
  );
}
