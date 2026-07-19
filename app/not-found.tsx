import Link from "next/link";
import Flor from "@/components/Flor";
import Divider from "@/components/invitation/Divider";
import { EVENT } from "@/lib/event";

export default function NotFound() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[radial-gradient(120%_60%_at_50%_0%,#f7ece6_0%,#efe2da_55%,#e7d5cb_100%)] px-6 py-10">
      <div className="relative w-full max-w-[452px] overflow-hidden rounded-[28px] bg-cream px-[30px] py-16 text-center shadow-[0_30px_80px_-30px_rgba(120,74,58,.35)]">
        <div className="animate-floaty absolute -top-[34px] -left-[46px] h-[158px] w-[158px] opacity-96">
          <Flor variant="a" />
        </div>
        <div className="animate-floaty-b absolute -top-[42px] -right-[50px] h-[172px] w-[172px] opacity-96">
          <Flor variant="b" />
        </div>

        <div className="relative pt-16">
          <div className="font-script text-[64px] leading-none text-rose">
            {EVENT.child}
          </div>

          <Divider className="mt-[18px] mb-6" />

          <h1 className="font-serif text-[26px] font-semibold text-cocoa">
            No encontramos esa invitación
          </h1>
          <p className="mx-auto mt-3 max-w-[300px] text-[14px] leading-[1.65] text-taupe">
            Puede que la liga esté incompleta. Revisa el mensaje de WhatsApp que
            te enviamos y ábrela de nuevo desde ahí.
          </p>

          <Link
            href="/"
            className="mt-7 inline-block rounded-full border border-clay/50 px-[22px] py-[9px] text-[12px] tracking-[.14em] text-clay uppercase no-underline"
          >
            Ver la invitación
          </Link>
        </div>
      </div>
    </main>
  );
}
