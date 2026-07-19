import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { adminClient, hasAdminCredentials } from "./supabase/admin";

const COOKIE_NAME = "emma_admin";
const TOKEN_PAYLOAD = "emma-admin-v2";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 días

export const PIN_LENGTH = 4;

/**
 * El token es un HMAC del PIN. No guarda el PIN en la cookie y no se puede
 * falsificar sin conocerlo, que es todo lo que necesita un panel de un solo
 * usuario. La cookie es httpOnly, así que el JS del navegador no la ve.
 */
function expectedToken(pin: string) {
  return createHmac("sha256", pin).update(TOKEN_PAYLOAD).digest("hex");
}

function safeEquals(a: string, b: string) {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

function configuredPin() {
  const pin = process.env.ADMIN_PIN ?? "";
  return new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin) ? pin : null;
}

export function adminPinIsConfigured() {
  return configuredPin() !== null;
}

/**
 * Quién está intentando entrar. Detrás de un proxy (Vercel) el socket siempre
 * es el del proxy, así que la IP real viene en `x-forwarded-for`; nos quedamos
 * con el primer salto, que es el cliente.
 */
async function clientIp() {
  const list = await headers();
  const forwarded = list.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return list.get("x-real-ip") ?? "desconocida";
}

export type SignInResult = { ok: true } | { ok: false; error: string };

/**
 * Un PIN de 4 dígitos son 10,000 combinaciones, y las Server Actions se pueden
 * invocar por POST directo sin pasar por la pantalla de login. Sin freno se
 * adivina en menos de un minuto, así que cada intento pasa por el contador de
 * Postgres antes de comparar nada.
 */
export async function signIn(attempt: string): Promise<SignInResult> {
  const pin = configuredPin();
  if (!pin) {
    return {
      ok: false,
      error: `Falta definir ADMIN_PIN (${PIN_LENGTH} dígitos) en .env.local.`,
    };
  }
  if (!hasAdminCredentials()) {
    return { ok: false, error: "Falta SUPABASE_SERVICE_ROLE_KEY en .env.local." };
  }

  const matches = safeEquals(attempt, pin);

  const { data, error } = await adminClient().rpc("register_login_attempt", {
    p_ip: await clientIp(),
    p_ok: matches,
  });

  // Si el contador no responde, no podemos saber si alguien está probando a
  // ciegas: no dejamos pasar. El panel tampoco serviría, porque los invitados
  // viven en esa misma base.
  if (error) {
    console.error("register_login_attempt falló:", error.message);
    return {
      ok: false,
      error: "No pudimos validar el acceso. Inténtalo en un momento.",
    };
  }

  const verdict = data?.[0];
  if (verdict && !verdict.allowed) {
    const minutes = Math.max(1, Math.ceil((verdict.retry_after_seconds ?? 0) / 60));
    return {
      ok: false,
      error: `Demasiados intentos. Vuelve a probar en ${minutes} minuto(s).`,
    };
  }

  if (!matches) return { ok: false, error: "PIN incorrecto." };

  (await cookies()).set(COOKIE_NAME, expectedToken(pin), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
  return { ok: true };
}

export async function isAuthenticated() {
  const pin = configuredPin();
  if (!pin) return false;

  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return false;

  return safeEquals(token, expectedToken(pin));
}

export async function signOut() {
  (await cookies()).delete(COOKIE_NAME);
}

/**
 * Guardia para Server Actions. Las Server Actions se pueden invocar por POST
 * directo sin pasar por la UI, así que cada acción del panel tiene que llamar
 * esto por su cuenta: el layout de /admin no las protege.
 */
export async function requireAdmin() {
  if (!(await isAuthenticated())) {
    throw new Error("No autorizado.");
  }
}
