import { Link } from "react-router";

export function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <Link to="/" onClick={onClick} aria-label="Marcos Motores — início" className="inline-flex shrink-0 items-center gap-3 text-white">
      <span aria-hidden="true" className="flex size-10 items-center justify-center border border-gold/65 text-sm font-extrabold tracking-[-0.13em] text-gold sm:size-11">MM</span>
      <span className="flex flex-col font-display text-[0.9rem] font-extrabold uppercase leading-[1.05] tracking-[0.18em] sm:text-base">
        <span>Marcos</span><span className="text-gold">Motores</span>
      </span>
    </Link>
  );
}
