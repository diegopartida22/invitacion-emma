/** Filete dorado con rombo al centro. Se repite en varias secciones. */
export default function Divider({
  width = 46,
  dot = 9,
  gap = 14,
  className = "",
}: {
  width?: number;
  dot?: number;
  gap?: number;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{ gap }}
      aria-hidden="true"
    >
      <span
        className="h-px bg-[linear-gradient(90deg,transparent,#cbb08e)]"
        style={{ width }}
      />
      <span className="text-gold" style={{ fontSize: dot }}>
        ◆
      </span>
      <span
        className="h-px bg-[linear-gradient(90deg,#cbb08e,transparent)]"
        style={{ width }}
      />
    </div>
  );
}
