import { EVENT } from "@/lib/event";

export default function Greeting() {
  return (
    <section className="bg-[linear-gradient(180deg,#fffdfb,#fdf6f2)] px-[34px] pt-[6px] pb-10 text-center">
      <p className="mx-auto my-0 max-w-[330px] font-serif text-[22px] leading-[1.55] text-mocha italic">
        “Este día tan especial de mi vida quiero compartirlo contigo. Con el
        corazón lleno de ilusión recibiré por primera vez a Jesús.”
      </p>
      <div className="mt-[14px] font-script text-[30px] text-rose">
        con cariño, {EVENT.child}
      </div>
    </section>
  );
}
