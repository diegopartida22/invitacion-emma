import { icsFile } from "@/lib/calendar";

/**
 * El archivo sale de `lib/event.ts` y no depende de la petición, así que se
 * puede generar una vez en el build en vez de armarlo en cada descarga.
 */
export const dynamic = "force-static";

export function GET() {
  return new Response(icsFile(), {
    headers: {
      // Este es el que hace que iOS y macOS lo abran en Calendario en vez de
      // dejarlo caer como un archivo de texto cualquiera.
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="primera-comunion-emma.ics"',
    },
  });
}
