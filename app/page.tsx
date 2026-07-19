import InvitationCard from "@/components/invitation/InvitationCard";

/**
 * Vista general, sin invitado. Sirve para revisar el diseño y como respaldo
 * si alguien entra al dominio pelón en vez de a su liga personalizada.
 */
export const dynamic = "force-dynamic";

export default function HomePage() {
  return <InvitationCard invitation={null} serverNow={Date.now()} />;
}
