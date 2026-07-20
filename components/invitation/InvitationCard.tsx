import { rsvpIsClosed } from "@/lib/event";
import type { Invitation } from "@/lib/types";
import Countdown from "./Countdown";
import Events from "./Events";
import Family from "./Family";
import Footer from "./Footer";
import Gift from "./Gift";
import Greeting from "./Greeting";
import Hero from "./Hero";
import Rsvp from "./Rsvp";

/**
 * La tarjeta completa.
 *
 * En móvil mide 452px de ancho y va a sangre, exactamente como el diseño.
 * A partir de `sm` se despega del borde y se redondea para que en escritorio
 * se lea como una tarjeta sobre el fondo, en vez de una tira pegada arriba.
 */
export default function InvitationCard({
  invitation,
  serverNow,
}: {
  invitation: Invitation | null;
  serverNow: number;
}) {
  return (
    <main className="flex min-h-screen w-full justify-center bg-[radial-gradient(120%_60%_at_50%_0%,#f7ece6_0%,#efe2da_55%,#e7d5cb_100%)] sm:bg-[radial-gradient(900px_560px_at_50%_0%,#f7ece6_0%,#efe2da_55%,#e7d5cb_100%)] sm:py-10">
      <div className="relative w-full max-w-[452px] overflow-hidden bg-cream shadow-[0_30px_80px_-30px_rgba(120,74,58,.35)] sm:rounded-[28px]">
        <Hero />
        <Greeting />
        <Family />
        <Countdown serverNow={serverNow} />
        <Events />

        {invitation ? (
          /* El plazo se evalúa con la hora del servidor, no la del celular
             del invitado: un reloj mal puesto no debe abrir ni cerrar nada. */
          <Rsvp invitation={invitation} closed={rsvpIsClosed(serverNow)} />
        ) : (
          <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f6e4dc,#f2d3c8)] px-[30px] pt-[46px] pb-[50px] text-center">
            <div className="absolute -top-[30px] left-1/2 h-[120px] w-[200px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(255,255,255,.5),transparent_70%)]" />
            <div className="relative">
              <div className="mb-2 text-[11px] tracking-[.4em] text-terracotta uppercase">
                Confirma tu asistencia
              </div>
              <div className="rounded-[20px] bg-[rgba(255,255,255,.72)] px-[22px] py-[26px] shadow-[0_12px_30px_-18px_rgba(120,74,58,.4)] backdrop-blur-[4px]">
                <p className="font-serif text-[19px] leading-[1.5] text-cocoa italic">
                  Abre la liga personalizada que te enviamos por WhatsApp para
                  confirmar tu asistencia.
                </p>
              </div>
            </div>
          </section>
        )}

        <Gift />
        <Footer />
      </div>
    </main>
  );
}
