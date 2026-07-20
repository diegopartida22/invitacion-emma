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
import type {
  AdminTotals,
  Guest,
  GuestHistory,
  RsvpEntry,
  RsvpStatus,
} from "@/lib/types";
import { inviteMessage, invitationUrl, waLink } from "@/lib/whatsapp";
import GuestForm from "./GuestForm";

type FilterKey = "all" | RsvpStatus | "changed";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "yes", label: "Confirmados" },
  { key: "pending", label: "Pendientes" },
  { key: "no", label: "No asisten" },
  { key: "changed", label: "Cambiaron" },
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

/*
 * La zona horaria va fija. Sin ella, el servidor (que en Vercel corre en UTC)
 * y el navegador formatean distinto la misma fecha y React reclama por
 * hidratación; con hora incluida pasaría siempre, no solo cerca de medianoche.
 */
const TZ = "America/Mexico_City";

const SENT_FORMAT = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  timeZone: TZ,
});

const ANSWERED_FORMAT = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: TZ,
});

/** Una respuesta del historial, en corto: "2 adultos · 1 niño" o "no asisten". */
function entryLabel(entry: RsvpEntry) {
  return entry.status === "yes" ? people(entry.adults, entry.kids) : "no asisten";
}

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
  history,
  baseUrl,
}: {
  guests: Guest[];
  totals: AdminTotals;
  history: GuestHistory;
  baseUrl: string;
}) {
  const [filter, setFilter] = useState<FilterKey>("all");
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

  /** Quiénes contestaron más de una vez: la cuenta que ella tenía ya cambió. */
  const changedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const g of guests) {
      if ((history[g.id]?.length ?? 0) > 1) ids.add(g.id);
    }
    return ids;
  }, [guests, history]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return guests.filter((g) => {
      if (filter === "changed") {
        if (!changedIds.has(g.id)) return false;
      } else if (filter !== "all" && g.status !== filter) return false;
      if (!needle) return true;
      return (
        g.display_name.toLowerCase().includes(needle) ||
        (g.child_name ?? "").toLowerCase().includes(needle) ||
        (g.phone ?? "").includes(needle) ||
        g.code.toLowerCase().includes(needle)
      );
    });
  }, [guests, filter, query, changedIds]);

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
          placeholder="Buscar por nombre o teléfono..."
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
              {f.key === "changed" && changedIds.size > 0 && (
                <span className="ml-[6px] opacity-70">{changedIds.size}</span>
              )}
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
                className="flex flex-col rounded-[14px] border border-gold/30 bg-white px-[16px] py-[14px] transition-shadow hover:shadow-[0_8px_20px_-14px_rgba(120,74,58,.5)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-medium text-cocoa">
                      {guest.display_name}
                    </div>
                    {guest.child_name && guest.mother_name && (
                      <div className="truncate text-[12px] text-stone">
                        mamá de {guest.child_name}
                      </div>
                    )}
                  </div>
                  <div
                    className={`shrink-0 rounded-full px-[10px] py-1 text-[10px] font-medium tracking-[.1em] uppercase ${badge.className}`}
                  >
                    {badge.label}
                  </div>
                </div>

                <div className="mt-[6px] text-[13px] text-taupe">
                  {detailFor(guest)}
                </div>

                {(guest.invite_sent_at ||
                  guest.responded_at ||
                  !guest.phone) && (
                  <div className="mt-[6px] flex flex-wrap items-center gap-x-3 text-[11px]">
                    {guest.invite_sent_at && (
                      <span className="text-stone">
                        ✓ Enviada el{" "}
                        {SENT_FORMAT.format(new Date(guest.invite_sent_at))}
                      </span>
                    )}
                    {guest.responded_at && (
                      <span className="text-stone">
                        Respondió el{" "}
                        {ANSWERED_FORMAT.format(new Date(guest.responded_at))}
                      </span>
                    )}
                    {!guest.phone && (
                      <span className="text-[#b06a5a]">Sin teléfono</span>
                    )}
                  </div>
                )}

                {/* El rastro completo, no solo la última respuesta: si alguien
                    confirmó 4 y luego bajó a 2, esos 2 lugares hay que soltarlos
                    y sin esto no había manera de enterarse. */}
                {changedIds.has(guest.id) && (
                  <div className="mt-[8px] rounded-[8px] bg-[#fdf1ea] px-[10px] py-[7px] text-[11px] leading-[1.6]">
                    <span className="font-medium text-terracotta">
                      Cambió su respuesta
                    </span>
                    <div className="text-taupe">
                      {history[guest.id]!.map(entryLabel).join(" → ")}
                    </div>
                  </div>
                )}

                {guest.message && (
                  <div className="mt-[10px] rounded-[8px] border-l-2 border-rose bg-sand px-3 py-[9px] text-[12px] leading-[1.5] text-mocha italic">
                    “{guest.message}”
                  </div>
                )}

                {/* `mt-auto` alinea la fila de acciones al fondo: en la rejilla
                    de dos columnas las tarjetas tienen distinta altura. */}
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-[12px]">
                  <a
                    href={waLink(guest.phone ?? "", inviteMessage(guest, url))}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => run(() => markInviteSent(guest.id))}
                    className="inline-flex items-center gap-[6px] rounded-full bg-whatsapp px-[14px] py-[7px] text-[12px] font-medium text-white no-underline hover:text-white"
                  >
                    {guest.invite_sent_at ? "Reenviar" : "Enviar invitación"}
                  </a>

                  <MiniAction onClick={() => copyLink(guest)}>
                    {copiedId === guest.id ? "¡Copiada!" : "Copiar liga"}
                  </MiniAction>

                  <MiniAction onClick={() => setEditingId(guest.id)}>
                    Editar
                  </MiniAction>

                  {guest.status !== "pending" && (
                    <MiniAction
                      onClick={() => {
                        // Reabrir borra la respuesta y, con ella, el mensajito
                        // que dejó esa familia. Eliminar sí avisaba; esto no.
                        const warning = guest.message
                          ? `Vas a borrar la respuesta de ${guest.display_name} y también su mensajito para ${EVENT.child}. ¿Seguimos?`
                          : `${guest.display_name} va a poder responder de nuevo. Su respuesta actual se borra. ¿Seguimos?`;
                        if (confirm(warning)) run(() => resetRsvp(guest.id));
                      }}
                    >
                      Reabrir
                    </MiniAction>
                  )}

                  <div className="ml-auto">
                    <MiniAction
                      tone="danger"
                      onClick={() => {
                        if (
                          confirm(
                            `¿Eliminar a ${guest.display_name} de la lista? Esto no se puede deshacer.`,
                          )
                        ) {
                          run(() => deleteGuest(guest.id));
                        }
                      }}
                    >
                      Eliminar
                    </MiniAction>
                  </div>
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
