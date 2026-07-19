"use client";

import { useEffect, useState } from "react";
import { EVENT_TARGET_MS } from "@/lib/event";

function split(now: number) {
  const diff = EVENT_TARGET_MS - now;
  const d = Math.max(0, diff);
  return {
    done: diff <= 0,
    days: Math.floor(d / 86_400_000),
    hours: Math.floor((d % 86_400_000) / 3_600_000),
    mins: Math.floor((d % 3_600_000) / 60_000),
    secs: Math.floor((d % 60_000) / 1000),
  };
}

function Box({
  value,
  label,
  accent = false,
}: {
  value: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="max-w-[80px] flex-1 rounded-[12px] border border-gold/30 bg-sand px-[6px] py-4">
      <div
        className={`font-serif text-[34px] leading-none font-semibold ${
          accent ? "text-rose" : "text-cocoa"
        }`}
      >
        {value}
      </div>
      <div className="mt-[5px] text-[10px] tracking-[.14em] text-stone uppercase">
        {label}
      </div>
    </div>
  );
}

/**
 * `serverNow` es la hora con la que se renderizó en el servidor. Se usa como
 * estado inicial para que el primer render del cliente coincida exactamente y
 * no haya error de hidratación; el `useEffect` toma la hora real enseguida.
 */
export default function Countdown({ serverNow }: { serverNow: number }) {
  const [now, setNow] = useState(serverNow);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const cd = split(now);

  return (
    <section className="px-[30px] py-[42px] text-center">
      <div className="mb-[22px] text-[11px] tracking-[.4em] text-clay uppercase">
        Cuenta regresiva
      </div>

      {cd.done ? (
        <div className="font-serif text-[28px] text-rose italic">
          ¡Hoy es el gran día!
        </div>
      ) : (
        <div className="flex justify-center gap-[10px]">
          <Box value={cd.days} label="días" />
          <Box value={cd.hours} label="hrs" />
          <Box value={cd.mins} label="min" />
          <Box value={cd.secs} label="seg" accent />
        </div>
      )}
    </section>
  );
}
