import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff, FiAlertCircle } from "react-icons/fi";
import { GoogleLogin } from "@react-oauth/google";
import { formatFecha, formatMoneda, estadoClass, estadoLabel } from "../utils/formato";
import { useCart } from "../context/CartContext";
import logo from "../imagenes/Logo.png";
import "./ClienteAuth.css";
import { API } from "../config";

function restaurarCarrito(clienteId, dispatch) {
  try {
    const saved = JSON.parse(localStorage.getItem(`carrito_${clienteId}`) || '[]');
    if (saved.length > 0) dispatch({ type: 'LOAD', items: saved });
  } catch {}
}

function StatusPill({ estado }) {
  return <span className={`ca-pill ${estadoClass(estado)}`}>{estadoLabel(estado)}</span>;
}

export default function MiCuenta() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("login"); // "login" | "registro" | "rastreo"

  useEffect(() => {
    const token = localStorage.getItem("clienteToken");
    if (token) navigate("/mis-pedidos", { replace: true });
  }, [navigate]);

  return (
    <div className="ca-wrap">
      <div className="ca-card">

        <img src={logo} alt="CLG" className="ca-logo" />

        {/* Tabs */}
        <div className="ca-tabs">
          <button className={`ca-tab ${tab === "login"    ? "active" : ""}`} onClick={() => setTab("login")}>
            Iniciar sesión
          </button>
          <button className={`ca-tab ${tab === "registro" ? "active" : ""}`} onClick={() => setTab("registro")}>
            Crear cuenta
          </button>
          <button className={`ca-tab ${tab === "rastreo"  ? "active" : ""}`} onClick={() => setTab("rastreo")}>
            Rastrear pedido
          </button>
        </div>

        {tab === "login"    && <LoginForm    navigate={navigate} />}
        {tab === "registro" && <RegistroForm navigate={navigate} />}
        {tab === "rastreo"  && <RastreoForm />}

      </div>
    </div>
  );
}

function LoginForm({ navigate }) {
  const { dispatch } = useCart();
  const [form, setForm]       = useState({ email: "", password: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const onChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return setError("Completa todos los campos.");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/clientes/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message || "Credenciales incorrectas.");
      localStorage.setItem("clienteToken", data.token);
      localStorage.setItem("clienteData", JSON.stringify(data.cliente));
      restaurarCarrito(data.cliente.id, dispatch);
      navigate("/mis-pedidos");
    } catch (err) {
      console.error(err);
      setError("No se pudo conectar al servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credentialResponse) => {
    try {
      const res = await fetch(`${API}/api/clientes/google-auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message || "Error al iniciar con Google.");
      localStorage.setItem("clienteToken", data.token);
      localStorage.setItem("clienteData",  JSON.stringify(data.cliente));
      restaurarCarrito(data.cliente.id, dispatch);
      navigate("/mis-pedidos");
    } catch (err) {
      console.error(err);
      setError("No se pudo conectar al servidor.");
    }
  };

  return (
    <form className="ca-form" onSubmit={handleSubmit}>
      <div className="ca-header">
        <p className="ca-sub">Accede a tu cuenta para ver el historial de tus pedidos</p>
      </div>

      <div className="ca-field">
        <label className="ca-label">Correo electrónico</label>
        <input className="ca-input" type="email" name="email"
          placeholder="tu@correo.com" value={form.email} onChange={onChange} autoFocus />
      </div>

      <div className="ca-field">
        <label className="ca-label">Contraseña</label>
        <div className="ca-input-wrap">
          <input className="ca-input" type={showPass ? "text" : "password"} name="password"
            placeholder="••••••••" value={form.password} onChange={onChange} />
          <button type="button" className="ca-toggle-pass" onClick={() => setShowPass(!showPass)} tabIndex={-1}>
            {showPass ? <FiEyeOff size={15} /> : <FiEye size={15} />}
          </button>
        </div>
      </div>

      {error && <div className="ca-error"><FiAlertCircle size={13} />{error}</div>}

      <button type="submit" className="ca-btn" disabled={loading}>
        {loading ? <><span className="ca-spinner" /> Verificando...</> : "Iniciar sesión"}
      </button>

      <div className="ca-divider"><span>o continúa con</span></div>

      <div className="ca-google-wrap">
        <GoogleLogin
          onSuccess={handleGoogle}
          onError={() => setError("No se pudo iniciar sesión con Google.")}
          theme="outline"
          size="large"
          width="100%"
          text="signin_with"
          shape="rectangular"
          locale="es"
        />
      </div>
    </form>
  );
}

function RegistroForm({ navigate }) {
  const { dispatch } = useCart();
  const [form, setForm]       = useState({ nombre: "", email: "", password: "", telefono: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const onChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.email || !form.password) return setError("Nombre, email y contraseña son obligatorios.");
    if (form.password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres.");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/clientes/registro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message || "Error al crear cuenta.");
      localStorage.setItem("clienteToken", data.token);
      localStorage.setItem("clienteData", JSON.stringify(data.cliente));
      restaurarCarrito(data.cliente.id, dispatch);
      navigate("/mis-pedidos");
    } catch (err) {
      console.error(err);
      setError("No se pudo conectar al servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credentialResponse) => {
    try {
      const res = await fetch(`${API}/api/clientes/google-auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message || "Error al registrarse con Google.");
      localStorage.setItem("clienteToken", data.token);
      localStorage.setItem("clienteData", JSON.stringify(data.cliente));
      restaurarCarrito(data.cliente.id, dispatch);
      navigate("/mis-pedidos");
    } catch (err) {
      console.error(err);
      setError("No se pudo conectar al servidor.");
    }
  };

  return (
    <form className="ca-form" onSubmit={handleSubmit}>
      <div className="ca-header">
        <p className="ca-sub">Crea tu cuenta para llevar un registro completo de tus pedidos</p>
      </div>

      <div className="ca-field">
        <label className="ca-label">Nombre completo</label>
        <input className="ca-input" type="text" name="nombre"
          placeholder="Juan Pérez" value={form.nombre} onChange={onChange} autoFocus />
      </div>

      <div className="ca-field">
        <label className="ca-label">Correo electrónico</label>
        <input className="ca-input" type="email" name="email"
          placeholder="tu@correo.com" value={form.email} onChange={onChange} />
      </div>

      <div className="ca-field">
        <label className="ca-label">Teléfono <span className="ca-opcional">(opcional)</span></label>
        <input className="ca-input" type="tel" name="telefono"
          placeholder="55 1234 5678" value={form.telefono} onChange={onChange} />
      </div>

      <div className="ca-field">
        <label className="ca-label">Contraseña</label>
        <div className="ca-input-wrap">
          <input className="ca-input" type={showPass ? "text" : "password"} name="password"
            placeholder="Mínimo 6 caracteres" value={form.password} onChange={onChange} />
          <button type="button" className="ca-toggle-pass" onClick={() => setShowPass(!showPass)} tabIndex={-1}>
            {showPass ? <FiEyeOff size={15} /> : <FiEye size={15} />}
          </button>
        </div>
      </div>

      {error && <div className="ca-error"><FiAlertCircle size={13} />{error}</div>}

      <button type="submit" className="ca-btn" disabled={loading}>
        {loading ? <><span className="ca-spinner" /> Creando cuenta...</> : "Crear cuenta"}
      </button>

      <div className="ca-divider"><span>o regístrate con</span></div>

      <div className="ca-google-wrap">
        <GoogleLogin
          onSuccess={handleGoogle}
          onError={() => setError("No se pudo registrar con Google.")}
          theme="outline"
          size="large"
          width="100%"
          text="signup_with"
          shape="rectangular"
          locale="es"
        />
      </div>
    </form>
  );
}

function RastreoForm() {
  const [modo, setModo]         = useState("folio"); // "folio" | "email"
  const [valor, setValor]       = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [pedidos, setPedidos]   = useState(null);

  const handleBuscar = async (e) => {
    e.preventDefault();
    if (!valor.trim()) return setError(`Ingresa un ${modo === "folio" ? "folio" : "correo"}.`);
    setError(""); setPedidos(null); setLoading(true);
    try {
      const params = new URLSearchParams({ [modo]: valor.trim() });
      const res = await fetch(`${API}/api/clientes/rastreo?${params}`);
      const data = await res.json();
      if (!res.ok) return setError(data.message || "No se encontraron resultados.");
      setPedidos(data);
    } catch (err) {
      console.error(err);
      setError("No se pudo conectar al servidor.");
    } finally {
      setLoading(false);
    }
  };

  const limpiar = () => { setPedidos(null); setValor(""); setError(""); };

  return (
    <div className="ca-form">
      <div className="ca-header">
        <p className="ca-sub">Consulta el estado de tu pedido sin necesidad de crear una cuenta</p>
      </div>

      {/* Selector folio / email */}
      <div className="ca-modo-btns">
        <button type="button"
          className={`ca-modo-btn ${modo === "folio" ? "active" : ""}`}
          onClick={() => { setModo("folio"); setValor(""); setError(""); setPedidos(null); }}>
          Por folio
        </button>
        <button type="button"
          className={`ca-modo-btn ${modo === "email" ? "active" : ""}`}
          onClick={() => { setModo("email"); setValor(""); setError(""); setPedidos(null); }}>
          Por correo
        </button>
      </div>

      {!pedidos && (
        <form onSubmit={handleBuscar}>
          <div className="ca-field">
            <label className="ca-label">
              {modo === "folio" ? "Número de folio" : "Correo electrónico"}
            </label>
            <input
              className="ca-input"
              type={modo === "email" ? "email" : "text"}
              placeholder={modo === "folio" ? "Ej. CLG-0001" : "tu@correo.com"}
              value={valor}
              onChange={(e) => { setValor(e.target.value); setError(""); }}
              autoFocus
            />
          </div>

          {error && <div className="ca-error"><FiAlertCircle size={13} />{error}</div>}

          <button type="submit" className="ca-btn" disabled={loading}>
            {loading ? <><span className="ca-spinner" /> Buscando...</> : "Buscar pedido"}
          </button>
        </form>
      )}

      {pedidos && (
        <div className="ca-rastreo-resultados">
          <div className="ca-rastreo-header">
            <span className="ca-rastreo-count">{pedidos.length} pedido{pedidos.length !== 1 ? "s" : ""} encontrado{pedidos.length !== 1 ? "s" : ""}</span>
            <button type="button" className="ca-link-btn" onClick={limpiar}>Nueva búsqueda</button>
          </div>

          <div className="ca-pedidos-lista">
            {pedidos.map((p, i) => (
              <div key={i} className="ca-pedido-row">
                <div className="ca-pedido-top">
                  <span className="ca-pedido-folio">{p.folio ?? "—"}</span>
                  <StatusPill estado={p.estado} />
                </div>
                <div className="ca-pedido-bottom">
                  <span className="ca-pedido-fecha">{formatFecha(p.fecha_pedido)}</span>
                  <span className="ca-pedido-total">{formatMoneda(p.total)}</span>
                  {p.metodo_pago && <span className="ca-pedido-metodo">{p.metodo_pago}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
