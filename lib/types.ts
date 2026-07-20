import type { GuestRow, InvitationRow } from "./supabase/database.types";

export type RsvpStatus = "pending" | "yes" | "no";

/**
 * Lo que ve el invitado. Sale del RPC `get_invitation`, que nunca devuelve
 * teléfono ni datos de nadie más.
 */
export type Invitation = Omit<InvitationRow, "status" | "message"> & {
  status: RsvpStatus;
  message: string | null;
};

/** Fila completa. Solo se lee desde el panel, con la service role key. */
export type Guest = Omit<GuestRow, "status" | "display_name"> & {
  status: RsvpStatus;
  display_name: string;
};

/**
 * Una respuesta del historial (`rsvp_log`). La tabla se llenaba desde el
 * principio pero nadie la leía: es lo que permite ver que una familia
 * confirmó 4 lugares y luego los bajó a 2.
 */
export type RsvpEntry = {
  status: RsvpStatus;
  adults: number;
  kids: number;
  at: string;
};

/** Historial por invitado, de la respuesta más vieja a la más nueva. */
export type GuestHistory = Record<string, RsvpEntry[]>;

export type AdminTotals = {
  total: number;
  confirmed: number;
  declined: number;
  pending: number;
  adults: number;
  kids: number;
  totalGuests: number;
};

/**
 * Postgres tipa `status` como text (el CHECK no llega a TypeScript), así que
 * lo estrechamos aquí en la frontera entre la base y la app.
 */
export function toRsvpStatus(value: string): RsvpStatus {
  return value === "yes" || value === "no" ? value : "pending";
}

export function toInvitation(row: InvitationRow): Invitation {
  return {
    ...row,
    status: toRsvpStatus(row.status),
    message: row.message || null,
  };
}

export function toGuest(row: GuestRow): Guest {
  return {
    ...row,
    status: toRsvpStatus(row.status),
    // `display_name` es una columna generada: nunca es null en la práctica,
    // pero el tipo generado no lo sabe.
    display_name:
      row.display_name || row.mother_name || row.child_name || "Invitado",
  };
}
