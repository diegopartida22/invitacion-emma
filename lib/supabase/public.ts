import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Cliente con la llave publicable.
 *
 * Las tablas tienen RLS activo y CERO políticas, así que esta llave no puede
 * leer ni escribir nada directamente. Solo puede ejecutar los dos RPC
 * `security definer` del flujo de invitado (`get_invitation`, `submit_rsvp`),
 * que jamás exponen la lista completa ni los teléfonos.
 */
export function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local",
    );
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
