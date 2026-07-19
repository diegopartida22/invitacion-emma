"use client";

import { useState, useTransition } from "react";
import { submitRsvp } from "@/app/actions/rsvp";
import { EVENT } from "@/lib/event";
import type { Invitation } from "@/lib/types";
import { confirmationMessage, waLink } from "@/lib/whatsapp";

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

export default function Rsvp({ invitation }: { invitation: Invitation }) {
  const [saved, setSaved] = useState<Invitation>(invitation);
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

  const handleSubmit = () => {
    if (attending === null) return;
    setError(null);

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
  const whatsapp = waLink(
    EVENT.hostPhone,
    confirmationMessage(
      saved,
      savedYes,
      saved.confirmed_adults,
      saved.confirmed_kids,
    ),
  );

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f6e4dc,#f2d3c8)] px-[30px] pt-[46px] pb-[50px] text-center">
      <div className="absolute -top-[30px] left-1/2 h-[120px] w-[200px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(255,255,255,.5),transparent_70%)]" />

      <div className="relative">
        <div className="mb-2 text-[11px] tracking-[.4em] text-terracotta uppercase">
          Confirma tu asistencia
        </div>
        <div className="font-serif text-[15px] text-sienna italic">
          Con cariño para
        </div>
        <div className="mt-[2px] mb-5 font-serif text-[27px] leading-[1.2] font-semibold text-cocoa">
          {invitation.display_name}
        </div>

        {!submitted ? (
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
                onClick={() => setAttending(true)}
                className={attending === true ? PILL_ACTIVE : PILL_IDLE}
              >
                Sí, ahí estaré
              </button>
              <button
                type="button"
                onClick={() => setAttending(false)}
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

            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-block rounded-full bg-cocoa px-[26px] py-[13px] text-[12px] tracking-[.16em] text-white uppercase no-underline hover:text-white"
            >
              Avisar por WhatsApp
            </a>

            <div className="mt-[14px]">
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="cursor-pointer border-none bg-transparent text-[12px] text-terracotta underline"
              >
                Modificar mi respuesta
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
