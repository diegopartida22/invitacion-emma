/**
 * Todos los datos del evento viven aquí.
 * Es el único archivo que necesitas tocar para cambiar textos, horarios,
 * direcciones o los datos bancarios.
 */

const mapsUrl = (query: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

export const EVENT = {
  child: "Emma",

  /** Fecha y hora de la misa, con offset de CDMX/Guadalajara. */
  dateISO: "2026-09-12T12:00:00-06:00",
  dateLabel: "Sábado 12 de Septiembre, 2026",
  dateShort: "12 · 09 · 2026",

  parents: ["Teresa Partida", "Luis Enrique Gutiérrez"],
  godmothers: ["Araceli Partida", "Karla Maya"],

  mass: {
    symbol: "✝",
    title: "Santa Misa",
    time: "12:00 pm",
    venue: "Parroquia Nuestra Señora de la Salud",
    venueNote: "(Capilla)",
    address: ["Paseo Lomas Altas No. 265", "Col. Lomas del Valle"],
    maps: mapsUrl(
      "Parroquia Nuestra Señora de la Salud Paseo Lomas Altas 265 Lomas del Valle Zapopan",
    ),
  },

  reception: {
    symbol: "❀",
    title: "Recepción",
    time: "3:00 pm",
    venue: "Terraza Jardines de Bambú",
    venueNote: "",
    address: ["Periférico Pte. No. 2100", "Col. Paseos del Sol"],
    maps: mapsUrl(
      "Terraza Jardines de Bambú Periférico Poniente 2100 Paseos del Sol Zapopan",
    ),
  },

  /** WhatsApp de la mamá que organiza — recibe los avisos de confirmación. */
  hostPhone: "523323399353",

  /** TODO: sustituir por los datos reales antes de enviar invitaciones. */
  bank: {
    bank: "____________",
    holder: "Teresa Partida",
    clabe: "____ ____ ____ ____ __",
  },
} as const;

export const EVENT_TARGET_MS = new Date(EVENT.dateISO).getTime();
