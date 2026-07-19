import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Cliente con la service role key: ignora RLS y ve todo.
 *
 * `server-only` hace que el build falle si algún componente cliente lo importa
 * por accidente, para que esta llave nunca llegue al navegador.
 */
export function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY en .env.local. " +
        "Cópiala de https://supabase.com/dashboard/project/fhyyydyfmerfnnnfjoge/settings/api-keys",
    );
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function hasAdminCredentials() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
