# KOAH WH - Sistema de Ventas de Arneses de Seguridad

Aplicación web full-stack para la venta de arneses de seguridad eléctrica. Incluye catálogo de productos, carrito de compras, autenticación de clientes, pasarela de pagos y panel de administración.

## Stack Tecnológico

**Frontend:** React 19 + Vite, React Router v7, Context API  
**Backend:** Node.js + Express 5  
**Base de Datos:** MySQL  
**Autenticación:** JWT + Google OAuth  
**Pagos:** Conekta  
**Email:** Nodemailer (Gmail)

---

## Configuración local

### Requisitos

- Node.js 18+
- MySQL 8+

### 1. Clonar e instalar dependencias

```bash
# Dependencias del frontend
npm install

# Dependencias del backend
cd backend && npm install
```

### 2. Configurar variables de entorno

**Frontend** — copiar y rellenar con tus valores:
```bash
cp .env.example .env
```

**Backend** — copiar y rellenar con tus valores:
```bash
cp backend/.env.example backend/.env
```

### 3. Crear la base de datos

Crea una base de datos MySQL llamada `koahwh_db` e importa el esquema si está disponible. El servidor aplica las migraciones pendientes automáticamente al arrancar.

### 4. Levantar el proyecto

```bash
# Terminal 1 — Backend (puerto 4000)
cd backend && npm run dev

# Terminal 2 — Frontend (puerto 5173)
npm run dev
```

---

## Variables de entorno

### Frontend (`.env`)

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL del backend (ej. `http://localhost:4000`) |
| `VITE_GOOGLE_CLIENT_ID` | Client ID de Google OAuth |
| `VITE_CONEKTA_PUBLIC_KEY` | Llave pública de Conekta |

### Backend (`backend/.env`)

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (default: 4000) |
| `FRONTEND_URL` | URL del frontend en producción (para CORS) |
| `DB_HOST` | Host de MySQL |
| `DB_USER` | Usuario de MySQL |
| `DB_PASSWORD` | Contraseña de MySQL |
| `DB_NAME` | Nombre de la base de datos |
| `DB_PORT` | Puerto de MySQL (default: 3306) |
| `JWT_SECRET` | Clave secreta para firmar tokens JWT |
| `GOOGLE_CLIENT_ID` | Client ID de Google OAuth |
| `CONEKTA_PRIVATE_KEY` | Llave privada de Conekta |
| `EMAIL_USER` | Correo Gmail para envío de notificaciones |
| `EMAIL_PASS` | Contraseña de aplicación de Gmail |

---

## Estructura del proyecto

```
Residencia/
├── src/                    # Frontend React
│   ├── admin/              # Panel de administración
│   ├── pages/              # Páginas públicas
│   ├── components/         # Componentes reutilizables
│   ├── context/            # Estado global (carrito)
│   └── utils/              # Utilidades
├── backend/
│   ├── controllers/        # Lógica de negocio
│   ├── middleware/         # Auth, uploads
│   ├── routers/            # Rutas de la API
│   ├── services/           # Email, etc.
│   └── uploads/            # Imágenes de productos (no en git)
├── .env.example            # Plantilla de variables de entorno (frontend)
└── backend/.env.example    # Plantilla de variables de entorno (backend)
```

---

## API Endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/register` | Registro de clientes |
| POST | `/api/auth/login` | Login (email/contraseña) |
| POST | `/api/auth/google` | Login con Google |
| GET | `/api/arneses-publicos` | Catálogo público de productos |
| POST | `/api/pedidos` | Crear pedido |
| GET | `/api/pedidos/mis-pedidos` | Pedidos del cliente autenticado |
| POST | `/api/webhooks/conekta` | Webhook de pagos Conekta |

## Deployment

Ver la sección de deployment en la wiki del proyecto o contactar al equipo de desarrollo.
