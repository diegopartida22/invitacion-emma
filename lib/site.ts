import { headers } from "next/headers";

/**
 * URL base para armar las ligas de cada invitado.
 * Define NEXT_PUBLIC_SITE_URL en producción; si no, se deduce del request.
 */
export async function siteUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");

  return `${proto}://${host}`;
}

/**
 * Igual que `siteUrl()` pero sin leer headers, para `metadataBase`, que se
 * evalúa fuera del request. Sin esto, Next arma las URLs de las imágenes OG
 * contra `localhost` y WhatsApp no puede descargarlas.
 */
export function staticSiteUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return new URL(fromEnv.replace(/\/$/, ""));

  // Vercel la inyecta sola en cada deploy (preview incluido).
  if (process.env.VERCEL_URL) return new URL(`https://${process.env.VERCEL_URL}`);

  return new URL("http://localhost:3000");
}
