import React from "react";
import "./about.css";
import arnesImg from "../imagenes/arnes.png";
import { FiAward, FiZap, FiCheckCircle, FiUsers } from "react-icons/fi";
import AboutCard from "./components/AboutCard";
import { useNavigate, Link } from "react-router-dom";


const razones = [
  {
    numero: "01",
    title: "Experiencia comprobada",
    desc: "19 años fabricando arneses eléctricos nos respaldan. Conocemos cada detalle del proceso y anticipamos los desafíos antes de que ocurran.",
  },
  {
    numero: "02",
    title: "Soluciones a la medida",
    desc: "No fabricamos en serie genérica. Cada arnés se diseña según las especificaciones técnicas y operativas de tu proyecto.",
  },
  {
    numero: "03",
    title: "Control de calidad riguroso",
    desc: "Cada unidad pasa por pruebas eléctricas y de continuidad antes de salir de nuestra planta. Cero tolerancia a defectos.",
  },
  {
    numero: "04",
    title: "Tiempos de entrega cumplidos",
    desc: "Entendemos que tus líneas de producción no pueden detenerse. Planificamos con precisión para cumplir tus fechas.",
  },
];

const valores = [
  {
    icon: <FiAward size={46} />,
    title: "Calidad",
    description: "Nos comprometemos a mantener los más altos estándares en cada arnés que fabricamos."

  },
  {
    icon: <FiZap size={46} />,
    title: "Innovación",
    description: "Buscamos constantemente mejorar nuestros procesos y materiales para superar expectativas."
  },
  {
    icon:<FiUsers size={46} />,
    title: "Compromiso",
    description: "Cumplimos con lo que prometemos: tiempos, especificaciones y calidad sin excusas."
  },
  {
    icon: <FiUsers size={46} />,
    title: "Confianza",
    description: "Construimos relaciones duraderas con nuestros clientes basadas en transparencia y resultados."
  }
];

const About = () => {
  const navigate = useNavigate();

  return (
    <>
      {/* HERO */}
      <section className="about-hero" style={{ backgroundImage: `url(${arnesImg})` }}>
        <div className="about-hero-overlay" />
        <div className="about-hero-content">
          <span className="about-tag">19 años · Jalisco, México</span>
          <h1 className="about-hero-title">
            Fabricamos conexiones que <br />
            <em>mueven la industria</em>
          </h1>
          <p className="about-hero-sub">
            De taller especializado a planta de manufactura avanzada — dos décadas
            entregando arneses eléctricos de alta precisión.
          </p>
          <div className="about-hero-btns">
            <Link to="/catalogo">
              <button className="about-hero-btn-primary">Ver catálogo →</button>
            </Link>
            <button className="about-hero-btn-outline" onClick={() => navigate("/contact")}>
              Contáctanos
            </button>
          </div>
        </div>
      </section>

      {/* NUESTRA HISTORIA */}
      <section className="nuestra-historia">
        <div className="historia-container">
          <span className="section-tag">Nuestra historia</span>
          <p className="historia-text">
            Fundada en Jalisco bajo principios de precisión, Koa WH cuenta con casi dos
            décadas de experiencia en la fabricación de arneses eléctricos especializados.
            De taller experto a planta de manufactura avanzada, evolucionamos junto a
            nuestros clientes para transformar requerimientos complejos en soluciones de
            interconexión seguras y duraderas.
          </p>
        </div>
      </section>

      <section className="mision-vision">
        <div className="mv-container">
          <div className="mv-card">
            <span className="mv-label">Misión</span>
            <p>
              Diseñar y fabricar arneses eléctricos de alta calidad
              que brinden soluciones seguras, eficientes y confiables
              para nuestros clientes.
            </p>
          </div>
          <div className="mv-divider" />
          <div className="mv-card">
            <span className="mv-label">Visión</span>
            <p>
              Ser una empresa reconocida por la calidad e innovación
              en la fabricación de arneses eléctricos, expandiendo
              nuestra presencia a nivel nacional e internacional.
            </p>
          </div>
        </div>
      </section>
      
      {/*Porque elegirnos */}
      <section className="porque">
        <div className="porque-container">
          <div className="porque-header">
            <span className="section-tag">Nuestras ventajas</span>
            <h1>¿Por qué elegir CLG?</h1>
          </div>
          <div className="porque-grid">
            {razones.map((r) => (
              <div className="porque-card" key={r.numero}>
                <span className="porque-numero">{r.numero}</span>
                <h3>{r.title}</h3>
                <p>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VALORES */}
      <section className="valores">
        <div className="valores-container">
          <div className="valores-header">
            <span className="section-tag">Lo que nos define</span>
            <h2>Nuestros valores</h2>
          </div>
          <div className="valores-grid">
            {valores.map((v, i) => (
              <AboutCard
                key={i}
                icon={v.icon}
                title={v.title}
                description={v.description}
              />
            ))}




          </div>
        </div>
      </section>

      {/* CTA CATÁLOGO */}
      <section className="about-cta">
        <div className="about-cta-inner">
          <span className="section-tag">Nuestra tienda</span>
          <h2>¿Listo para hacer tu pedido?</h2>
          <p>Contamos con arneses eléctricos industriales disponibles para compra inmediata. Explora nuestro catálogo y encuentra el producto que necesitas.</p>
          <div className="about-cta-btns">
            <Link to="/catalogo">
              <button className="ac-btn">Ver catálogo</button>
            </Link>
            <button className="ac-btn-outline" onClick={() => navigate("/contact")}>
              Contáctanos
            </button>
          </div>
        </div>
      </section>

      {/* CONTACTO */}
      <section className="about-contacto">
        <div className="ac-inner">

          <div className="ac-header">
            <h2 className="ac-titulo">Contáctanos y conoce mejor nuestros productos</h2>
          </div>

          <div className="ac-body">
            <div className="ac-info">
              <p className="ac-horario-label">Nuestro horario</p>
              <p className="ac-dias">Lunes a Viernes:</p>
              <ul className="ac-horas">
                <li>9 a.m. – 2 p.m.</li>
                <li>3 – 6 p.m.</li>
              </ul>
              <button className="ac-btn" onClick={() => navigate("/contact")}>
                Contáctanos
              </button>
            </div>

            <div className="ac-mapa">
              <iframe
                title="Ubicación CLG"
                src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d3733.6373645919907!2d-103.4299831!3d20.643633!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8428ac3d8de4cca3%3A0x1abc952064b5ffb2!2sCables%20y%20Tecnolog%C3%ADa%20-%20Cabytec!5e0!3m2!1ses!2smx!4v1775670683512!5m2!1ses!2smx"
                width="100%"
                height="100%"
                style={{ border: 0, display: "block" }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

        </div>
      </section>

    </>
  );
};

export default About;
