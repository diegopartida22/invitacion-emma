import { EVENT } from "./event";
import type { Guest, Invitation } from "./types";

const MX = "52";

/**
 * Deja el teléfono como lo quiere wa.me: solo dígitos y con clave de país.
 *
 * Los números de la lista vienen en formato local ("33 4897 3760"). Sin el 52
 * al frente WhatsApp no resuelve el contacto y abre el chat vacío, así que un
 * número de 10 dígitos se asume mexicano. Lo que ya trae clave se deja igual.
 */
export function normalizePhone(raw: string | null | undefined) {
  let digits = (raw ?? "").replace(/[^0-9]/g, "");
  if (!digits) return "";

  digits = digits.replace(/^(?:00|011)/, ""); // prefijos de marcación internacional
  digits = digits.replace(/^0?4[45]/, ""); // viejo 044/045 de celular en México

  return digits.length === 10 ? MX + digits : digits;
}

export function invitationUrl(code: string, baseUrl: string) {
  return `${baseUrl.replace(/\/$/, "")}/i/${code}`;
}

/** Mensaje que el anfitrión le manda al invitado con su liga personalizada. */
export function inviteMessage(guest: Guest, url: string) {
  const saludo = guest.display_name ? `¡Hola ${guest.display_name}!` : "¡Hola!";
  return (
    `${saludo} Con mucho cariño te invitamos a la Primera Comunión de ${EVENT.child} ` +
    `el ${EVENT.dateLabel.toLowerCase()}. Aquí está tu invitación personalizada, ` +
    `donde podrás confirmar tu asistencia: ${url}`
  );
}

/** Mensaje que el invitado le manda a los papás al confirmar. */
export function confirmationMessage(
  invitation: Invitation,
  attending: boolean,
  adults: number,
  kids: number,
) {
  return attending
    ? `¡Hola! Confirmo asistencia a la Primera Comunión de ${EVENT.child} con ${adults} adulto(s) y ${kids} niño(s). — ${invitation.display_name}`
    : `¡Hola! Lamento no poder asistir a la Primera Comunión de ${EVENT.child}, pero les mando un fuerte abrazo. — ${invitation.display_name}`;
}

export function waLink(phone: string, text: string) {
  const digits = normalizePhone(phone);
  const query = `?text=${encodeURIComponent(text)}`;
  return digits ? `https://wa.me/${digits}${query}` : `https://wa.me/${query}`;
}
