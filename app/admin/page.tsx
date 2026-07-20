import type { Metadata } from "next";
import AdminPanel from "@/components/admin/AdminPanel";
import { adminClient, hasAdminCredentials } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/site";
import {
  toGuest,
  toRsvpStatus,
  type AdminTotals,
  type Guest,
  type GuestHistory,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Panel de anfitrión",
  robots: { index: false, follow: false },
};

function totalsFrom(guests: Guest[]): AdminTotals {
  const confirmed = guests.filter((g) => g.status === "yes");

  const adults = confirmed.reduce((sum, g) => sum + g.confirmed_adults, 0);
  const kids = confirmed.reduce((sum, g) => sum + g.confirmed_kids, 0);

  return {
    total: guests.length,
    confirmed: confirmed.length,
    declined: guests.filter((g) => g.status === "no").length,
    pending: guests.filter((g) => g.status === "pending").length,
    adults,
    kids,
    totalGuests: adults + kids,
  };
}

function SetupNotice({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-linen px-6">
      <div className="max-w-md rounded-[16px] border border-gold/40 bg-white p-8 text-center">
        <div className="font-serif text-[22px] font-semibold text-cocoa">
          Falta un paso de configuración
        </div>
        <div className="mt-3 text-[14px] leading-[1.6] text-taupe">
          {children}
        </div>
      </div>
    </main>
  );
}

export default async function AdminPage() {
  if (!hasAdminCredentials()) {
    return (
      <SetupNotice>
        Agrega <strong className="text-cocoa">SUPABASE_SERVICE_ROLE_KEY</strong>{" "}
        a tu archivo <strong className="text-cocoa">.env.local</strong> y
        reinicia el servidor. La encuentras en el dashboard de Supabase, en
        Project Settings → API Keys.
      </SetupNotice>
    );
  }

  const { data, error } = await adminClient()
    .from("guests")
    .select("*")
    .order("display_name", { ascending: true });

  if (error) {
    return (
      <SetupNotice>
        No pudimos leer la lista de invitados: {error.message}
      </SetupNotice>
    );
  }

  const guests = (data ?? []).map(toGuest);

  return (
    <AdminPanel
      guests={guests}
      totals={totalsFrom(guests)}
      history={await historyFrom(guests)}
      baseUrl={await siteUrl()}
    />
  );
}

/**
 * Todas las respuestas que ha dado cada familia, en orden.
 *
 * Solo importan las que tienen más de una: son las que cambiaron de opinión
 * después de que la organizadora ya las había contado. Si la consulta falla,
 * el panel se muestra sin historial en vez de no mostrarse.
 */
async function historyFrom(guests: Guest[]): Promise<GuestHistory> {
  if (guests.length === 0) return {};

  const { data, error } = await adminClient()
    .from("rsvp_log")
    .select("guest_id, status, adults, kids, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("No se pudo leer rsvp_log:", error.message);
    return {};
  }

  const history: GuestHistory = {};
  for (const row of data ?? []) {
    if (!row.guest_id) continue;
    (history[row.guest_id] ??= []).push({
      status: toRsvpStatus(row.status),
      adults: row.adults ?? 0,
      kids: row.kids ?? 0,
      at: row.created_at,
    });
  }
  return history;
}
