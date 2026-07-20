import { EVENT } from "@/lib/event";
import Divider from "./Divider";
import SectionLabel from "./SectionLabel";

function NamePair({ label, names }: { label: string; names: readonly string[] }) {
  return (
    <div>
      <SectionLabel className="mb-3">{label}</SectionLabel>
      <div className="font-serif text-[25px] leading-[1.35] text-cocoa">
        {names[0]}
        <br />
        <span className="text-[19px] text-rose italic">&amp;</span>
        <br />
        {names[1]}
      </div>
    </div>
  );
}

export default function Family() {
  return (
    <section className="border-y border-gold/28 bg-sand px-[30px] pt-10 pb-11 text-center">
      <div className="grid gap-[34px]">
        <NamePair label="Mis papás" names={EVENT.parents} />
        <Divider width={40} dot={8} gap={12} />
        <NamePair label="Mis madrinas" names={EVENT.godmothers} />
      </div>
    </section>
  );
}
