export const metadata = {
  title: "Aviso de privacidad — Notaría Pública No. 3 de Celaya",
  description: "Cómo tratamos los datos personales que recibimos por WhatsApp y otros medios.",
};

const CORREO_CONTACTO = "contacto@notaria3.com"; // TODO: cambiar por el correo real de la Notaría
const ULTIMA_ACTUALIZACION = "11 de noviembre de 2026";

const s = {
  page: {
    minHeight: "100vh",
    background: "#FAFAF7",
    color: "#1F2A36",
    fontFamily: "Georgia, 'Times New Roman', serif",
    padding: "48px 20px 72px",
  },
  wrap: { maxWidth: 680, margin: "0 auto" },
  sello: {
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,
    color: "#5B6B7A",
    borderBottom: "2px solid #1F3A5F",
    paddingBottom: 12,
    marginBottom: 32,
  },
  h1: { fontSize: 34, lineHeight: 1.2, margin: "0 0 8px", color: "#1F3A5F", fontWeight: 700 },
  fecha: {
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,
    color: "#5B6B7A",
    margin: "0 0 40px",
  },
  h2: { fontSize: 21, lineHeight: 1.3, margin: "40px 0 12px", color: "#1F3A5F" },
  p: { fontSize: 17, lineHeight: 1.75, margin: "0 0 16px" },
  ul: { fontSize: 17, lineHeight: 1.75, margin: "0 0 16px", paddingLeft: 22 },
  a: { color: "#1F3A5F", textDecoration: "underline" },
  pie: {
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,
    color: "#5B6B7A",
    borderTop: "1px solid #D9DDE2",
    marginTop: 56,
    paddingTop: 16,
  },
};

export default function PrivacidadPage() {
  return (
    <main style={s.page}>
      <div style={s.wrap}>
        <div style={s.sello}>Notaría Pública No. 3 · Celaya, Guanajuato</div>

        <h1 style={s.h1}>Aviso de privacidad</h1>
        <p style={s.fecha}>Última actualización: {ULTIMA_ACTUALIZACION}</p>

        <p style={s.p}>
          La Notaría Pública No. 3 de Celaya, Guanajuato, es responsable del tratamiento de los
          datos personales que nos proporcionas por WhatsApp, teléfono, correo o en nuestras
          oficinas, conforme a la Ley Federal de Protección de Datos Personales en Posesión de los
          Particulares.
        </p>

        <h2 style={s.h2}>Qué datos recabamos</h2>
        <ul style={s.ul}>
          <li>Nombre y número de teléfono, incluido el nombre de tu perfil de WhatsApp.</li>
          <li>El contenido de los mensajes, documentos e imágenes que nos envías.</li>
          <li>La información necesaria para el trámite notarial que solicitas.</li>
        </ul>

        <h2 style={s.h2}>Para qué los usamos</h2>
        <ul style={s.ul}>
          <li>Atender tus dudas y dar seguimiento a tu trámite.</li>
          <li>Enviarte avisos sobre el estado de tu trámite, citas y documentos pendientes.</li>
          <li>Cumplir con las obligaciones legales propias de la función notarial.</li>
        </ul>
        <p style={s.p}>No usamos tus datos para publicidad ni los vendemos a terceros.</p>

        <h2 style={s.h2}>Con quién los compartimos</h2>
        <p style={s.p}>
          Los mensajes de WhatsApp se transmiten a través de WhatsApp Business, servicio de Meta
          Platforms, y de los proveedores tecnológicos que operan nuestro sistema de atención. Ellos
          solo procesan la información para hacer posible la comunicación. Fuera de eso, solo
          compartimos datos cuando una autoridad competente lo requiera conforme a la ley.
        </p>

        <h2 style={s.h2}>Cuánto tiempo los conservamos</h2>
        <p style={s.p}>
          Conservamos tus datos el tiempo necesario para atender tu trámite y el que exijan las
          disposiciones aplicables a la función notarial.
        </p>

        <h2 style={s.h2}>Tus derechos y cómo borrar tus datos</h2>
        <p style={s.p}>
          Puedes pedir el acceso, rectificación, cancelación u oposición al uso de tus datos
          (derechos ARCO), o revocar tu consentimiento, escribiendo a{" "}
          <a style={s.a} href={`mailto:${CORREO_CONTACTO}`}>{CORREO_CONTACTO}</a> con tu nombre,
          tu número de teléfono y lo que solicitas. Te responderemos en un máximo de 20 días hábiles.
        </p>
        <p style={s.p}>
          Si ya no quieres recibir mensajes por WhatsApp, responde «BAJA» en la conversación y
          dejaremos de escribirte por ese medio.
        </p>

        <h2 style={s.h2}>Cambios a este aviso</h2>
        <p style={s.p}>
          Cualquier cambio a este aviso se publicará en esta misma página con su nueva fecha de
          actualización.
        </p>

        <div style={s.pie}>Notaría Pública No. 3 de Celaya, Guanajuato</div>
      </div>
    </main>
  );
}