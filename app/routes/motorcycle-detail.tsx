import { AlertCircle, ArrowLeft, CalendarDays, CircleGauge, Droplets, Gauge, MessageCircle, Palette, Settings2 } from "lucide-react";
import { isRouteErrorResponse, Link } from "react-router";
import type { Route } from "./+types/motorcycle-detail";
import { MotorcycleCard } from "../components/motorcycle/MotorcycleCard";
import { MotorcycleGallery } from "../components/motorcycle/MotorcycleGallery";
import { SectionHeading } from "../components/ui/SectionHeading";
import { getDb } from "../server/db.server";
import { getPublicMotorcycle, listSimilarMotorcycles } from "../server/public-repository.server";
import { formatKm, formatPrice, statusLabel } from "../utils/format";

export function headers() { return { "Cache-Control": "no-store" }; }

export async function loader({ params }: Route.LoaderArgs) {
  if (!params.slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(params.slug)) throw new Response("Anúncio não encontrado.", { status: 404 });
  const db = getDb();
  if (!db) throw new Response("Catálogo indisponível.", { status: 503 });
  try {
    const motorcycle = await getPublicMotorcycle(db, params.slug);
    if (!motorcycle) throw new Response("Anúncio não encontrado.", { status: 404 });
    return { motorcycle, similar: await listSimilarMotorcycles(db, motorcycle) };
  } catch (error) {
    if (isRouteErrorResponse(error) || error instanceof Response) throw error;
    console.error("Motorcycle detail unavailable", error instanceof Error ? error.name : "UnknownError");
    throw new Response("Catálogo indisponível.", { status: 503 });
  }
}

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [{ title: "Moto não encontrada | Marcos Motores" }];
  const moto = loaderData.motorcycle;
  return [
    { title: `${moto.brand} ${moto.model} ${moto.modelYear} | Marcos Motores` },
    { name: "description", content: moto.description.slice(0, 160) },
  ];
}

export default function MotorcycleDetail({ loaderData }: Route.ComponentProps) {
  const { motorcycle, similar } = loaderData;
  const name = `${motorcycle.brand} ${motorcycle.model}`;
  const specs = [
    { label: "Ano", value: `${motorcycle.manufactureYear}/${motorcycle.modelYear}`, icon: CalendarDays },
    { label: "Quilometragem", value: formatKm(motorcycle.mileageKm), icon: Gauge },
    { label: "Cilindrada", value: `${motorcycle.engineCc} cc`, icon: CircleGauge },
    { label: "Cor", value: motorcycle.color, icon: Palette },
    ...(motorcycle.fuelType ? [{ label: "Combustível", value: motorcycle.fuelType, icon: Droplets }] : []),
    { label: "Categoria", value: motorcycle.category.name, icon: Settings2 },
  ];

  return <>
    <div className="site-container py-7"><Link to="/motos" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-muted transition hover:text-gold"><ArrowLeft size={16} aria-hidden="true" /> Voltar ao catálogo</Link></div>
    <div className="site-container grid gap-9 pb-20 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)] lg:gap-10">
      <div className="min-w-0"><MotorcycleGallery images={motorcycle.images} name={name} /><div className="mt-10 border-t border-white/10 pt-9"><p className="eyebrow mb-4">SOBRE ESTA MOTO</p><h2 className="font-display text-2xl font-bold text-white sm:text-3xl">Descrição</h2><p className="mt-5 max-w-2xl whitespace-pre-wrap leading-7 text-muted">{motorcycle.description}</p></div>{motorcycle.features.length > 0 && <div className="mt-10 border-t border-white/10 pt-9"><p className="eyebrow mb-4">DETALHES</p><h2 className="font-display text-2xl font-bold text-white sm:text-3xl">Características adicionais</h2><ul className="mt-6 grid gap-3 sm:grid-cols-2">{motorcycle.features.map((feature) => <li key={feature} className="flex items-center gap-3 text-sm text-muted"><span className="size-1.5 shrink-0 rounded-full bg-gold" />{feature}</li>)}</ul></div>}</div>
      <div className="min-w-0"><div className="border border-white/10 bg-charcoal p-6 sm:p-8 lg:sticky lg:top-6"><p className="eyebrow mb-3">MARCOS MOTORES / ANÚNCIO</p><h1 className="font-display text-3xl font-bold tracking-[-0.045em] text-white sm:text-4xl">{name}</h1><p className="mt-2 text-sm text-muted">{motorcycle.version ? `${motorcycle.version} · ` : ""}{motorcycle.modelYear}</p><div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-y border-white/10 py-5"><span className={`px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] ${motorcycle.status === "available" ? "bg-gold text-ink" : "bg-ink text-white"}`}>{statusLabel[motorcycle.status]}</span><span className="text-xs text-muted">Código {motorcycle.id.slice(0, 8).toUpperCase()}</span></div><p className="mt-6 text-xs font-bold uppercase tracking-[0.14em] text-muted">Preço anunciado</p><p className="font-display mt-1 text-3xl font-extrabold text-gold">{formatPrice(motorcycle.priceCents)}</p><div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-6 border-t border-white/10 pt-7">{specs.map(({ label, value, icon: Icon }) => <div key={label} className="min-w-0"><span className="flex items-center gap-2 text-xs text-muted"><Icon size={15} className="text-gold" aria-hidden="true" />{label}</span><span className="mt-1 block text-sm font-semibold text-white">{value}</span></div>)}</div><div className="mt-8 border-t border-white/10 pt-7">{motorcycle.status === "sold" ? <p className="text-sm leading-6 text-muted">Esta motocicleta está marcada como vendida.</p> : <><div className="flex items-start gap-3 text-sm leading-6 text-muted"><MessageCircle size={19} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" /><p>O contato direto pelo WhatsApp será disponibilizado quando o número oficial da loja for configurado.</p></div><Link to="/contato" className="button-primary mt-5 w-full">Ver página de contato</Link></>}</div></div></div>
    </div>
    {similar.length > 0 && <section className="border-t border-white/10 bg-charcoal/60 py-20"><div className="site-container"><SectionHeading eyebrow="CONTINUE EXPLORANDO" title="Motos semelhantes" description="Outras motocicletas publicadas pela loja." /><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{similar.map((item) => <MotorcycleCard key={item.id} motorcycle={item} />)}</div></div></section>}
  </>;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const unavailable = isRouteErrorResponse(error) && error.status === 503;
  return <div className="site-container flex min-h-[60svh] flex-col items-center justify-center py-16 text-center"><AlertCircle size={36} className="text-gold" aria-hidden="true" /><h1 className="font-display mt-5 text-3xl font-bold text-white">{unavailable ? "Catálogo indisponível" : "Anúncio não encontrado"}</h1><p className="mt-3 text-muted">{unavailable ? "Não foi possível carregar esta moto agora. Tente novamente em instantes." : "Esta moto não está publicada ou o endereço não existe."}</p><Link to="/motos" className="button-primary mt-7">Voltar ao catálogo</Link></div>;
}
