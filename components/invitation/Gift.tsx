"use client";

import { useState } from "react";
import { EVENT } from "@/lib/event";
import Divider from "./Divider";
import SectionLabel from "./SectionLabel";

/** La CLABE sin espacios, que es como la pide el banco al pegarla. */
const CLABE_PLAIN = EVENT.bank.clabe.replace(/\s/g, "");

export default function Gift() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CLABE_PLAIN);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permiso de portapapeles (o navegador viejo) no pasa nada: la
      // CLABE está ahí a la vista para copiarla a mano.
    }
  };

  return (
    <section className="bg-cream px-[34px] pt-12 pb-[46px] text-center">
      <Divider width={34} dot={8} gap={12} className="mb-[18px]" />

      <div className="mx-auto max-w-[320px] font-serif text-[25px] leading-[1.4] text-cocoa italic">
        Tu presencia es mi
        <br />
        mejor regalo
      </div>

      <p className="mx-auto mt-4 max-w-[310px] text-[14px] leading-[1.65] text-taupe">
        Si además deseas tener un detalle conmigo, un sobre con cariño me
        ayudará a cumplir un sueño que guardo en el corazón. Puedes entregarlo
        el día del evento o hacerlo por transferencia, como te sea más cómodo.
        Lo recibiré con mucha gratitud.
      </p>

      <div className="mt-5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="cursor-pointer rounded-full border border-clay/50 bg-transparent px-[22px] py-[9px] text-[12px] tracking-[.14em] text-clay uppercase"
        >
          {open ? "Ocultar datos" : "Datos para transferencia"}
        </button>

        {open && (
          <div className="mx-auto mt-[18px] max-w-[320px] rounded-[14px] border border-gold/35 bg-sand px-[22px] py-5 text-left text-[13px] leading-[1.9] text-mocha">
            {/* "Datos para transferencia" no cabe en un renglón dentro de la
                tarjeta con el espaciado del rótulo; el botón de arriba ya dijo
                de qué se trata. */}
            <SectionLabel className="mb-2">Datos bancarios</SectionLabel>
            <div>
              Banco: <strong className="text-cocoa">{EVENT.bank.bank}</strong>
            </div>
            <div>
              Titular:{" "}
              <strong className="text-cocoa">{EVENT.bank.holder}</strong>
            </div>
            <div>
              CLABE:{" "}
              <strong className="text-cocoa tabular-nums">
                {EVENT.bank.clabe}
              </strong>
            </div>

            {/* Son 18 dígitos: teclearlos a mano en un celular es justo donde
                la gente se equivoca y abandona. */}
            <button
              type="button"
              onClick={copy}
              className="mt-3 w-full cursor-pointer rounded-full border border-clay/50 bg-cream px-4 py-[9px] text-center text-[12px] tracking-[.14em] text-clay uppercase"
            >
              {copied ? "CLABE copiada ✓" : "Copiar CLABE"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
