import { ArrowUpRight, Bike, Gauge, CalendarDays } from "lucide-react";
import { Link } from "react-router";
import type { MotorcycleSummary } from "../../types/motorcycle";
import { formatKm, formatPrice, statusLabel } from "../../utils/format";

export function MotorcycleCard({ motorcycle }: { motorcycle: MotorcycleSummary }) {
  return (
    <article className="group overflow-hidden border border-white/10 bg-charcoal transition hover:border-gold/50">
      <Link to={`/motos/${motorcycle.slug}`} aria-label={`Ver detalhes de ${motorcycle.brand} ${motorcycle.model}`} className="relative block overflow-hidden bg-[#202020]">
        {motorcycle.coverImage ? <img src={motorcycle.coverImage.url} alt={motorcycle.coverImage.alt || `${motorcycle.brand} ${motorcycle.model}`} loading="lazy" className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.04]" /> : <span className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 text-muted"><Bike size={38} aria-hidden="true" />Foto indisponível</span>}
        <span className={`absolute bottom-4 right-4 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.1em] ${motorcycle.status === "available" ? "bg-gold text-ink" : "bg-ink/90 text-white"}`}>{statusLabel[motorcycle.status]}</span>
      </Link>
      <div className="p-5 sm:p-6">
        <p className="eyebrow mb-2">{motorcycle.category.name}</p>
        <h3 className="font-display text-xl font-semibold tracking-[-0.03em] text-white">{`${motorcycle.brand} ${motorcycle.model}`}</h3>
        {motorcycle.version && <p className="mt-1 text-sm text-muted">{motorcycle.version}</p>}
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-y border-white/10 py-4 text-xs text-muted">
          <span className="inline-flex items-center gap-2"><CalendarDays size={15} aria-hidden="true" /> {motorcycle.modelYear}</span>
          <span className="inline-flex items-center gap-2"><Gauge size={15} aria-hidden="true" /> {formatKm(motorcycle.mileageKm)}</span>
        </div>
        <div className="flex items-end justify-between gap-3 pt-5">
          <div><span className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted">Preço</span><p className="font-display mt-1 text-xl font-bold text-gold sm:text-2xl">{formatPrice(motorcycle.priceCents)}</p></div>
          <Link to={`/motos/${motorcycle.slug}`} aria-label={`Abrir anúncio de ${motorcycle.brand} ${motorcycle.model}`} className="flex size-11 shrink-0 items-center justify-center border border-gold/50 text-gold transition hover:bg-gold hover:text-ink"><ArrowUpRight size={20} aria-hidden="true" /></Link>
        </div>
      </div>
    </article>
  );
}
