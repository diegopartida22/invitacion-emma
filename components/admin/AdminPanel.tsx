"use client";

import { useMemo, useState, useTransition } from "react";
import {
  addGuest,
  deleteGuest,
  markInviteSent,
  resetRsvp,
  updateGuest,
  type ActionResult,
  type GuestInput,
} from "@/app/actions/admin";
import { logout } from "@/app/actions/auth";
import { EVENT } from "@/lib/event";
import type { AdminTotals, Guest, RsvpStatus } from "@/lib/types";
import { inviteMessage, invitationUrl, waLink } from "@/lib/whatsapp";
import GuestForm from "./GuestForm";

const FILTERS: { key: "all" | RsvpStatus; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "yes", label: "Confirmados" },
  { key: "pending", label: "Pendientes" },
  { key: "no", label: "No asisten" },
];

const BADGE: Record<RsvpStatus, { className: string; label: string }> = {
  yes: {
    className: "bg-[#dff0e2] text-[#3f7a52]",
    label: "Confirmó",
  },
  no: {
    className: "bg-[#f6e0dc] text-[#b06a5a]",
    label: "No irá",
  },
  pending: {
    className: "bg-[#efe6df] text-stone",
    label: "Pendiente",
  },
};

function Stat({
  value,
  suffix,
  label,
  accent = false,
}: {
  value: number;
  suffix?: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-[12px] border border-gold/35 bg-white px-4 py-[14px]">
      <div
        className={`font-serif text-[32px] leading-none font-semibold ${
          accent ? "text-rose" : "text-cocoa"
        }`}
      >
        {value}
        {suffix && <span className="text-[16px] text-stone">{suffix}</span>}
      </div>
      <div className="mt-1 text-[11px] tracking-[.1em] text-taupe uppercase">
        {label}
      </div>
    </div>
  );
}

/** "2 adultos · 1 niño", sin paréntesis ni plurales torpes. */
function people(adults: number, kids: number) {
  const parts: string[] = [];
  if (adults > 0) parts.push(`${adults} ${adults === 1 ? "adulto" : "adultos"}`);
  if (kids > 0) parts.push(`${kids} ${kids === 1 ? "niño" : "niños"}`);
  return parts.length > 0 ? parts.join(" · ") : "nadie";
}

function detailFor(guest: Guest) {
  if (guest.status === "yes") {
    return `Vienen ${people(guest.confirmed_adults, guest.confirmed_kids)}`;
  }
  if (guest.status === "no") return "No asistirá";
  return `Apartados ${people(guest.allowed_adults, guest.allowed_kids)}`;
}

const SENT_FORMAT = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
});

/** Acción secundaria: texto discreto, sin subrayado, para no competir. */
function MiniAction({
  onClick,
  children,
  tone = "clay",
}: {
  onClick: () => void;
  children: React.ReactNode;
  tone?: "clay" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-full border-none bg-transparent px-2 py-1 text-[12px] transition-colors hover:bg-sand ${
        tone === "danger" ? "text-[#c07a6a]" : "text-clay"
      }`}
    >
      {children}
    </button>
  );
}

export default function AdminPanel({
  guests,
  totals,
  baseUrl,
}: {
  guests: Guest[];
  totals: AdminTotals;
  baseUrl: string;
}) {
  const [filter, setFilter] = useState<"all" | RsvpStatus>("all");
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (action: () => Promise<ActionResult>, onDone?: () => void) => {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onDone?.();
    });
  };

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return guests.filter((g) => {
      if (filter !== "all" && g.status !== filter) return false;
      if (!needle) return true;
      return (
        g.display_name.toLowerCase().includes(needle) ||
        (g.child_name ?? "").toLowerCase().includes(needle) ||
        (g.phone ?? "").includes(needle) ||
        g.code.toLowerCase().includes(needle)
      );
    });
  }, [guests, filter, query]);

  const messages = guests.filter((g) => g.message);

  const copyLink = (guest: Guest) => {
    const url = invitationUrl(guest.code, baseUrl);
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopiedId(guest.id);
    setTimeout(
      () => setCopiedId((current) => (current === guest.id ? null : current)),
      1800,
    );
  };

  return (
    <div className="min-h-screen bg-linen">
      <header className="sticky top-0 z-10 bg-cocoa text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-[22px] py-[18px]">
          <div>
            <div className="text-[10px] tracking-[.3em] uppercase opacity-70">
              Panel de anfitrión
            </div>
            <div className="font-serif text-[22px] font-semibold">
              Confirmaciones · {EVENT.child}
            </div>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="cursor-pointer rounded-full border border-white/30 bg-white/10 px-4 py-2 text-[11px] tracking-[.1em] text-white uppercase"
            >
              Salir
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-[22px] py-5">
        {/* ===== Totales ===== */}
        <div className="mb-[10px] grid grid-cols-2 gap-[10px] lg:grid-cols-4">
          <Stat
            value={totals.confirmed}
            suffix={`/${totals.total}`}
            label="Familias confirmadas"
            accent
          />
          <Stat value={totals.pending} label="Por responder" />
          <Stat value={totals.adults} label="Adultos asistirán" />
          <Stat value={totals.kids} label="Niños asistirán" />
        </div>

        <div className="mb-[22px] rounded-[12px] bg-blush px-4 py-3 text-center">
          <span className="text-[12px] text-sienna">Total de asistentes: </span>
          <span className="font-serif text-[22px] font-semibold text-cocoa">
            {totals.totalGuests}
          </span>
          {totals.declined > 0 && (
            <span className="ml-3 text-[12px] text-sienna">
              · {totals.declined} no asistirán
            </span>
          )}
        </div>

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-[10px] bg-[#f6e0dc] px-4 py-3 text-[13px] text-[#b06a5a]"
          >
            {error}
          </p>
        )}

        {/* ===== Alta ===== */}
        {showAdd && (
          <div className="mb-[14px]">
            <GuestForm
              title="Nuevo invitado"
              submitLabel="Agregar"
              pending={pending}
              error={null}
              onCancel={() => setShowAdd(false)}
              onSubmit={(input: GuestInput) =>
                run(
                  () => addGuest(input),
                  () => setShowAdd(false),
                )
              }
            />
          </div>
        )}

        {/* ===== Controles de la lista ===== */}
        <div className="mb-[10px] flex items-center justify-between">
          <div className="text-[11px] tracking-[.2em] text-terracotta uppercase">
            Lista de invitados
          </div>
          <button
            type="button"
            onClick={() => setShowAdd((v) => !v)}
            className="cursor-pointer rounded-full border border-clay/50 bg-transparent px-[14px] py-[5px] text-[12px] text-clay"
          >
            + Agregar
          </button>
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, teléfono o código..."
          className="mb-3 w-full rounded-[10px] border border-gold/40 bg-white px-3 py-[10px] text-[14px] text-cocoa outline-none"
        />

        <div className="mb-3 flex flex-wrap gap-[7px]">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={
                filter === f.key
                  ? "cursor-pointer rounded-full border-none bg-cocoa px-[14px] py-[6px] text-[11px] tracking-[.06em] text-white"
                  : "cursor-pointer rounded-full border border-clay/40 bg-white px-[14px] py-[6px] text-[11px] tracking-[.06em] text-terracotta"
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ===== Invitados ===== */}
        <div className="grid gap-[9px] lg:grid-cols-2">
          {visible.map((guest) => {
            const url = invitationUrl(guest.code, baseUrl);
            const badge = BADGE[guest.status];

            if (editingId === guest.id) {
              return (
                <GuestForm
                  key={guest.id}
                  title={`Editando · ${guest.display_name}`}
                  submitLabel="Guardar"
                  guest={guest}
                  pending={pending}
                  error={null}
                  onCancel={() => setEditingId(null)}
                  onSubmit={(input) =>
                    run(
                      () => updateGuest(guest.id, input),
                      () => setEditingId(null),
                    )
                  }
                />
              );
            }

            return (
              <div
                key={guest.id}
                className="rounded-[12px] border border-gold/30 bg-white px-[15px] py-[13px]"
              >
                <div className="flex items-center justify-between gap-[10px]">
                  <div className="text-[14px] font-medium text-cocoa">
                    {guest.display_name}
                  </div>
                  <div
                    className={`rounded-full px-[10px] py-1 text-[10px] font-medium tracking-[.1em] uppercase ${badge.className}`}
                  >
                    {badge.label}
                  </div>
                </div>

                <div className="mt-1 text-[12px] text-taupe">
                  {detailFor(guest)}
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-x-3 text-[11px] text-stone">
                  <span>{guest.code}</span>
                  {guest.child_name && guest.mother_name && (
                    <span>· niño/a: {guest.child_name}</span>
                  )}
                  {!guest.phone && (
                    <span className="text-[#b06a5a]">· sin teléfono</span>
                  )}
                  {guest.invite_sent_at && <span>· invitación enviada</span>}
                </div>

                {guest.message && (
                  <div className="mt-2 rounded-[6px] border-l-2 border-rose bg-sand px-3 py-[9px] text-[12px] leading-[1.5] text-mocha italic">
                    “{guest.message}”
                  </div>
                )}

                <div className="mt-[11px] flex flex-wrap items-center gap-x-[14px] gap-y-2">
                  <a
                    href={waLink(guest.phone ?? "", inviteMessage(guest, url))}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => run(() => markInviteSent(guest.id))}
                    className="inline-flex items-center gap-[6px] rounded-full bg-whatsapp px-[14px] py-[7px] text-[12px] font-medium text-white no-underline hover:text-white"
                  >
                    Enviar invitación
                  </a>

                  <button
                    type="button"
                    onClick={() => copyLink(guest)}
                    className="cursor-pointer border-none bg-transparent p-0 text-[11px] text-clay underline"
                  >
                    {copiedId === guest.id ? "¡Liga copiada!" : "Copiar liga"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingId(guest.id)}
                    className="cursor-pointer border-none bg-transparent p-0 text-[11px] text-clay underline"
                  >
                    Editar
                  </button>

                  {guest.status !== "pending" && (
                    <button
                      type="button"
                      onClick={() => run(() => resetRsvp(guest.id))}
                      className="cursor-pointer border-none bg-transparent p-0 text-[11px] text-clay underline"
                    >
                      Reabrir
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm(
                          `¿Eliminar a ${guest.display_name} de la lista? Esto no se puede deshacer.`,
                        )
                      ) {
                        run(() => deleteGuest(guest.id));
                      }
                    }}
                    className="ml-auto cursor-pointer border-none bg-transparent p-0 text-[11px] text-[#c07a6a] underline"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}

          {visible.length === 0 && (
            <div className="p-6 text-center text-[13px] text-stone italic lg:col-span-2">
              {guests.length === 0
                ? "Todavía no hay invitados. Agrégalos aquí o corre el script de importación."
                : "Ningún invitado con ese filtro."}
            </div>
          )}
        </div>

        {/* ===== Mensajitos ===== */}
        {messages.length > 0 && (
          <div className="mt-6">
            <div className="mb-[10px] text-[11px] tracking-[.2em] text-terracotta uppercase">
              Mensajitos para {EVENT.child}
            </div>
            <div className="grid gap-[9px] lg:grid-cols-2">
              {messages.map((guest) => (
                <div
                  key={guest.id}
                  className="rounded-[12px] border border-gold/30 bg-white px-[15px] py-[13px]"
                >
                  <div className="font-serif text-[15px] leading-[1.5] text-cocoa italic">
                    “{guest.message}”
                  </div>
                  <div className="mt-[6px] text-[11px] text-stone">
                    — {guest.display_name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 rounded-[12px] bg-sand p-[14px] text-center text-[11px] leading-[1.7] text-stone">
          Cada invitado abre su liga <strong className="text-taupe">/i/código</strong>{" "}
          y su respuesta se guarda en Supabase.{" "}
          <strong className="text-taupe">Enviar invitación</strong> abre WhatsApp
          con el mensaje y la liga de esa persona.
        </div>
      </div>
    </div>
  );
}
