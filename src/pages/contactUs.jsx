import React, { useState, useRef } from "react";
import emailjs from "@emailjs/browser";
import "./contact.css";

const Contact = () => {
  const form = useRef();
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
   
    //Se utiliza EMAILJS
    emailjs.sendForm(
      "service_8x2ju5n",    // Service ID
      "template_zckjhyd",   // Template ID
      form.current,
      "HO6esjpbc9RU27tSa"     // Public Key
    )
    .then(() => {
      setEnviado(true);
      setLoading(false);
      form.current.reset();
    })
    .catch(() => {
      setError(true);
      setLoading(false);
    });
  };

  return (
    <div className="contact-wrapper">
      <div className="contact-page">
        <div className="contact-container">
          <div className="contact-info">
            <h2>Contáctanos</h2>
            <p>Estamos listos para atenderte. Llena el formulario y nos pondremos en contacto contigo.</p>
            <div className="contact-details">
              <p>Horarios de atención </p>
              <p>Lunes a viernes 9a.m.-2p.m.  3-6p.m.</p>
              <p>Sabado Cerrado</p>
              <p>Domingo Cerrado</p>
              <p>📞 +52 33 1234 5678</p>
              <p>C. Volcán Ajusco 5471-B, Colli Urbano, 45070 Zapopan, Jal.</p>
              <p></p>
            </div>
          </div>

          <form ref={form} className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre</label>
              <input type="text" name="nombre" placeholder="Tu nombre completo" required />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" placeholder="tucorreo@ejemplo.com" required />
            </div>

            <div className="form-group">
              <label>Teléfono</label>
              <input type="tel" name="telefono" placeholder="+52 33 0000 0000" required />
            </div>

            <div className="form-group">
              <label>Mensaje</label>
              <textarea name="mensaje" rows="5" placeholder="¿En qué podemos ayudarte?" required />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Enviando..." : "Enviar mensaje"}
            </button>

            {enviado && <p className="success-msg">Mensaje enviado correctamente.</p>}
            {error && <p className="error-msg"> Hubo un error, intenta de nuevo.</p>}
          </form>
        </div>
      </div>

      <div className="contact-map">
        <iframe
          title="Ubicación CLG"
          src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d3733.6373645919907!2d-103.4299831!3d20.643633!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8428ac3d8de4cca3%3A0x1abc952064b5ffb2!2sCables%20y%20Tecnolog%C3%ADa%20-%20Cabytec!5e0!3m2!1ses!2smx!4v1775670683512!5m2!1ses!2smx"
          width="100%"
          height="450"
          style={{ border: 0, display: "block" }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
};

export default Contact;