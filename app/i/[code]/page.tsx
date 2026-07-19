import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InvitationCard from "@/components/invitation/InvitationCard";
import { EVENT } from "@/lib/event";
import { publicClient } from "@/lib/supabase/public";
import { toInvitation, type Invitation } from "@/lib/types";

/** Cada invitado debe ver su estado real, nunca una versión cacheada. */
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ code: string }> };

async function getInvitation(code: string): Promise<Invitation | null> {
  const { data, error } = await publicClient().rpc("get_invitation", {
    p_code: code,
  });

  if (error) {
    console.error("get_invitation falló:", error.message);
    return null;
  }

  const row = data?.[0];
  return row ? toInvitation(row) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const invitation = await getInvitation(code);

  const title = invitation
    ? `${invitation.display_name}, estás invitada · Primera Comunión de ${EVENT.child}`
    : `Primera Comunión de ${EVENT.child}`;

  // WhatsApp recorta la descripción como a los 120 caracteres, así que lo
  // importante (fecha y llamado a confirmar) va al principio.
  const description = `${EVENT.dateLabel}. Ábrela para confirmar tu asistencia.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website", locale: "es_MX" },
  };
}

export default async function InvitationPage({ params }: Props) {
  const { code } = await params;
  const invitation = await getInvitation(code);

  if (!invitation) notFound();

  return <InvitationCard invitation={invitation} serverNow={Date.now()} />;
}
