"use server";

import { revalidatePath } from "next/cache";
import { EVENT, rsvpIsClosed } from "@/lib/event";
import { publicClient } from "@/lib/supabase/public";
import { toInvitation, type Invitation } from "@/lib/types";

export type RsvpResult =
  | { ok: true; invitation: Invitation }
  | { ok: false; error: string };

/**
 * Guarda la confirmación de un invitado.
 *
 * Ojo: las Server Functions son alcanzables por POST directo, no solo desde la
 * UI. Por eso toda la validación real vive en el RPC `submit_rsvp` de Postgres:
 * verifica que el código exista y recorta adultos/niños al máximo apartado.
 * Aquí solo saneamos tipos antes de mandarlos.
 */
export async function submitRsvp(input: {
  code: string;
  attending: boolean;
  adults: number;
  kids: number;
  message: string;
}): Promise<RsvpResult> {
  const code = String(input.code ?? "").trim();
  if (!code) return { ok: false, error: "Invitación no encontrada." };

  // A diferencia del tope de lugares, este candado vive aquí y no en Postgres:
  // es una cortesía para que la organizadora cierre cuentas, no una frontera
  // de seguridad, y así la fecha se cambia en lib/event.ts sin una migración.
  if (rsvpIsClosed()) {
    return {
      ok: false,
      error: `Las confirmaciones cerraron el ${EVENT.rsvpDeadlineLabel}. Escríbele a la mamá de ${EVENT.child} para cualquier cambio.`,
    };
  }

  const toCount = (n: unknown) => {
    const parsed = Math.floor(Number(n));
    return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 30) : 0;
  };

  const { data, error } = await publicClient().rpc("submit_rsvp", {
    p_code: code,
    p_status: input.attending ? "yes" : "no",
    p_adults: toCount(input.adults),
    p_kids: toCount(input.kids),
    p_message: String(input.message ?? "").slice(0, 500),
  });

  if (error) {
    console.error("submit_rsvp falló:", error.message);
    return {
      ok: false,
      error: error.message.includes("RSVP_SIN_PERSONAS")
        ? "Dinos cuántos van a venir, aunque sea una persona."
        : "No pudimos guardar tu respuesta. Inténtalo de nuevo.",
    };
  }

  const row = data?.[0];
  if (!row) return { ok: false, error: "Invitación no encontrada." };

  revalidatePath(`/i/${code}`);
  revalidatePath("/admin");

  return { ok: true, invitation: toInvitation(row) };
}
