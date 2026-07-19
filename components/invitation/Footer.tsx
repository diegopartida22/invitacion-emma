import Flor from "@/components/Flor";
import { EVENT } from "@/lib/event";

export default function Footer() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f2d3c8,#e7c4b6)] px-[30px] pt-11 pb-[54px] text-center">
      {/* El giro y el espejo van adentro: la animación de `transform` del
          contenedor los pisaría si compartieran elemento (ver Hero). */}
      <div className="animate-floaty-b-slow absolute -bottom-[38px] -left-[46px] h-[178px] w-[178px] opacity-92">
        <div className="h-full w-full rotate-180">
          <Flor variant="c" />
        </div>
      </div>
      <div className="animate-floaty-slow absolute -top-[36px] -right-[46px] h-[154px] w-[154px] opacity-90">
        <div className="h-full w-full -scale-x-100 rotate-180">
          <Flor variant="a" />
        </div>
      </div>

      <div className="relative">
        <div className="text-[11px] tracking-[.4em] text-terracotta uppercase">
          Te espero con mucha ilusión
        </div>
        <div className="mt-[10px] font-script text-[64px] leading-none text-[#b0684f]">
          {EVENT.child}
        </div>
        <div className="mt-3 font-serif text-[16px] text-sienna italic">
          {EVENT.dateShort}
        </div>
      </div>
    </section>
  );
}
