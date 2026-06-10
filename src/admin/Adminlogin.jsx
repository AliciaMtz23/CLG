import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff, FiAlertCircle } from "react-icons/fi";
import logo from "../imagenes/Logo.png";
import "./Adminlogin.css";
import { API } from "../config";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleForm = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      return setError("Completa todos los campos.");
    }

    setLoading(true);

    try {
      const res = await fetch(`${API}/api/auth/login-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        return setError(data.message || "Credenciales incorrectas.");
      }

      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminData", JSON.stringify(data.admin));

      navigate("/admin/dashboard");

    } catch (err) {
      console.error(err);
      setError("No se pudo conectar al servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">

        <img src={logo} alt="CLG" className="login-logo" />

        <div className="login-header">
          <h2 className="login-title">Panel de administración</h2>
          <p className="login-sub">Ingresa tus credenciales para continuar</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">

          <div className="login-field">
            <label className="login-label">Correo electrónico</label>
            <input
              className="login-input"
              type="email"
              name="email"
              placeholder="admin@clg.com"
              value={form.email}
              onChange={handleForm}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="login-field">
            <label className="login-label">Contraseña</label>
            <div className="login-input-wrap">
              <input
                className="login-input"
                type={showPass ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleForm}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-pass"
                onClick={() => setShowPass(!showPass)}
                tabIndex={-1}
              >
                {showPass ? <FiEyeOff size={15} /> : <FiEye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="login-error">
              <FiAlertCircle size={13} />
              {error}
            </div>
          )}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <><span className="login-spinner" /> Verificando...</>
            ) : (
              "Iniciar sesión"
            )}
          </button>

        </form>

        <p className="login-footer">Solo personal autorizado de CLG</p>

      </div>
    </div>
  );
}
