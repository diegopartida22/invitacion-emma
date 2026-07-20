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

/**
 * Mensaje que el anfitrión le manda al invitado con su liga personalizada.
 *
 * Cambia según en qué punto va esa persona: no es lo mismo invitar por primera
 * vez que insistirle a alguien que lleva dos semanas sin contestar.
 */
export function inviteMessage(guest: Guest, url: string) {
  const saludo = guest.display_name ? `¡Hola ${guest.display_name}!` : "¡Hola!";
  const fecha = EVENT.dateLabel.toLowerCase();

  // Ya contestó: pedirle que confirme otra vez se siente a desatención.
  if (guest.status !== "pending") {
    return (
      `${saludo} Te dejo de nuevo la invitación a la Primera Comunión de ` +
      `${EVENT.child}, por si la necesitas: ${url}`
    );
  }

  // Ya se le mandó y sigue sin responder: recordatorio, no la misma invitación.
  if (guest.invite_sent_at) {
    return (
      `${saludo} Te recordamos la Primera Comunión de ${EVENT.child}, el ` +
      `${fecha}. Nos ayudaría muchísimo saber si podrás acompañarnos — puedes ` +
      `confirmar aquí hasta el ${EVENT.rsvpDeadlineLabel}: ${url}`
    );
  }

  return (
    `${saludo} Con mucho cariño te invitamos a la Primera Comunión de ${EVENT.child} ` +
    `el ${fecha}. Aquí está tu invitación personalizada, ` +
    `donde podrás confirmar tu asistencia: ${url}`
  );
}

/** Cómo estaba el RSVP en un momento dado. Sirve para narrar los cambios. */
export type RsvpSnapshot = {
  status: Invitation["status"];
  adults: number;
  kids: number;
};

/**
 * Mensaje que el invitado le manda a la organizadora después de responder.
 *
 * Compara contra cómo estaba su respuesta al abrir la página, porque para
 * quien organiza no es lo mismo un "confirmo" nuevo que un "ya no voy" de
 * alguien que ya tenía lugares apartados en la cuenta del salón. Antes todos
 * los casos mandaban el mismo texto y esa diferencia se perdía.
 */
export function confirmationMessage(
  name: string,
  previous: RsvpSnapshot,
  current: RsvpSnapshot,
) {
  const firma = ` — ${name}`;
  const personas = `${current.adults} adulto(s) y ${current.kids} niño(s)`;
  const comunion = `la Primera Comunión de ${EVENT.child}`;

  if (current.status === "no") {
    return previous.status === "yes"
      ? `¡Hola! Les había confirmado, pero al final no vamos a poder acompañarlos en ${comunion}. Cancelo mi asistencia, ¡les mando un abrazo!${firma}`
      : `¡Hola! Lamento no poder asistir a ${comunion}, pero les mando un fuerte abrazo.${firma}`;
  }

  if (previous.status === "no") {
    return `¡Hola! Al final sí vamos a poder acompañarlos en ${comunion}. Confirmo con ${personas}.${firma}`;
  }

  // Ya había confirmado y ahora viene con otro número.
  const cambioDeNumeros =
    previous.status === "yes" &&
    (previous.adults !== current.adults || previous.kids !== current.kids);

  if (cambioDeNumeros) {
    return `¡Hola! Cambié mi confirmación para ${comunion}: ahora seremos ${personas}.${firma}`;
  }

  return `¡Hola! Confirmo asistencia a ${comunion} con ${personas}.${firma}`;
}

/** Para cuando ya cerró el plazo y el invitado igual necesita mover algo. */
export function lateChangeMessage(name: string) {
  return (
    `¡Hola! Necesito cambiar mi respuesta para la Primera Comunión de ` +
    `${EVENT.child}. ¿Todavía estoy a tiempo? — ${name}`
  );
}

export function waLink(phone: string, text: string) {
  const digits = normalizePhone(phone);
  const query = `?text=${encodeURIComponent(text)}`;
  return digits ? `https://wa.me/${digits}${query}` : `https://wa.me/${query}`;
}
