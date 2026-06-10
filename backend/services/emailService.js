import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const BRAND = 'KOA WH';

function plantilla(titulo, contenido) {
  return `
    <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #f7f6f3; padding: 32px 16px;">
      <div style="background: white; border-radius: 12px; padding: 40px 36px; border: 1px solid #e8e6e1;">

        <h1 style="font-size: 1.3rem; font-weight: 600; color: #1a1a18; margin: 0 0 24px;">${BRAND}</h1>

        <h2 style="font-size: 1.1rem; font-weight: 500; color: #1b3a6b; margin: 0 0 16px;">${titulo}</h2>

        ${contenido}

        <hr style="border: none; border-top: 1px solid #e8e6e1; margin: 28px 0;" />

        <p style="font-size: 0.75rem; color: #888; margin: 0;">
          Este correo fue enviado automáticamente por ${BRAND}. Por favor no respondas a este mensaje.
        </p>
      </div>
    </div>
  `;
}

export async function enviarEmailPagoConfirmado({ email, nombre, folio, total }) {
  await transporter.sendMail({
    from: `"${BRAND}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `✅ Pago confirmado — ${folio}`,
    html: plantilla(
      '¡Tu pago fue aprobado!',
      `
        <p style="color: #1a1a18; line-height: 1.6;">Hola <strong>${nombre}</strong>,</p>
        <p style="color: #1a1a18; line-height: 1.6;">Tu pago fue recibido y confirmado. Ya estamos preparando tu pedido.</p>

        <div style="background: #f0faf5; border: 1px solid #2a7a55; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
          <p style="margin: 0 0 6px; font-size: 0.75rem; color: #2a7a55; text-transform: uppercase; letter-spacing: 1px;">Folio del pedido</p>
          <p style="margin: 0; font-size: 1.1rem; font-weight: 600; color: #1a1a18; font-family: monospace;">${folio}</p>
          <p style="margin: 8px 0 0; font-size: 0.9rem; color: #1a1a18;">Total: <strong>${total}</strong></p>
        </div>

        <p style="color: #555; line-height: 1.6;">Te avisaremos cuando tu pedido esté en camino. 🚚</p>
      `
    ),
  });
}

export async function enviarEmailEnCamino({ email, nombre, folio }) {
  await transporter.sendMail({
    from: `"${BRAND}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `🚚 Tu pedido va en camino — ${folio}`,
    html: plantilla(
      '¡Tu pedido está en camino!',
      `
        <p style="color: #1a1a18; line-height: 1.6;">Hola <strong>${nombre}</strong>,</p>
        <p style="color: #1a1a18; line-height: 1.6;">Tu pedido <strong style="font-family: monospace;">${folio}</strong> ya fue enviado y está en camino a tu dirección.</p>

        <div style="background: #f5f0fd; border: 1px solid #6b3fa0; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
          <p style="margin: 0; font-size: 0.95rem; color: #6b3fa0; font-weight: 500;">📦 En tránsito hacia tu domicilio</p>
        </div>

        <p style="color: #555; line-height: 1.6;">Pronto recibirás tu pedido. Si tienes alguna duda, contáctanos.</p>
      `
    ),
  });
}

export async function enviarEmailEntregado({ email, nombre, folio }) {
  await transporter.sendMail({
    from: `"${BRAND}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `✅ Pedido entregado — ${folio}`,
    html: plantilla(
      '¡Tu pedido fue entregado!',
      `
        <p style="color: #1a1a18; line-height: 1.6;">Hola <strong>${nombre}</strong>,</p>
        <p style="color: #1a1a18; line-height: 1.6;">Tu pedido <strong style="font-family: monospace;">${folio}</strong> fue entregado exitosamente. ¡Gracias por tu compra!</p>

        <div style="background: #f0faf5; border: 1px solid #2a7a55; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
          <p style="margin: 0; font-size: 0.95rem; color: #2a7a55; font-weight: 500;">✅ Entregado correctamente</p>
        </div>

        <p style="color: #555; line-height: 1.6;">Esperamos que disfrutes tu producto. ¡Hasta la próxima!</p>
      `
    ),
  });
}
