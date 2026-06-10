import { useState, useEffect, useRef } from "react";
import "./catalogo.css";
import { API } from "../config";

const FORM_VACIO = {
  codigo: "", nombre: "", descripcion: "",
  tipo: "", material: "", longitud_m: "",
  voltaje_max: "", precio: "", stock: ""
};

export default function AdminCatalogo() {
  const [arneses, setArneses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [seleccionado, setSelec] = useState(null);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [imagenFile, setImagenFile] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);
  const inputImagenRef = useRef(null);

  const cargarArneses = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/arneses`);
      if (!res.ok) throw new Error();
      setArneses(await res.json());
    } catch (err) {
      console.error(err);
      setError("No se pudo conectar al servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarArneses(); }, []);

  const arnesesFiltrados = arneses.filter(a =>
    a.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    a.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
    (a.tipo?.toLowerCase() || "").includes(busqueda.toLowerCase())
  );

  const handleImagen = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImagenFile(file);
    setImagenPreview(URL.createObjectURL(file));
  };

  const quitarImagen = () => {
    setImagenFile(null);
    setImagenPreview(null);
    if (inputImagenRef.current) inputImagenRef.current.value = "";
  };

  const abrirNuevo = () => {
    setForm(FORM_VACIO);
    setImagenFile(null);
    setImagenPreview(null);
    setError("");
    setModal("nuevo");
  };

  const abrirEditar = (a) => {
    setForm({
      codigo: a.codigo,
      nombre: a.nombre,
      descripcion: a.descripcion  || "",
      tipo: a.tipo || "",
      material: a.material || "",
      longitud_m: a.longitud_m || "",
      voltaje_max: a.voltaje_max || "",
      precio: a.precio || "",
      stock: a.stock || 0,
    });
    setImagenFile(null);
    setImagenPreview(a.imagen ? `${API}/uploads/arneses/${a.imagen}` : null);
    setSelec(a);
    setError("");
    setModal("editar");
  };

  const abrirEliminar = (a) => { setSelec(a); setModal("eliminar"); };

  const cerrarModal = () => {
    setModal(null);
    setSelec(null);
    setError("");
    setImagenFile(null);
    setImagenPreview(null);
  };

  const handleForm = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleGuardar = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.codigo || !form.nombre) return setError("Código y nombre son obligatorios.");
    setGuardando(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (imagenFile) formData.append("imagen", imagenFile);

      const url = modal === "nuevo" ? `${API}/api/arneses` : `${API}/api/arneses/${seleccionado.id}`;
      const method = modal === "nuevo" ? "POST" : "PUT";
      const res = await fetch(url, { method, body: formData });
      const data = await res.json();

      if (!res.ok) return setError(data.message || "Error al guardar.");
      await cargarArneses();
      cerrarModal();
    } catch (err) {
      console.error(err);
      setError("Error de conexión con el servidor.");
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async () => {
    setGuardando(true);
    try {
      const res = await fetch(`${API}/api/arneses/${seleccionado.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await cargarArneses();
      cerrarModal();
    } catch (err) {
      console.error(err);
      setError("Error al eliminar.");
    } finally {
      setGuardando(false);
    }
  };

  const stockBadge = (stock) => {
    if (stock === 0) return <span className="stock-badge stock-out">sin stock</span>;
    if (stock <= 5)  return <span className="stock-badge stock-low">{stock} bajo</span>;
    return <span className="stock-badge stock-ok">{stock}</span>;
  };

  const imgUrl = (imagen) => imagen ? `${API}/uploads/arneses/${imagen}` : null;

  return (
    <div className="ac-page">

      <div className="ac-toolbar">
        <div className="ac-search">
          <span className="search-icon">⌕</span>
          <input
            placeholder="Buscar por nombre, código o tipo..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
        <button className="btn-primary" onClick={abrirNuevo}>
          + nuevo arnés
        </button>
      </div>

      {error && !modal && (
        <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>
      )}

      <div className="ac-table-wrap">
        {loading ? (
          <div className="loading-text">conectando con la base de datos...</div>
        ) : arnesesFiltrados.length === 0 ? (
          <div className="ac-empty">
            {arneses.length === 0 ? "no hay arneses — agrega el primero" : "sin resultados"}
          </div>
        ) : (
          <table className="ac-table">
            <thead>
              <tr>
                <th>img</th>
                <th>código</th>
                <th>nombre</th>
                <th>tipo</th>
                <th>material</th>
                <th>longitud</th>
                <th>voltaje</th>
                <th>precio</th>
                <th>stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {arnesesFiltrados.map(arnes => (
                <tr key={arnes.id}>
                  <td>
                    {imgUrl(arnes.imagen)
                      ? <img src={imgUrl(arnes.imagen)} alt={arnes.nombre} className="tabla-img" />
                      : <div className="tabla-img-placeholder">—</div>
                    }
                  </td>
                  <td><span className="td-codigo">{arnes.codigo}</span></td>
                  <td><span className="td-nombre">{arnes.nombre}</span></td>
                  <td>{arnes.tipo}</td>
                  <td>{arnes.material}</td>
                  <td>{arnes.longitud_m} m</td>
                  <td>{arnes.voltaje_max}</td>
                  <td><span className="td-precio">${Number(arnes.precio).toLocaleString("es-MX")}</span></td>
                  <td>{stockBadge(arnes.stock)}</td>
                  <td>
                    <div className="td-actions">
                      <button className="btn-icon"        onClick={() => abrirEditar(arnes)}   title="Editar">✎</button>
                      <button className="btn-icon danger" onClick={() => abrirEliminar(arnes)} title="Eliminar">✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(modal === "nuevo" || modal === "editar") && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && cerrarModal()}>
          <div className="modal">
            <button className="modal-close" onClick={cerrarModal}>✕</button>
            <div className="modal-title">
              {modal === "nuevo" ? "nuevo arnés" : "editar arnés"}
            </div>

            <form onSubmit={handleGuardar}>
              <div className="form-grid">

                <div className="form-field">
                  <label className="form-label">Código *</label>
                  <input className="form-input" name="codigo" placeholder="KW-ARN-X00"
                    value={form.codigo} onChange={handleForm}
                    disabled={modal === "editar"} required />
                </div>

                <div className="form-field">
                  <label className="form-label">Tipo</label>
                  <input className="form-input" name="tipo" placeholder="Tipo A, Custom..."
                    value={form.tipo} onChange={handleForm} />
                </div>

                <div className="form-field span2">
                  <label className="form-label">Nombre *</label>
                  <input className="form-input" name="nombre" placeholder="Nombre del arnés"
                    value={form.nombre} onChange={handleForm} required />
                </div>

                <div className="form-field span2">
                  <label className="form-label">Descripción</label>
                  <textarea className="form-textarea" name="descripcion"
                    placeholder="Descripción técnica del producto"
                    value={form.descripcion} onChange={handleForm} />
                </div>

                <div className="form-field">
                  <label className="form-label">Material</label>
                  <input className="form-input" name="material" placeholder="Cobre AWG 18"
                    value={form.material} onChange={handleForm} />
                </div>

                <div className="form-field">
                  <label className="form-label">Longitud (m)</label>
                  <input className="form-input" name="longitud_m" type="number"
                    step="0.01" placeholder="1.50"
                    value={form.longitud_m} onChange={handleForm} />
                </div>

                <div className="form-field">
                  <label className="form-label">Voltaje máx.</label>
                  <input className="form-input" name="voltaje_max" placeholder="12V DC"
                    value={form.voltaje_max} onChange={handleForm} />
                </div>

                <div className="form-field">
                  <label className="form-label">Precio (MXN)</label>
                  <input className="form-input" name="precio" type="number"
                    step="0.01" placeholder="850.00"
                    value={form.precio} onChange={handleForm} />
                </div>

                <div className="form-field">
                  <label className="form-label">Stock</label>
                  <input className="form-input" name="stock" type="number"
                    placeholder="0" value={form.stock} onChange={handleForm} />
                </div>

                <div className="form-field span2">
                  <label className="form-label">Imagen del producto</label>
                  {imagenPreview ? (
                    <div className="imagen-preview-wrap">
                      <img src={imagenPreview} alt="preview" className="imagen-preview" />
                      <button type="button" className="btn-quitar-imagen" onClick={quitarImagen}>
                        ✕ quitar imagen
                      </button>
                    </div>
                  ) : (
                    <div className="imagen-dropzone" onClick={() => inputImagenRef.current?.click()}>
                      <span className="dropzone-icono">🖼</span>
                      <span>Clic para seleccionar imagen</span>
                      <span className="dropzone-hint">JPG, PNG o WEBP — máx. 5 MB</span>
                    </div>
                  )}
                  <input
                    ref={inputImagenRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImagen}
                    style={{ display: "none" }}
                  />
                </div>

              </div>

              {error && <div className="form-error">{error}</div>}

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={cerrarModal}>cancelar</button>
                <button type="submit" className="btn-primary" disabled={guardando}>
                  {guardando ? "guardando..." : modal === "nuevo" ? "crear arnés" : "guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === "eliminar" && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && cerrarModal()}>
          <div className="modal confirm-modal">
            <div className="confirm-icon">⚠</div>
            <div className="confirm-title">eliminar arnés</div>
            <p className="confirm-sub">
              ¿Seguro que quieres eliminar <strong>{seleccionado?.nombre}</strong>?<br />
              Esta acción también eliminará la imagen del producto.
            </p>
            <div className="modal-actions" style={{ justifyContent: "center" }}>
              <button className="btn-secondary" onClick={cerrarModal}>cancelar</button>
              <button className="btn-danger" onClick={handleEliminar} disabled={guardando}>
                {guardando ? "eliminando..." : "sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}