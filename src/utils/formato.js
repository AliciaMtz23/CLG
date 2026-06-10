export function formatFecha(f) {
  if (!f) return "—";
  return new Date(f).toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export function formatMoneda(n) {
  if (n == null) return "—";
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

export function fmtPeso(n) {
  return `$${Number(n || 0).toLocaleString("es-MX", { minimumFractionDigits: 0 })}`;
}

export function estadoClass(e) {
  if (e === "pendiente")  return "pendiente";
  if (e === "en_proceso") return "proceso";
  if (e === "en_camino")  return "camino";
  if (e === "entregado")  return "completado";
  if (e === "cancelado")  return "cancelado";
  return "";
}

export function metodoPagoLabel(m) {
  if (m === "OXXO") return "OXXO Pay";
  if (m === "Tarjeta" || m === "conekta") return "Tarjeta";
  return m ?? "—";
}

export function estadoLabel(e) {
  const map = {
    pendiente: "Pendiente",
    en_proceso: "En proceso",
    en_camino: "En camino",
    entregado: "Entregado",
    cancelado: "Cancelado",
  };
  return map[e] ?? e ?? "—";
}
