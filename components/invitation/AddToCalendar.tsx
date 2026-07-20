import { googleCalendarUrl } from "@/lib/calendar";
import SectionLabel from "./SectionLabel";

/**
 * Las dos opciones van a la vista, sin menú que desplegar. Son dos toques
 * menos, no necesita JavaScript, y de todos modos cada quien reconoce la suya
 * de inmediato: nadie tiene que pensar cuál le toca.
 */
const BUTTON =
  "block rounded-full border border-clay/50 px-[20px] py-[11px] text-center text-[12px] tracking-[.12em] text-clay uppercase no-underline";

export default function AddToCalendar() {
  return (
    <div className="text-center">
      <SectionLabel className="mb-[14px]">Que no se te pase</SectionLabel>

      {/* Uno debajo del otro y del mismo ancho. Lado a lado no caben en un
          celular sin partir "Google Calendar" en dos renglones, y dejarlos
          con anchos distintos se veía descuidado. */}
      <div className="mx-auto grid max-w-[250px] gap-[10px]">
        <a
          href={googleCalendarUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className={BUTTON}
        >
          Google Calendar
        </a>
        {/*
          Sin `download`: en iOS ese atributo hace que Safari lo guarde en
          Archivos en vez de abrirlo en Calendario, que es justo lo contrario
          de lo que queremos. El nombre del archivo lo pone la ruta con su
          cabecera Content-Disposition.
        */}
        <a href="/calendario.ics" className={BUTTON}>
          Apple · Outlook
        </a>
      </div>
    </div>
  );
}
