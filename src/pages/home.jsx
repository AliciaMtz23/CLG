import React, { useState, useEffect, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import logo from "../imagenes/Logo.png";
import arnes from "../imagenes/ilustrativa1.jpg";
import imagenes from "../imagenes/imagenes";
import "./home.css";

// Lazy load del mapa para mejorar rendimiento
const MapSection = lazy(() => import("./MapSection"));

const images = [
  { src: imagenes.ilustrativa1, alt: "Empresa 1" },
  { src: imagenes.ilustrativa2, alt: "Empresa 2" },
  { src: imagenes.ilustrativa3, alt: "Empresa 3" },
  { src: imagenes.ilustrativa4, alt: "Empresa 4" },
  { src: imagenes.ilustrativa5, alt: "Empresa 5" },
];

const Home = () => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="home">
      {/* SHOP BANNER */}
      <section className="shop-banner">
        <div className="shop-banner-inner">
          <span className="shop-banner-tag">Tienda en línea</span>
          <p className="shop-banner-msg">
            Arneses eléctricos industriales certificados · Fabricación a la medida · Envíos a todo México
          </p>
          <Link to="/catalogo" className="shop-banner-link">Ver productos →</Link>
        </div>
      </section>

      {/* HERO */}
      <section className="hero">
        <div className="hero-left">
          <span className="hero-tag">Fabricación industrial · Jalisco, México</span>

          <h1>
            Expertos en arneses<br />
            eléctricos industriales
          </h1>

          <p className="description">
            Diseñamos y fabricamos arneses eléctricos de alta precisión para
            sectores industriales. Calidad certificada, tiempos cumplidos y
            soluciones a la medida de tu proyecto.
          </p>

          <div className="hero-btns">
            <Link to="/catalogo">
              <button className="btn-primary">Ver catálogo →</button>
            </Link>
            <Link to="/about">
              <button className="btn-outline">Conoce más</button>
            </Link>
          </div>
        </div>

        <div className="hero-right">
          <div className="image-card">
            <img src={arnes} alt="Arnés eléctrico" />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="stats-strip">
        <div className="stat">
          <span className="stat-num">19+</span>
          <span className="stat-label">Años de experiencia</span>
        </div>
        <div className="stat-divider" />
        <div className="stat">
          <span className="stat-num">100%</span>
          <span className="stat-label">Control de calidad</span>
        </div>
        <div className="stat-divider" />
        <div className="stat">
          <span className="stat-num">A la medida</span>
          <span className="stat-label">Soluciones personalizadas</span>
        </div>
        <div className="stat-divider" />
        <div className="stat">
          <span className="stat-num">Envío</span>
          <span className="stat-label">A todo México</span>
        </div>
      </section>

      {/* CARRUSEL 3D */}
      <section className="carousel-section">
        <h1>Nuestra Empresa</h1>

        <div className="carousel-3d">
          {images.map((img, i) => {
            const offset = i - active;
            let className = "carousel-item";

            if (offset === 0) className += " active";
            else if (offset === -1 || offset === images.length - 1)
              className += " prev";
            else if (offset === 1 || offset === -(images.length - 1))
              className += " next";
            else className += " hidden";

            return (
              <div key={i} className={className}>
                <img src={img.src} alt={img.alt} draggable="false" />
              </div>
            );
          })}
        </div>
      </section>

      {/* UBICACIÓN */}
      <section className="location">
        <div className="location-container">

          <div className="location-info">
            <h2>Nuestra Ubicación</h2>

            <p className="address">
              C. Volcán Ajusco 5471-B, <br />
              Colli Urbano, 45070 Zapopan, Jal.
            </p>

            <p className="phone">33 3133 3636</p>

            <div className="schedule">
              <h4>Horarios de atención</h4>
              <p>Lunes a Viernes:</p>
              <ul>
                <li>9:00 a.m. – 2:00 p.m.</li>
                <li>3:00 p.m. – 6:00 p.m.</li>
              </ul>
            </div>

            <a
              href="https://www.google.com/maps/place/Cables+y+Tecnolog%C3%ADa+-+Cabytec/@20.643633,-103.4299831,17z/data=!3m1!4b1!4m6!3m5!1s0x8428ac3d8de4cca3:0x1abc952064b5ffb2!8m2!3d20.643633!4d-103.4274082!16s%2Fg%2F1ptvt2ysz?entry=ttu&g_ep=EgoyMDI2MDIyNS4wIKXMDSoASAFQAw%3D%3D"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-location"
            >
              Cómo llegar →
            </a>
          </div>

          <div className="location-map">
            <Suspense fallback={<div className="map-skeleton">Cargando mapa...</div>}>
              <MapSection />
            </Suspense>
          </div>

        </div>
      </section>
    </div>
  );
};

export default Home;
