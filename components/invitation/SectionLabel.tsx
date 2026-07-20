/**
 * El rotulito que encabeza cada sección ("Mis papás", "Cuenta regresiva",
 * "Confirma tu asistencia"...).
 *
 * Existe porque estaban sueltos: unos a 11px y otros a 12px, con espaciados de
 * .2em, .32em, .4em y .42em, unos en normal y otros en medium. Todos iguales, y
 * lo único que cambia es el color, según sobre qué fondo caen.
 *
 * Los dos colores están medidos contra su fondo. Ninguno baja del 4.5:1 que
 * pide un texto de este tamaño — antes varios andaban en 3:1 y se perdían.
 */
const TONES = {
  /** Sobre cream o sand: las secciones de arriba y de en medio. */
  light: "text-clay",
  /** Sobre el rosa (blush): RSVP y pie. Ahí el clay se pierde. */
  blush: "text-cocoa",
} as const;

export default function SectionLabel({
  tone = "light",
  className = "",
  children,
}: {
  tone?: keyof typeof TONES;
  /** Para el margen que necesite cada sección; el resto no se toca. */
  className?: string;
  children: React.ReactNode;
}) {
  /*
    El espaciado se encoge en pantallas angostas. El rótulo más largo, "Te
    espero con mucha ilusión", mide 318px con el .4em original y en un celular
    de 375px solo hay 315 disponibles: se partía en dos renglones. En vez de
    recortarle el espaciado a todos —que es lo que le da el aire al diseño—
    solo cede lo necesario, y de 390px para arriba se queda en los 4.8px de
    siempre.
  */
  return (
    <div
      className={`text-[12px] font-medium tracking-[clamp(2.2px,3.6vw-9.4px,4.8px)] uppercase ${TONES[tone]} ${className}`}
    >
      {children}
    </div>
  );
}
