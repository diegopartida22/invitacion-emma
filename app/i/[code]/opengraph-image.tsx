import { OG_ALT, OG_SIZE, ogImage } from "@/lib/og";
import { publicClient } from "@/lib/supabase/public";

export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = "image/png";

type Props = { params: Promise<{ code: string }> };

/**
 * Solo el nombre, para el saludo. Si el código no existe la imagen se genera
 * igual, sin personalizar: un preview roto se ve peor que uno genérico.
 */
async function guestName(code: string) {
  try {
    const { data } = await publicClient().rpc("get_invitation", { p_code: code });
    return data?.[0]?.display_name || null;
  } catch {
    return null;
  }
}

export default async function Image({ params }: Props) {
  const { code } = await params;
  return ogImage(await guestName(code));
}
