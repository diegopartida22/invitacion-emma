"use client";

import { useState } from "react";
import type { GuestInput } from "@/app/actions/admin";
import type { Guest } from "@/lib/types";

const INPUT =
  "w-full rounded-[10px] border border-gold/50 bg-cream px-3 py-[10px] text-[14px] text-cocoa outline-none";

function MiniStepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  const clamp = (n: number) => Math.max(0, Math.min(30, n));

  return (
    <div className="flex flex-1 items-center justify-between rounded-[10px] border border-gold/40 bg-[#fdf6f2] px-3 py-[7px]">
      <span className="text-[12px] text-taupe">{label}</span>
      <div className="flex items-center gap-[10px]">
        <button
          type="button"
          onClick={() => onChange(clamp(value - 1))}
          aria-label={`Quitar ${label}`}
          className="h-6 w-6 cursor-pointer rounded-full border border-clay/50 bg-white text-clay"
        >
          −
        </button>
        <span className="min-w-[14px] text-center font-semibold text-cocoa">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(clamp(value + 1))}
          aria-label={`Agregar ${label}`}
          className="h-6 w-6 cursor-pointer rounded-full border border-clay/50 bg-white text-clay"
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function GuestForm({
  title,
  guest,
  pending,
  error,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  title: string;
  guest?: Guest;
  pending: boolean;
  error: string | null;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (input: GuestInput) => void;
}) {
  const [motherName, setMotherName] = useState(guest?.mother_name ?? "");
  const [childName, setChildName] = useState(guest?.child_name ?? "");
  const [displayName, setDisplayName] = useState(
    guest?.display_name_override ?? "",
  );
  const [phone, setPhone] = useState(guest?.phone ?? "");
  const [adults, setAdults] = useState(guest?.allowed_adults ?? 2);
  const [kids, setKids] = useState(guest?.allowed_kids ?? 0);

  return (
    <div className="rounded-[14px] border border-gold/40 bg-white p-4">
      <div className="mb-3 text-[11px] tracking-[.2em] text-terracotta uppercase">
        {title}
      </div>

      <div className="grid gap-[9px]">
        <input
          value={motherName}
          onChange={(e) => setMotherName(e.target.value)}
          placeholder="Nombre de la mamá"
          className={INPUT}
        />
        <input
          value={childName}
          onChange={(e) => setChildName(e.target.value)}
          placeholder="Nombre del niño/a"
          className={INPUT}
        />
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={`Cómo saludarla (opcional, ej. ${
            motherName.trim().split(" ")[0] || "Faby"
          })`}
          className={INPUT}
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="numeric"
          placeholder="WhatsApp con lada (ej. 523312345678)"
          className={INPUT}
        />
      </div>

      <div className="mt-3 mb-3 flex gap-[9px]">
        <MiniStepper label="Adultos" value={adults} onChange={setAdults} />
        <MiniStepper label="Niños" value={kids} onChange={setKids} />
      </div>

      <p className="mb-3 text-[11px] leading-[1.5] text-stone">
        El nombre de en medio es el que ve la invitada y con el que la saluda el
        WhatsApp. Si lo dejas vacío se usa el de la mamá, y si tampoco hay, el
        del niño/a.
      </p>

      {error && (
        <p role="alert" className="mb-3 text-[12px] text-[#b06a5a]">
          {error}
        </p>
      )}

      <div className="flex gap-[9px]">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 cursor-pointer rounded-full border border-clay/50 bg-white p-[11px] text-[12px] text-terracotta"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            onSubmit({
              motherName,
              childName,
              displayName,
              phone,
              allowedAdults: adults,
              allowedKids: kids,
            })
          }
          className="flex-2 cursor-pointer rounded-full border-none bg-[linear-gradient(135deg,#c08d79,#b07e6a)] p-[11px] text-[12px] tracking-[.1em] text-white uppercase disabled:opacity-60"
        >
          {pending ? "Guardando..." : submitLabel}
        </button>
      </div>
    </div>
  );
}
