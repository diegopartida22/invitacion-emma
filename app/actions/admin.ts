"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { adminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/whatsapp";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type GuestInput = {
  motherName: string;
  childName: string;
  phone: string;
  allowedAdults: number;
  allowedKids: number;
};

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function toCount(value: unknown) {
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(30, parsed));
}

type GuestColumns = {
  mother_name: string | null;
  child_name: string | null;
  phone: string | null;
  allowed_adults: number;
  allowed_kids: number;
};

type Normalized = { error: string } | { values: GuestColumns };

function normalize(input: GuestInput): Normalized {
  const motherName = clean(input.motherName);
  const childName = clean(input.childName);

  if (!motherName && !childName) {
    return { error: "Necesitas al menos el nombre de la mamá o del niño/a." };
  }

  return {
    values: {
      mother_name: motherName || null,
      child_name: childName || null,
      phone: normalizePhone(input.phone) || null,
      allowed_adults: toCount(input.allowedAdults),
      allowed_kids: toCount(input.allowedKids),
    },
  };
}

function refresh() {
  revalidatePath("/admin");
}

export async function addGuest(input: GuestInput): Promise<ActionResult> {
  await requireAdmin();

  const parsed = normalize(input);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  // `code` lo genera el default de la tabla (gen_guest_code()).
  const { error } = await adminClient().from("guests").insert(parsed.values);

  if (error) {
    console.error("addGuest falló:", error.message);
    return { ok: false, error: "No se pudo agregar el invitado." };
  }

  refresh();
  return { ok: true };
}

export async function updateGuest(
  id: string,
  input: GuestInput,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = normalize(input);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  const { error } = await adminClient()
    .from("guests")
    .update(parsed.values)
    .eq("id", id);

  if (error) {
    console.error("updateGuest falló:", error.message);
    // El check `confirmed <= allowed` puede bloquear una bajada de lugares.
    return {
      ok: false,
      error: error.message.includes("guests_confirmed_within_allowed")
        ? "Ese invitado ya confirmó más lugares de los que le quieres dejar. Baja primero su confirmación."
        : "No se pudo guardar el cambio.",
    };
  }

  refresh();
  return { ok: true };
}

export async function deleteGuest(id: string): Promise<ActionResult> {
  await requireAdmin();

  const { error } = await adminClient().from("guests").delete().eq("id", id);

  if (error) {
    console.error("deleteGuest falló:", error.message);
    return { ok: false, error: "No se pudo eliminar el invitado." };
  }

  refresh();
  return { ok: true };
}

/** Marca que ya se le mandó la invitación por WhatsApp. */
export async function markInviteSent(id: string): Promise<ActionResult> {
  await requireAdmin();

  const { error } = await adminClient()
    .from("guests")
    .update({ invite_sent_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("markInviteSent falló:", error.message);
    return { ok: false, error: "No se pudo marcar como enviada." };
  }

  refresh();
  return { ok: true };
}

/** Regresa a un invitado a "pendiente" para que pueda contestar de nuevo. */
export async function resetRsvp(id: string): Promise<ActionResult> {
  await requireAdmin();

  const { error } = await adminClient()
    .from("guests")
    .update({
      status: "pending",
      confirmed_adults: 0,
      confirmed_kids: 0,
      message: null,
      responded_at: null,
    })
    .eq("id", id);

  if (error) {
    console.error("resetRsvp falló:", error.message);
    return { ok: false, error: "No se pudo reiniciar la respuesta." };
  }

  refresh();
  return { ok: true };
}
