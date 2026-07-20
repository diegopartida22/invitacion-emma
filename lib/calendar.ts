/**
 * El evento para el calendario del invitado, en los dos formatos que hacen
 * falta: un archivo `.ics` (Apple, Outlook, y cualquier otro) y una liga de
 * Google Calendar.
 *
 * Va como **un solo evento** que abarca de la misa al final de la recepción,
 * no como dos. En un `.ics` sí caben dos eventos, pero la liga de Google
 * Calendar solo admite uno, y tener a Apple agregando dos entradas y a Google
 * una sola es peor que la imprecisión: quien guarda esto quiere apartar el día.
 * Los horarios y las direcciones de la misa y la recepción van completos en la
 * descripción, que es donde el invitado los va a buscar el día del evento.
 */

import { EVENT } from "./event";

const TITLE = `Primera Comunión de ${EVENT.child}`;

/**
 * Identificador del evento. Tiene que ser estable: si cambiara entre una
 * descarga y otra, a quien la guarde dos veces le aparecería duplicada en vez
 * de actualizarse.
 */
const UID = "primera-comunion-emma-2026-09-12@emma-comunion.com";

/**
 * Cuándo se "creó" el evento. Deliberadamente fijo y no `Date.now()`: así el
 * archivo sale igual byte por byte en cada build y se puede cachear.
 */
const DTSTAMP = "20260101T000000Z";

/** Al formato de iCalendar, siempre en UTC: 20260912T180000Z */
function stamp(iso: string) {
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/** Junta las líneas de una dirección: ["Calle 1", "Col. X"] → "Calle 1, Col. X" */
function address(lines: readonly string[]) {
  return lines.join(", ");
}

function place(info: typeof EVENT.mass | typeof EVENT.reception) {
  const venue = info.venueNote ? `${info.venue} ${info.venueNote}` : info.venue;
  return `${venue}, ${address(info.address)}`;
}

const LOCATION = place(EVENT.mass);

const DESCRIPTION = [
  `Santa Misa · ${EVENT.mass.time}`,
  place(EVENT.mass),
  EVENT.mass.maps,
  "",
  `Recepción · ${EVENT.reception.time}`,
  place(EVENT.reception),
  EVENT.reception.maps,
].join("\n");

/**
 * Escapa un valor de texto de iCalendar. El orden importa: la diagonal
 * invertida va primero, si no se re-escaparían las que acabamos de meter.
 */
function escape(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * Parte las líneas de más de 75 octetos, como pide el RFC 5545: la
 * continuación va en un renglón nuevo que empieza con un espacio.
 *
 * Cuenta octetos y no caracteres, y avanza por code points en vez de por
 * índice, porque los acentos de "Recepción" y "Comunión" pesan dos bytes en
 * UTF-8 y partir uno a la mitad rompería el archivo.
 */
function fold(line: string) {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;

  const parts: string[] = [];
  let current = "";
  let bytes = 0;
  // El primer renglón usa los 75; los siguientes gastan uno en el espacio.
  let limit = 75;

  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > limit) {
      parts.push(current);
      current = "";
      bytes = 0;
      limit = 74;
    }
    current += char;
    bytes += size;
  }
  parts.push(current);

  return parts.join("\r\n ");
}

/** El archivo `.ics` completo. Las líneas van con CRLF porque el RFC lo exige. */
export function icsFile() {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//emma-comunion.com//Invitacion//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${UID}`,
    `DTSTAMP:${DTSTAMP}`,
    `DTSTART:${stamp(EVENT.dateISO)}`,
    `DTEND:${stamp(EVENT.endISO)}`,
    `SUMMARY:${escape(TITLE)}`,
    `LOCATION:${escape(LOCATION)}`,
    `DESCRIPTION:${escape(DESCRIPTION)}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escape(TITLE)}`,
    // Un recordatorio el día anterior. Uno solo: más se siente insistente.
    "TRIGGER:-P1D",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .map(fold)
    .join("\r\n")
    .concat("\r\n");
}

/** La liga que abre Google Calendar con el evento ya lleno. */
export function googleCalendarUrl() {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: TITLE,
    dates: `${stamp(EVENT.dateISO)}/${stamp(EVENT.endISO)}`,
    details: DESCRIPTION,
    location: LOCATION,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}
