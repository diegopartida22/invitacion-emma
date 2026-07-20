"use client";

import { useState, useTransition } from "react";
import { submitRsvp } from "@/app/actions/rsvp";
import { EVENT } from "@/lib/event";
import type { Invitation } from "@/lib/types";
import {
  confirmationMessage,
  lateChangeMessage,
  waLink,
  type RsvpSnapshot,
} from "@/lib/whatsapp";
import SectionLabel from "./SectionLabel";

const PILL_ACTIVE =
  "flex-1 cursor-pointer rounded-full border-none bg-[linear-gradient(135deg,#c08d79,#b07e6a)] px-2 py-[14px] text-[13px] font-medium text-white shadow-[0_8px_18px_-10px_rgba(176,126,106,.9)]";
const PILL_IDLE =
  "flex-1 cursor-pointer rounded-full border border-clay/50 bg-cream px-2 py-[14px] text-[13px] font-medium text-terracotta";

function Stepper({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (next: number) => void;
}) {
  const clamp = (n: number) => Math.max(0, Math.min(max, n));

  return (
    <div className="flex items-center justify-between rounded-[12px] border border-gold/40 bg-cream px-4 py-3">
      <span className="text-[14px] text-mocha">{label}</span>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => onChange(clamp(value - 1))}
          disabled={value <= 0}
          aria-label={`Quitar un ${label.toLowerCase().replace(/s$/, "")}`}
          className="h-[30px] w-[30px] cursor-pointer rounded-full border border-clay/50 bg-white text-[18px] leading-none text-clay disabled:opacity-40"
        >
          −
        </button>
        <span className="min-w-[20px] text-center font-serif text-[22px] font-semibold text-cocoa">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(clamp(value + 1))}
          disabled={value >= max}
          aria-label={`Agregar un ${label.toLowerCase().replace(/s$/, "")}`}
          className="h-[30px] w-[30px] cursor-pointer rounded-full border border-clay/50 bg-white text-[18px] leading-none text-clay disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function Rsvp({
  invitation,
  closed,
}: {
  invitation: Invitation;
  closed: boolean;
}) {
  const [saved, setSaved] = useState<Invitation>(invitation);

  /**
   * Cómo estaba la respuesta al abrir la página. Se congela con `useState`
   * porque el prop se actualiza al revalidar, y necesitamos el "antes" para
   * poder contarle a la organizadora qué cambió.
   */
  const [initial] = useState<RsvpSnapshot>(() => ({
    status: invitation.status,
    adults: invitation.confirmed_adults,
    kids: invitation.confirmed_kids,
  }));
  const [submitted, setSubmitted] = useState(invitation.status !== "pending");
  const [attending, setAttending] = useState<boolean | null>(
    invitation.status === "pending" ? null : invitation.status === "yes",
  );
  const [adults, setAdults] = useState(
    invitation.status === "yes"
      ? invitation.confirmed_adults
      : invitation.allowed_adults,
  );
  const [kids, setKids] = useState(
    invitation.status === "yes"
      ? invitation.confirmed_kids
      : invitation.allowed_kids,
  );
  const [message, setMessage] = useState(invitation.message ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  /**
   * Al elegir "sí" hay que reponer los lugares si quedaron en cero.
   *
   * Pasa cuando alguien contesta que no puede ir y luego se arrepiente sin
   * recargar: al guardar el "no" los contadores se van a 0, y el formulario
   * los volvía a mostrar así. Confirmaba asistencia para nadie.
   */
  const chooseAttending = (next: boolean) => {
    setAttending(next);
    setError(null);
    if (next && adults + kids === 0) {
      setAdults(invitation.allowed_adults);
      setKids(invitation.allowed_kids);
    }
  };

  const handleSubmit = () => {
    if (attending === null) return;
    setError(null);

    if (attending && adults + kids === 0) {
      setError("Dinos cuántos van a venir, aunque sea una persona.");
      return;
    }

    startTransition(async () => {
      const result = await submitRsvp({
        code: invitation.code,
        attending,
        adults,
        kids,
        message,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSaved(result.invitation);
      setAdults(result.invitation.confirmed_adults);
      setKids(result.invitation.confirmed_kids);
      setSubmitted(true);
    });
  };

  const savedYes = saved.status === "yes";
  const current: RsvpSnapshot = {
    status: saved.status,
    adults: saved.confirmed_adults,
    kids: saved.confirmed_kids,
  };
  const whatsapp = waLink(
    EVENT.hostPhone,
    confirmationMessage(invitation.display_name, initial, current),
  );

  /** Cambió algo respecto a lo que la organizadora ya tenía apuntado. */
  const isChange =
    initial.status !== "pending" &&
    (initial.status !== current.status ||
      initial.adults !== current.adults ||
      initial.kids !== current.kids);

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f6e4dc,#f2d3c8)] px-[30px] pt-[46px] pb-[50px] text-center">
      <div className="absolute -top-[30px] left-1/2 h-[120px] w-[200px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(255,255,255,.5),transparent_70%)]" />

      <div className="relative">
        <SectionLabel tone="blush" className="mb-2">
          {closed ? "Confirmaciones cerradas" : "Confirma tu asistencia"}
        </SectionLabel>
        <div className="font-serif text-[15px] text-sienna italic">
          Con cariño para
        </div>
        <div className="mt-[2px] mb-5 font-serif text-[27px] leading-[1.2] font-semibold text-cocoa">
          {invitation.display_name}
        </div>

        {closed && !submitted ? (
          <div className="rounded-[20px] bg-[rgba(255,255,255,.72)] px-[22px] py-[26px] shadow-[0_12px_30px_-18px_rgba(120,74,58,.4)] backdrop-blur-[4px]">
            <p className="font-serif text-[19px] leading-[1.5] text-cocoa italic">
              Las confirmaciones cerraron el {EVENT.rsvpDeadlineLabel}.
            </p>
            <p className="mt-2 text-[13px] leading-[1.6] text-sienna">
              Si todavía nos quieres acompañar, escríbele directo a la mamá de{" "}
              {EVENT.child} y con gusto lo vemos.
            </p>
            <a
              href={waLink(
                EVENT.hostPhone,
                lateChangeMessage(invitation.display_name),
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-block rounded-full bg-cocoa px-[26px] py-[13px] text-[12px] tracking-[.16em] text-white uppercase no-underline hover:text-white"
            >
              Escribir por WhatsApp
            </a>
          </div>
        ) : !submitted ? (
          <div className="rounded-[20px] bg-[rgba(255,255,255,.72)] px-[22px] py-[26px] text-left shadow-[0_12px_30px_-18px_rgba(120,74,58,.4)] backdrop-blur-[4px]">
            <div className="mb-4 text-center text-[13px] text-sienna">
              Hemos apartado un lugar especial para{" "}
              <strong className="font-semibold text-cocoa">
                {invitation.allowed_adults} adulto(s)
              </strong>{" "}
              y{" "}
              <strong className="font-semibold text-cocoa">
                {invitation.allowed_kids} niño(s)
              </strong>
            </div>

            <div className="mb-5 flex gap-[10px]">
              <button
                type="button"
                onClick={() => chooseAttending(true)}
                className={attending === true ? PILL_ACTIVE : PILL_IDLE}
              >
                Sí, ahí estaré
              </button>
              <button
                type="button"
                onClick={() => chooseAttending(false)}
                className={attending === false ? PILL_ACTIVE : PILL_IDLE}
              >
                No podré ir
              </button>
            </div>

            {attending === true && (
              <div className="mb-[18px] grid gap-3">
                <Stepper
                  label="Adultos"
                  value={adults}
                  max={invitation.allowed_adults}
                  onChange={setAdults}
                />
                <Stepper
                  label="Niños"
                  value={kids}
                  max={invitation.allowed_kids}
                  onChange={setKids}
                />
              </div>
            )}

            {attending !== null && (
              <div>
                <label
                  htmlFor="mensaje"
                  className="mb-[7px] block text-[12px] text-sienna"
                >
                  Déjale un mensajito a {EVENT.child}{" "}
                  <span className="text-[#b39a8e]">(opcional)</span>
                </label>
                <textarea
                  id="mensaje"
                  rows={3}
                  value={message}
                  maxLength={500}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escribe unas palabras bonitas para ella..."
                  className="w-full rounded-[12px] border border-gold/50 bg-cream px-[14px] py-3 text-[14px] text-cocoa outline-none"
                />

                {error && (
                  <p
                    role="alert"
                    className="mt-2 text-[12px] text-[#b06a5a]"
                  >
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={pending}
                  className="mt-4 w-full cursor-pointer rounded-full border-none bg-[linear-gradient(135deg,#c08d79,#b07e6a)] p-[15px] text-[13px] font-medium tracking-[.2em] text-white uppercase shadow-[0_12px_24px_-12px_rgba(176,126,106,.9)] disabled:opacity-60"
                >
                  {pending ? "Enviando..." : "Enviar confirmación"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="animate-bloom rounded-[20px] bg-[rgba(255,255,255,.82)] px-6 py-8 shadow-[0_12px_30px_-18px_rgba(120,74,58,.4)] backdrop-blur-[4px]">
            <div className="mb-[6px] text-[30px] text-rose" aria-hidden="true">
              ❀
            </div>

            {savedYes ? (
              <>
                <div className="font-serif text-[26px] font-semibold text-cocoa">
                  ¡Gracias por confirmar!
                </div>
                <div className="mt-2 text-[14px] leading-[1.5] text-sienna">
                  Te esperamos con{" "}
                  <strong className="text-cocoa">
                    {saved.confirmed_adults} adulto(s)
                  </strong>{" "}
                  y{" "}
                  <strong className="text-cocoa">
                    {saved.confirmed_kids} niño(s)
                  </strong>
                  .<br />
                  {EVENT.child} está feliz de que la acompañes.
                </div>
              </>
            ) : (
              <>
                <div className="font-serif text-[26px] font-semibold text-cocoa">
                  ¡Gracias por avisar!
                </div>
                <div className="mt-2 text-[14px] leading-[1.5] text-sienna">
                  Te vamos a extrañar, pero agradecemos que nos lo hayas hecho
                  saber.
                </div>
              </>
            )}

            {/* Un cambio hay que avisarlo sí o sí: la organizadora ya tenía
                esos lugares contados. Por eso aquí el botón se explica, en
                vez de quedarse como un "avisar" opcional más. */}
            {isChange && (
              <div className="mt-4 rounded-[10px] bg-blush/60 px-4 py-[10px] text-[12px] leading-[1.6] text-sienna">
                Ya guardamos tu cambio. Avísale también a la mamá de{" "}
                {EVENT.child} para que ajuste sus cuentas.
              </div>
            )}

            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-block rounded-full bg-cocoa px-[26px] py-[13px] text-[12px] tracking-[.16em] text-white uppercase no-underline hover:text-white"
            >
              {isChange ? "Avisar del cambio" : "Avisar por WhatsApp"}
            </a>

            <div className="mt-[14px] text-[12px] text-terracotta">
              {closed ? (
                <span className="text-stone">
                  Las confirmaciones cerraron el {EVENT.rsvpDeadlineLabel}. Para
                  cambiar algo, escríbele a la mamá de {EVENT.child}.
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="cursor-pointer border-none bg-transparent text-[12px] text-terracotta underline"
                >
                  Modificar mi respuesta
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
