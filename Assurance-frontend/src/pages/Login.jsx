import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/context/AuthContext";
import { API_BASE } from "../config";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/clients", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/users/login`, {
        email,
        password,
      });
      login(res.data.token);
      navigate("/clients", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
      setPassword("")
    }
  };

  return (
<div className="d-flex justify-content-center align-items-center vh-100 bg-light">
  <form
    onSubmit={handleSubmit}
    className="border rounded p-4 bg-white shadow-sm"
    style={{ width: "320px" }}
  >
    <h3 className="text-center mb-4">Login</h3>

    {error && <p className="text-danger text-center">{error}</p>}

    <div className="mb-3">
      <input
        type="text"
        className="form-control"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
    </div>

    <div className="mb-3">
      <input
        type="password"
        className="form-control"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
    </div>

    <button type="submit" className="btn btn-dark w-100">
      Login
    </button>
  </form>
</div>


  );
}
