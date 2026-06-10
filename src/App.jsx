import './App.css';
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Navbar        from './navbar';
import Home          from './pages/home';
import About         from './pages/about';
import Contact       from './pages/contactUs';
import Catalogo      from './pages/catalogo';
import AdminLogin    from './admin/Adminlogin';
import AdminDashboard from './admin/adminDashboard';
import MiCuenta      from './pages/MiCuenta';
import MisPedidos    from './pages/MisPedidos';
import Checkout         from './pages/Checkout';
import { CartProvider } from './context/CartContext';
import CartDrawer    from './components/CartDrawer';

// necesita estar dentro del Router para poder usar useLocation
function AppContent() {
  const location = useLocation();

  // Ocultar navbar en todas las rutas de /admin
  const esAdmin = location.pathname.startsWith("/admin");

  return (
    <>
      {!esAdmin && <Navbar />}
      {!esAdmin && <CartDrawer />}
      <div className={esAdmin ? "" : "app-content"}>
        <Routes>
          {/* rutas públicas */}
          <Route path="/"         element={<Home />}     />
          <Route path="/about"    element={<About />}    />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/contact"  element={<Contact />}  />

          {/* cliente */}
          <Route path="/mi-cuenta"   element={<MiCuenta />}   />
          <Route path="/mis-pedidos" element={<MisPedidos />} />
          <Route path="/checkout" element={<Checkout />} />

          {/* admin */}
          <Route path="/admin/login"     element={<AdminLogin />}     />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <CartProvider>
      <Router>
        <AppContent />
      </Router>
    </CartProvider>
  );
}

export default App;