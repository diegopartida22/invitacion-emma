import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LoginForm from "@/components/admin/LoginForm";
import Divider from "@/components/invitation/Divider";
import { isAuthenticated } from "@/lib/auth";
import { EVENT } from "@/lib/event";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Panel de anfitrión",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  if (await isAuthenticated()) redirect("/admin");

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[radial-gradient(120%_60%_at_50%_0%,#f7ece6_0%,#efe2da_55%,#e7d5cb_100%)] px-6 py-10">
      <div className="w-full max-w-[400px] rounded-[28px] bg-cream px-8 py-12 text-center shadow-[0_30px_80px_-30px_rgba(120,74,58,.35)]">
        <div className="text-[11px] tracking-[.4em] text-clay uppercase">
          Panel de anfitrión
        </div>
        <div className="mt-2 font-script text-[52px] leading-none text-rose">
          {EVENT.child}
        </div>

        <Divider width={40} dot={8} gap={12} className="mt-4" />

        <p className="mx-auto mt-5 max-w-[280px] text-[14px] leading-[1.6] text-taupe">
          Aquí puedes ver cómo van las confirmaciones y enviar las invitaciones.
        </p>

        <LoginForm />
      </div>
    </main>
  );
}
