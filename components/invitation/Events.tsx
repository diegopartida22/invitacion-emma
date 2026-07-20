import { EVENT } from "@/lib/event";
import AddToCalendar from "./AddToCalendar";

type EventInfo = (typeof EVENT)["mass"] | (typeof EVENT)["reception"];

function EventCard({
  info,
  glow,
  symbolSize,
}: {
  info: EventInfo;
  glow: "top-right" | "bottom-left";
  symbolSize: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-[18px] border border-gold/35 bg-[linear-gradient(180deg,#fffdfb,#fdf5f0)] px-[26px] py-[30px] text-center">
      <div
        className={
          glow === "top-right"
            ? "absolute -top-10 -right-10 h-[120px] w-[120px] rounded-full bg-[radial-gradient(circle,rgba(242,211,200,.55),transparent_70%)]"
            : "absolute -bottom-10 -left-10 h-[120px] w-[120px] rounded-full bg-[radial-gradient(circle,rgba(240,220,196,.5),transparent_70%)]"
        }
      />

      <div className="relative">
        <div
          className="mb-[6px] text-rose"
          style={{ fontSize: symbolSize }}
          aria-hidden="true"
        >
          {info.symbol}
        </div>

        <div className="font-serif text-[24px] font-semibold tracking-[.12em] text-cocoa uppercase">
          {info.title}
        </div>

        {/* La hora es lo que más se consulta de esta tarjeta, más que el
            nombre del lugar. Va más grande que el título de la sección. */}
        <div className="mt-2 mb-[14px] font-serif text-[30px] leading-none text-rose italic">
          {info.time}
        </div>

        <div className="text-[15px] leading-[1.5] font-medium text-mocha">
          {info.venue}
          {info.venueNote ? (
            <>
              <br />
              <span className="font-normal text-taupe">{info.venueNote}</span>
            </>
          ) : null}
        </div>

        <div className="mt-2 text-[13px] leading-[1.5] text-taupe">
          {info.address.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </div>

        <a
          href={info.maps}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-[18px] inline-block rounded-full border border-clay/50 px-[22px] py-[9px] text-[12px] tracking-[.14em] text-clay uppercase no-underline"
        >
          Cómo llegar →
        </a>
      </div>
    </div>
  );
}

export default function Events() {
  return (
    <section className="grid gap-[22px] px-[30px] pt-2 pb-11">
      <EventCard info={EVENT.mass} glow="top-right" symbolSize={26} />
      <EventCard info={EVENT.reception} glow="bottom-left" symbolSize={24} />
      {/* Va al final a propósito: primero se lee dónde y a qué hora, y ya con
          eso en la cabeza tiene sentido ofrecer guardarlo. */}
      <AddToCalendar />
    </section>
  );
}
