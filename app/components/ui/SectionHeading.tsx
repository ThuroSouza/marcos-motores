import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router";

export function SectionHeading({ eyebrow, title, description, href, linkLabel }: { eyebrow: string; title: string; description?: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-9 flex flex-wrap items-end justify-between gap-6 sm:mb-11">
      <div>
        <p className="eyebrow mb-4">{eyebrow}</p>
        <h2 className="font-display text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl">{title}</h2>
        {description && <p className="mt-3 max-w-xl text-sm leading-6 text-muted sm:text-base">{description}</p>}
      </div>
      {href && linkLabel && <Link to={href} className="inline-flex items-center gap-2 border-b border-gold pb-2 text-xs font-bold uppercase tracking-[0.12em] text-gold transition hover:text-white">{linkLabel}<ArrowUpRight size={16} aria-hidden="true" /></Link>}
    </div>
  );
}
