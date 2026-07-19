"use client";

import { useState } from "react";
import { EVENT } from "@/lib/event";
import Divider from "./Divider";

export default function Gift() {
  const [open, setOpen] = useState(false);

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
        ayudará a cumplir un sueño que guardo en el corazón. Lo recibiré con
        mucha gratitud.
      </p>

      <div className="mt-5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="cursor-pointer rounded-full border border-clay/50 bg-transparent px-[22px] py-[9px] text-[12px] tracking-[.14em] text-clay uppercase"
        >
          {open ? "Ocultar datos" : "Ver datos para el sobre"}
        </button>

        {open && (
          <div className="mx-auto mt-[18px] max-w-[320px] rounded-[14px] border border-gold/35 bg-sand px-[22px] py-5 text-left text-[13px] leading-[1.9] text-mocha">
            <div className="mb-2 text-[11px] tracking-[.2em] text-terracotta uppercase">
              Datos para regalo
            </div>
            <div>
              Banco: <strong className="text-cocoa">{EVENT.bank.bank}</strong>
            </div>
            <div>
              Titular:{" "}
              <strong className="text-cocoa">{EVENT.bank.holder}</strong>
            </div>
            <div>
              CLABE: <strong className="text-cocoa">{EVENT.bank.clabe}</strong>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
