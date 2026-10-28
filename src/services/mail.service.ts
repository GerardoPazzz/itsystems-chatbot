import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config';

export interface CredencialesDemo {
  destinatario: string;
  nombre: string;
  sapUsername: string;
  contrasena: string;
  roleId: string;
  requiresFiori: boolean;
}

// Modulos demo disponibles. Se duplica aqui a proposito: el frontend es JS
// plano servido estaticamente y no puede importar desde src/.
const DEMO_MODULE_LABELS: Record<string, string> = {
  'S4_MM_DEMO': 'SAP MM (Gestion de Materiales)',
  'S4_SD_DEMO': 'SAP SD (Ventas y Distribucion)',
  'S4_FI_DEMO': 'SAP FI (Contabilidad Financiera)',
  'S4_PP_DEMO': 'SAP PP (Planificacion de Produccion)',
  'S4_PM_DEMO': 'SAP PM (Mantenimiento de Plantas)'
};

const GUIAS_DRIVE: Record<string, string> = {
  'S4_MM_DEMO': 'https://drive.google.com/drive/folders/1xgecegsDtRC3bvNT0tUmmL9lkz4Verfd?usp=drive_link',
  'S4_SD_DEMO': 'https://drive.google.com/drive/folders/1xgecegsDtRC3bvNT0tUmmL9lkz4Verfd?usp=drive_link',
  'S4_PM_DEMO': 'https://drive.google.com/drive/folders/1xgecegsDtRC3bvNT0tUmmL9lkz4Verfd?usp=drive_link',
  'S4_FI_DEMO': 'https://drive.google.com/drive/folders/14I4jF5w6TinY5Or_gK4haDuq_zpTWXde?usp=drive_link',
  'S4_PP_DEMO': 'https://drive.google.com/drive/folders/14I4jF5w6TinY5Or_gK4haDuq_zpTWXde?usp=drive_link'
};

const WEBGUI_URL_NUEVO = 'https://s4hana.sapapp.store/webgui';
const WEBGUI_URL_ORIGINAL = 'https://s4hana.itscloud.store/webgui';
const FIORI_URL = 'https://s4hana.sapapp.store/fiori';
const DURACION_DIAS = 7;

const WHATSAPP_NUMERO = '51940475222';
const WHATSAPP_TEXTO = encodeURIComponent('Hola, tengo una consulta sobre los cursos de SAP. ¿Podrían ayudarme?');
const EMAIL_CONTACTO = 'info@itsystems.pe';

// El encabezado se usa como texto plano: los clientes de correo (Gmail,
// Outlook) eliminan el elemento <svg> y no resuelven las referencias cid
// cuando el HTML va en quoted-printable, que es como lo codifica nodemailer.

const BRAND = '#2563eb';
const BRAND_DARK = '#1d4ed8';
const BG = '#070B14';
const CARD_BG = '#111827';
const BORDER = 'rgba(255,255,255,0.1)';
const TEXT = '#ffffff';
const TEXT_SECONDARY = '#E5E7EB';
const TEXT_MUTED = '#9CA3AF';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildEmailHtml(params: CredencialesDemo): string {
  const modulo = DEMO_MODULE_LABELS[params.roleId] || 'SAP';
  const webguiUrl = params.requiresFiori ? WEBGUI_URL_NUEVO : WEBGUI_URL_ORIGINAL;
  const guiaUrl = GUIAS_DRIVE[params.roleId] || 'https://drive.google.com';

  const headerLogo = `<p style="margin:0 0 4px 0;font-size:12px;letter-spacing:2px;font-weight:700;color:${BRAND};">ITSYSTEMS</p>`;

  const buttonStyle = [
    'display:inline-block',
    'width:290px',
    'padding:12px 18px',
    `background:${BRAND}`,
    `border:1px solid ${BRAND_DARK}`,
    'border-radius:6px',
    'text-decoration:none',
    'font-weight:600',
    'font-size:14px',
    'text-align:center',
    'color:#ffffff',
    'mso-line-height-rule:exactly'
  ].join(';');

  const buttonCell = 'padding:8px 6px';

  const fioriButton = params.requiresFiori
    ? `<tr><td width="100%" align="center" style="${buttonCell}"><a href="${FIORI_URL}" target="_blank" style="${buttonStyle}">Iniciar sesion Fiori (Interfaz moderna SAP)</a></td></tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Credenciales de tu cuenta demo SAP</title>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BG};padding:24px 12px;">
<tr>
<td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:${CARD_BG};border:1px solid ${BORDER};border-radius:12px;overflow:hidden;">
<tr>
<td style="padding:24px 24px 8px 24px;">
${headerLogo}
<h1 style="margin:0;font-size:20px;line-height:1.3;color:${TEXT};">Tu cuenta demo ${escapeHtml(modulo)} esta lista</h1>
</td>
</tr>
<tr>
<td style="padding:8px 24px 0 24px;">
<p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:${TEXT_SECONDARY};">Hola ${escapeHtml(params.nombre)}, tu acceso de practica ya fue creado. Te compartimos las credenciales:</p>
</td>
</tr>
<tr>
<td style="padding:0 24px 16px 24px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(255,255,255,0.04);border:1px solid ${BORDER};border-radius:8px;">
<tr><td style="padding:10px 14px;font-size:14px;color:${TEXT_MUTED};">Usuario</td><td style="padding:10px 14px;font-size:15px;font-weight:700;color:${TEXT};font-family:Consolas,Monaco,monospace;">${escapeHtml(params.sapUsername)}</td></tr>
<tr><td style="padding:10px 14px;font-size:14px;color:${TEXT_MUTED};">Contrasena</td><td style="padding:10px 14px;font-size:15px;font-weight:700;color:${TEXT};font-family:Consolas,Monaco,monospace;">${escapeHtml(params.contrasena)}</td></tr>
<tr><td style="padding:10px 14px;font-size:14px;color:${TEXT_MUTED};">Modulo</td><td style="padding:10px 14px;font-size:15px;color:${TEXT_SECONDARY};">${escapeHtml(modulo)}</td></tr>
</table>
</td>
</tr>
<tr>
<td style="padding:8px 24px 4px 24px;">
<p style="margin:0 0 8px 0;font-size:12px;letter-spacing:1px;font-weight:700;color:${TEXT_MUTED};">ACCESO</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td width="100%" align="center" style="${buttonCell}"><a href="${guiaUrl}" target="_blank" style="${buttonStyle}">Descargar guia de instalacion SAP Logon (Windows)</a></td></tr>
<tr><td width="100%" align="center" style="${buttonCell}"><a href="${webguiUrl}" target="_blank" style="${buttonStyle}">Iniciar sesion WebGUI (Interfaz Clasica via web)</a></td></tr>
${fioriButton}
</table>
</td>
</tr>
<tr>
<td style="padding:16px 24px 0 24px;">
<p style="margin:0 0 8px 0;padding:10px 12px;background:rgba(37,99,235,0.12);border-radius:6px;font-size:13px;line-height:1.6;color:${TEXT_SECONDARY};">Tu cuenta es <strong style="color:${TEXT};">temporal (${DURACION_DIAS} dias)</strong> y al ingresar por primera vez tendras que <strong style="color:${TEXT};">actualizar tu contrasena</strong>.</p>
</td>
</tr>
<tr>
<td style="padding:8px 24px 24px 24px;">
<p style="margin:0 0 6px 0;font-size:13px;line-height:1.6;color:${TEXT_MUTED};">Si tienes alguna duda, contactate con un asesor de ITSYSTEMS:</p>
<p style="margin:0 0 4px 0;font-size:13px;line-height:1.6;color:${TEXT_SECONDARY};">Correo: <a href="mailto:${EMAIL_CONTACTO}" style="color:#60a5fa;text-decoration:underline;">${EMAIL_CONTACTO}</a></p>
<p style="margin:0;font-size:13px;line-height:1.6;color:${TEXT_SECONDARY};">WhatsApp: <a href="https://wa.me/${WHATSAPP_NUMERO}?text=${WHATSAPP_TEXTO}" target="_blank" style="color:#60a5fa;text-decoration:underline;">+51 940 475 222</a></p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
}

function buildEmailText(params: CredencialesDemo): string {
  const modulo = DEMO_MODULE_LABELS[params.roleId] || 'SAP';
  const webguiUrl = params.requiresFiori ? WEBGUI_URL_NUEVO : WEBGUI_URL_ORIGINAL;
  const guiaUrl = GUIAS_DRIVE[params.roleId] || 'https://drive.google.com';

  const lineas = [
    'ITSYSTEMS',
    `Tu cuenta demo ${modulo} esta lista`,
    '',
    `Hola ${params.nombre}, tu acceso de practica ya fue creado.`,
    '',
    `Usuario: ${params.sapUsername}`,
    `Contrasena: ${params.contrasena}`,
    `Modulo: ${modulo}`,
    '',
    'ACCESO',
    `- Descargar guia de instalacion SAP Logon (Windows): ${guiaUrl}`,
    `- Iniciar sesion WebGUI (Interfaz Clasica via web): ${webguiUrl}`
  ];

  if (params.requiresFiori) {
    lineas.push(`- Iniciar sesion Fiori (Interfaz moderna SAP): ${FIORI_URL}`);
  }

  lineas.push(
    '',
    `Tu cuenta es temporal (${DURACION_DIAS} dias) y al ingresar por primera vez tendras que actualizar tu contrasena.`,
    '',
    'Si tienes alguna duda, contactate con un asesor de ITSYSTEMS:',
    `Correo: ${EMAIL_CONTACTO}`,
    `WhatsApp: +51 940 475 222 (https://wa.me/${WHATSAPP_NUMERO})`
  );

  return lineas.join('\n');
}

function getTransporter(): Transporter | null {
  if (!config.mail.user || !config.mail.appPassword) {
    console.warn('[Mail] Envio omitido: faltan GMAIL_USER y/o GMAIL_APP_PASSWORD en el .env');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.mail.user,
      pass: config.mail.appPassword
    }
  });
}

/**
 * Envia las credenciales de la cuenta demo por correo.
 * Nunca lanza: si falla el envio, el registro ya concretado se mantiene
 * y las credenciales siguen disponibles en el chat.
 */
export async function enviarCredencialesDemo(params: CredencialesDemo): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) return false;

  const modulo = DEMO_MODULE_LABELS[params.roleId] || 'SAP';

  try {
    await transporter.sendMail({
      from: config.mail.from,
      to: params.destinatario,
      subject: `Tu cuenta demo ${modulo} - Credenciales de acceso`,
      html: buildEmailHtml(params),
      text: buildEmailText(params)
    });

    console.log(`[Mail] Credenciales enviadas a ${params.destinatario} para ${params.sapUsername}`);
    return true;
  } catch (error: any) {
    // No se loguea la contrasena, solo el motivo del fallo.
    console.error(`[Mail] Error al enviar credenciales a ${params.destinatario}:`, error?.message || error);
    return false;
  }
}
