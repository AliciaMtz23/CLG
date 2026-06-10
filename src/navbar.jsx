import { useState } from 'react';
import { Link, useLocation } from "react-router-dom";
import { FiShoppingCart, FiUser } from 'react-icons/fi';
import logo from './imagenes/Logo.png';
import { useCart } from './context/CartContext';
import './navbar.css';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { count, setIsOpen } = useCart();
  const location = useLocation();

  const toggleMenu = () => setMenuOpen(prev => !prev);
  const closeMenu = () => setMenuOpen(false);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">

        <div className="navbar-logo">
          <Link to="/" onClick={closeMenu}>
            <img src={logo} alt="CLG" />
          </Link>
        </div>

        <ul className={`nav-links ${menuOpen ? 'active' : ''}`}>
          <li><Link to="/"         className={isActive('/')         ? 'active' : ''} onClick={closeMenu}>Home</Link></li>
          <li><Link to="/about"    className={isActive('/about')    ? 'active' : ''} onClick={closeMenu}>About Us</Link></li>
          <li><Link to="/catalogo" className={isActive('/catalogo') ? 'active' : ''} onClick={closeMenu}>Catálogo</Link></li>
          <li><Link to="/contact"  className={isActive('/contact')  ? 'active' : ''} onClick={closeMenu}>Contacto</Link></li>

          <li className="nav-mobile-only">
            <Link to="/mi-cuenta" onClick={closeMenu}>Mi cuenta</Link>
          </li>
          <li className="nav-mobile-only">
            <Link to="/mis-pedidos" onClick={closeMenu}>Mis pedidos</Link>
          </li>
        </ul>

        <div className="navbar-actions">
          <Link
            to="/mi-cuenta"
            className={`navbar-icon-btn ${isActive('/mi-cuenta') || isActive('/mis-pedidos') ? 'navbar-icon-btn--active' : ''}`}
            title="Mi cuenta"
          >
            <FiUser size={19} />
          </Link>

          <button
            className={`navbar-icon-btn navbar-cart-btn`}
            onClick={() => setIsOpen(true)}
            aria-label="Abrir carrito"
          >
            <FiShoppingCart size={19} />
            {count > 0 && <span className="navbar-cart-badge">{count}</span>}
          </button>
        </div>

        <button
          className={`hamburger ${menuOpen ? 'open' : ''}`}
          onClick={toggleMenu}
          aria-label="Abrir menú"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

      </div>
    </nav>
  );
};

export default Navbar;
