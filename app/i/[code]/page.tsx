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

  return {
    title: invitation
      ? `${invitation.display_name} · Primera Comunión de ${EVENT.child}`
      : `Primera Comunión de ${EVENT.child}`,
  };
}

export default async function InvitationPage({ params }: Props) {
  const { code } = await params;
  const invitation = await getInvitation(code);

  if (!invitation) notFound();

  return <InvitationCard invitation={invitation} serverNow={Date.now()} />;
}
