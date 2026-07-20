import Flor from "@/components/Flor";
import { EVENT } from "@/lib/event";
import Divider from "./Divider";
import SectionLabel from "./SectionLabel";

export default function Hero() {
  /*
    El `pt-[136px]` sale de una medición, no del gusto: las dos flores de
    arriba bajan hasta los 129px, y con el pt-16 original (64px) el "Con la
    bendición de Dios" caía justo encima de los pétalos. Si mueves o
    redimensionas las flores, esto se vuelve a medir.
  */
  return (
    <section className="relative overflow-hidden px-[30px] pt-[136px] pb-12 text-center">
      {/* Halos de color detrás de las flores */}
      <div className="absolute -top-[90px] -left-[70px] h-[280px] w-[280px] rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(242,211,200,.9),rgba(227,174,155,.35)_55%,transparent_72%)] blur-[6px]" />
      <div className="absolute -top-10 -right-20 h-[230px] w-[230px] rounded-full bg-[radial-gradient(circle_at_60%_40%,rgba(240,220,196,.85),rgba(203,176,142,.25)_55%,transparent_72%)] blur-[6px]" />

      {/*
        El espejo va en un div interno a propósito. Las animaciones `floaty`
        animan `transform`, y una animación le gana a una declaración normal:
        si el `-scale-x-100` viviera en el mismo elemento, el keyframe lo
        borraría y la flor saldría sin voltear.
      */}
      <div className="animate-floaty absolute -top-[34px] -left-[46px] z-1 h-[158px] w-[158px] opacity-96">
        <Flor variant="a" />
      </div>
      <div className="animate-floaty-b absolute -top-[42px] -right-[50px] z-1 h-[172px] w-[172px] opacity-96">
        <div className="h-full w-full -scale-x-100">
          <Flor variant="b" />
        </div>
      </div>

      <div className="animate-fade-up relative z-2">
        <SectionLabel className="mb-[26px]">
          Con la bendición de Dios
        </SectionLabel>
        <div className="font-serif text-[23px] leading-none font-medium text-taupe italic">
          Mi Primera
        </div>
        <div className="mt-[2px] font-serif text-[40px] leading-[1.05] font-semibold tracking-[.16em] text-cocoa uppercase">
          Comunión
        </div>

        <Divider className="mt-[18px] mb-[6px]" />

        <h1 className="mt-[6px] font-script text-[82px] leading-[.9] font-normal text-rose">
          {EVENT.child}
        </h1>

        {/*
          Bastante más grande que en el diseño original (17px), a pedido de
          quien manda las invitaciones: es el dato que la gente busca primero.

          Va con clamp y no con un tamaño fijo porque "Sábado 12 de Septiembre,
          2026" es largo: medido en pantalla, ocupa unos 13.6px de ancho por
          cada px de tipografía. En un celular de 320px eso topa a los 19px, y
          cualquier cosa más grande parte la fecha en dos renglones. Así crece
          hasta donde dé la pantalla — 25px en un celular normal — sin partirse
          nunca. Si algún día cambia `dateLabel` por un texto más largo, hay que
          volver a medirlo.
        */}
        <div className="mt-5 font-serif text-[clamp(18px,7vw-4.2px,25px)] tracking-[.06em] text-[#7a5f55]">
          {EVENT.dateLabel}
        </div>
      </div>
    </section>
  );
}
