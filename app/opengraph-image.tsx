import { OG_ALT, OG_SIZE, ogImage } from "@/lib/og";

/**
 * Preview de la portada (`emma-comunion.com` a secas). Es la misma imagen que
 * la de los invitados pero sin el "Con cariño para...", que ahí no aplica.
 */
export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return ogImage();
}
