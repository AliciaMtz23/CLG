import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiLogOut, FiFileText, FiGrid, FiMenu, FiX } from "react-icons/fi";
import { formatFecha, fmtPeso, estadoClass, estadoLabel, metodoPagoLabel } from "../utils/formato";
import "./AdminDashboard.css";
import AdminCatalogo from './AdminCatalogo';
import AdminClientes from './Adminclientes';
import AdminAdministradores from './AdminAdministradores';
import AdminPedidos from './AdminPedidos';
import iconImg from '../imagenes/Icon.png';
import { API } from '../config';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [stats, setStats] = useState(null);
  const [topStock, setTopStock] = useState([]);
  const [pedidosRecientes, setPedidos] = useState([]);
  const [tendencia, setTendencia] = useState([]);
  const [loadingDash, setLoadingDash] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const adminData = localStorage.getItem("adminData");
    if (!token || !adminData) {
      navigate("/admin/login");
      return;
    }
    try {
      setAdmin(JSON.parse(adminData));
    } catch (err) {
      console.error(err);
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminData");
      navigate("/admin/login");
    }
  }, []);

  useEffect(() => {
    if (!admin) return;
    cargarDashboard();
  }, [admin]);

  const cargarDashboard = async () => {
    setLoadingDash(true);
    try {
      const [sRes, tRes, pRes, mRes] = await Promise.all([
        fetch(`${API}/api/dashboard/stats`),
        fetch(`${API}/api/dashboard/top-stock`),
        fetch(`${API}/api/dashboard/pedidos-recientes`),
        fetch(`${API}/api/dashboard/pedidos-por-mes`),
      ]);
      const [s, t, p, m] = await Promise.all([
        sRes.json(), tRes.json(), pRes.json(), mRes.json()
      ]);
      setStats(!Array.isArray(s) && s ? s : {});
      setTopStock(Array.isArray(t) ? t : []);
      setPedidos(Array.isArray(p) ? p : []);
      setTendencia(Array.isArray(m) ? m : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDash(false);
    }
  };

  const getNavItems = () => {
    const base = [
      { id: "dashboard", label: "Dashboard" },
      { id: "pedidos", label: "Pedidos" },
      { id: "catalogo", label: "Catálogo" },
    ];
    if (admin?.rol === "superadmin") {
      base.splice(3, 0,
        { id: "clientes",        label: "Clientes" },
        { id: "administradores", label: "Administradores" }
      );
    }
    return base;
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    navigate("/admin/login");
  };

  if (!admin) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif", fontSize: "0.875rem", color: "#94a3b8" }}>
      Verificando sesión...
    </div>
  );

  const navItems = getNavItems();
  const initials = admin.nombre
    ? admin.nombre.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : "AD";

  const maxStock = topStock.length ? Math.max(...topStock.map(a => a.stock)) : 1;
  const maxPedidos = tendencia.length ? Math.max(...tendencia.map(t => t.pedidos)) : 1;

  const Skeleton = ({ w = "100%", h = "20px" }) => (
    <div className="skeleton" style={{ width: w, height: h }} />
  );

  const renderContenido = () => {
    switch (activeNav) {
      case "dashboard":
        return (
          <div className="dash-page">
            <div className="page-heading">
              <h1>resumen</h1>
              <p>Bienvenido, {admin.nombre}</p>
            </div>

            <div className="stats-row">
              <div className="stat-card" style={{ animationDelay: "0s" }}>
                <div className="stat-label">total pedidos</div>
                {loadingDash
                  ? <Skeleton w="60px" h="40px" />
                  : <div className="stat-value">{stats?.totalPedidos ?? 0}</div>}
                <div className="stat-sub up">↑ histórico</div>
              </div>
              <div className="stat-card" style={{ animationDelay: "0.06s" }}>
                <div className="stat-label">pendientes</div>
                {loadingDash
                  ? <Skeleton w="50px" h="40px" />
                  : <div className="stat-value">{stats?.pedidosPendientes ?? 0}</div>}
                <div className="stat-sub warn">por atender</div>
              </div>
              <div className="stat-card" style={{ animationDelay: "0.12s" }}>
                <div className="stat-label">arneses en stock</div>
                {loadingDash
                  ? <Skeleton w="55px" h="40px" />
                  : <div className="stat-value">{stats?.arnesStock ?? 0}</div>}
                <div className="stat-sub">unidades totales</div>
              </div>
            </div>

            <div className="grid-2">
              <div className="section-card" style={{ animationDelay: "0.18s" }}>
                <div className="section-header">
                  <span className="section-title">pedidos por mes</span>
                </div>
                {loadingDash ? (
                  <Skeleton h="100px" />
                ) : tendencia.length === 0 ? (
                  <div className="empty-chart">sin pedidos registrados</div>
                ) : (
                  <div className="bar-chart">
                    {tendencia.map((t, i) => (
                      <div className="bar-col" key={t.periodo}>
                        <div
                          className={`bar-fill ${i === tendencia.length - 1 ? "current" : ""}`}
                          style={{ height: `${(t.pedidos / maxPedidos) * 100}%` }}
                          title={`${t.pedidos} pedidos`}
                        />
                        <span className="bar-mes">{t.mes}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="section-card" style={{ animationDelay: "0.24s" }}>
                <div className="section-header">
                  <span className="section-title">top 5 en stock</span>
                  <button className="section-link" onClick={() => setActiveNav("catalogo")}>
                    ver catálogo
                  </button>
                </div>
                {loadingDash ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[...Array(5)].map((_, i) => <Skeleton key={i} h="36px" />)}
                  </div>
                ) : topStock.length === 0 ? (
                  <div className="empty-chart">sin productos en inventario</div>
                ) : (
                  <div className="product-list">
                    {topStock.map((a, i) => (
                      <div className="product-row" key={a.id}>
                        <span className="product-rank">{i + 1}</span>
                        <div className="product-info">
                          <div className="product-name">{a.nombre}</div>
                          <div className="product-code">{a.codigo}</div>
                        </div>
                        <div className="product-bar-wrap">
                          <div
                            className="product-bar-fill"
                            style={{ width: `${(a.stock / maxStock) * 100}%` }}
                          />
                        </div>
                        <span className="product-qty">{a.stock} uds.</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="section-card" style={{ animationDelay: "0.3s" }}>
              <div className="section-header">
                <span className="section-title">pedidos recientes</span>
                <button className="section-link" onClick={() => setActiveNav("pedidos")}>
                  ver todos
                </button>
              </div>
              {loadingDash ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[...Array(5)].map((_, i) => <Skeleton key={i} h="44px" />)}
                </div>
              ) : pedidosRecientes.length === 0 ? (
                <div className="empty-section">
                  <FiFileText size={28} opacity={0.3} />
                  <p>aún no hay pedidos registrados</p>
                </div>
              ) : (
                <table className="mini-table">
                  <thead>
                    <tr>
                      <th>folio</th>
                      <th>cliente</th>
                      <th>total</th>
                      <th>pago</th>
                      <th>fecha</th>
                      <th>estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidosRecientes.map(p => (
                      <tr key={p.id}>
                        <td><span className="td-folio">{p.folio}</span></td>
                        <td>{p.cliente}</td>
                        <td><span className="td-folio">{fmtPeso(p.total)}</span></td>
                        <td>
                          <span className="metodo-badge">
                            {metodoPagoLabel(p.metodo_pago)}
                          </span>
                        </td>
                        <td>{formatFecha(p.fecha_pedido)}</td>
                        <td>
                          <span className={`status-pill ${estadoClass(p.estado)}`}>
                            {estadoLabel(p.estado)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        );

      case "pedidos":
        return (
          <div className="dash-page">
            <div className="page-heading">
              <h1>pedidos</h1>
              <p>Gestiona y actualiza el estado de los pedidos</p>
            </div>
            <AdminPedidos />
          </div>
        );

      case "catalogo":
        return (
          <div className="dash-page">
            <div className="page-heading">
              <h1>catálogo</h1>
              <p>Gestiona los productos disponibles</p>
            </div>
            <AdminCatalogo />
          </div>
        );

      case "administradores":
        return (
          <div className="dash-page">
            <div className="page-heading">
              <h1>administradores</h1>
              <p>Gestiona las cuentas de acceso al panel</p>
            </div>
            <AdminAdministradores adminActual={admin} />
          </div>
        );

      case "clientes":
        return (
          <div className="dash-page">
            <div className="page-heading">
              <h1>clientes</h1>
              <p>Gestiona los clientes de CLG</p>
            </div>
            <AdminClientes />
          </div>
        );

      default:
        return (
          <div className="dash-page">
            <div className="empty-section">
              <FiGrid size={32} opacity={0.3} />
              <p>próximamente</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="dash-wrap">

      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`sidebar ${sidebarOpen ? "sidebar--open" : ""}`}>
        <div className="sidebar-brand">
          <img
            src={iconImg}
            alt="CLG"
            style={{ width: "32px", height: "32px", objectFit: "contain" }}
          />
          <span className="sidebar-brand-name">KOA WH</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeNav === item.id ? "active" : ""}`}
              onClick={() => { setActiveNav(item.id); setSidebarOpen(false); }}
            >
              {item.label}
              {item.id === "administradores" && (
                <span className="nav-rol-badge">super</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-rol">
            <span className={`rol-badge ${admin.rol}`}>
              {admin.rol === "superadmin" ? "Super Admin" : "Admin"}
            </span>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            <FiLogOut size={14} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="dash-main">
        <header className="dash-topbar">
          <button
            className="topbar-hamburger"
            onClick={() => setSidebarOpen(prev => !prev)}
            aria-label="Abrir menú"
          >
            {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
          <span className="topbar-title">
            {navItems.find(n => n.id === activeNav)?.label}
          </span>
          <div className="topbar-admin">
            <span className="admin-name">{admin.nombre}</span>
            <div className="admin-avatar">{initials}</div>
          </div>
        </header>
        {renderContenido()}
      </div>

    </div>
  );
}
