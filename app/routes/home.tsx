import { ArrowRight, ArrowUpRight, Bike, ChevronDown, MessageCircle } from "lucide-react";
import { data, Link } from "react-router";
import type { Route } from "./+types/home";
import { MotorcycleCard } from "../components/motorcycle/MotorcycleCard";
import { SectionHeading } from "../components/ui/SectionHeading";
import { parsePublicCatalogQuery } from "../server/catalog-query.server";
import { getDb } from "../server/db.server";
import { listCategoryShowcase, listPublicMotorcycles } from "../server/public-repository.server";
import type { MotorcycleSummary } from "../types/motorcycle";

export function meta() {
  return [
    { title: "Marcos Motores | Sua próxima jornada começa aqui" },
    { name: "description", content: "Conheça as motocicletas publicadas pela Marcos Motores e explore o catálogo da loja." },
  ];
}

export function headers() { return { "Cache-Control": "no-store" }; }

type Showcase = { slug: string; name: string; description: string | null; imageUrl: string | null };
const empty: { state: "unavailable"; featured: MotorcycleSummary[]; recent: MotorcycleSummary[]; categories: Showcase[] } = { state: "unavailable", featured: [], recent: [], categories: [] };

export async function loader() {
  const db = getDb();
  if (!db) return data(empty, { status: 503, headers: { "Cache-Control": "no-store" } });
  try {
    const [featured, recent, categories] = await Promise.all([
      listPublicMotorcycles(db, parsePublicCatalogQuery(new URLSearchParams({ featured: "true", limit: "3" }))),
      listPublicMotorcycles(db, parsePublicCatalogQuery(new URLSearchParams({ limit: "3" }))),
      listCategoryShowcase(db),
    ]);
    return data({ state: "ready" as const, featured: featured.items, recent: recent.items, categories }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Home catalog unavailable", error instanceof Error ? error.name : "UnknownError");
    return data(empty, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { featured, recent, categories, state } = loaderData;
  const hasMotorcycles = featured.length > 0 || recent.length > 0;
  return <>
    <section className="relative isolate flex min-h-[min(760px,calc(100svh-5rem))] items-center overflow-hidden border-b border-white/10 bg-charcoal">
      <img src="/demo/naked.jpg" alt="" aria-hidden="true" fetchPriority="high" className="hero-photo" />
      <div aria-hidden="true" className="hero-overlay" />
      <div className="site-container relative z-10 w-full py-24 sm:py-32"><div className="max-w-3xl"><p className="eyebrow mb-7">MARCOS MOTORES <span className="mx-3 text-white/20">/</span> VITRINE DIGITAL</p><h1 className="font-display text-[clamp(3.5rem,9vw,7.2rem)] leading-[0.96] tracking-[-0.065em] text-white">Sua próxima<br /><em className="font-normal text-gold">jornada</em><br />começa aqui.</h1><p className="mt-8 max-w-lg text-base leading-7 text-[#d1d1d1] sm:text-lg">Explore as motocicletas da loja, compare características e encontre a opção para a sua próxima estrada.</p><div className="mt-10 flex flex-wrap gap-3"><Link to="/motos" className="button-primary">Explorar catálogo <ArrowRight size={18} aria-hidden="true" /></Link><Link to="/sobre" className="button-secondary">Conhecer a loja</Link></div></div><a href="#catalogo" className="mt-20 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#d1d1d1] transition hover:text-gold">Descubra mais <ChevronDown size={17} aria-hidden="true" /></a></div>
      <div className="hero-rail" aria-hidden="true">MARCOS MOTORES · MOTOCICLETAS · MARCOS MOTORES</div>
    </section>

    <section id="catalogo" className="site-container py-20 sm:py-24">
      <SectionHeading eyebrow="VITRINE DIGITAL" title="Motos em destaque" description="Anúncios selecionados pela equipe da loja." href="/motos?featured=true" linkLabel="Ver catálogo" />
      {featured.length > 0 ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{featured.map((motorcycle) => <MotorcycleCard key={motorcycle.id} motorcycle={motorcycle} />)}</div> : <div className="border border-white/10 bg-charcoal p-8 text-sm leading-6 text-muted">{state === "unavailable" ? "O catálogo está temporariamente indisponível. Tente novamente em instantes." : "Ainda não há motos em destaque publicadas."}</div>}
    </section>

    {recent.length > 0 && <section className="border-y border-white/10 bg-charcoal/70 py-20 sm:py-24"><div className="site-container"><SectionHeading eyebrow="NOVIDADES DA VITRINE" title="Adicionadas recentemente" description="Confira os anúncios publicados mais recentes." href="/motos?sort=recent" linkLabel="Explorar todas" /><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{recent.map((motorcycle) => <MotorcycleCard key={motorcycle.id} motorcycle={motorcycle} />)}</div></div></section>}

    {categories.length > 0 && <section className="site-container py-20 sm:py-24"><SectionHeading eyebrow="ENCONTRE SEU ESTILO" title="Explore por categoria" description="Encontre o tipo de moto que combina com você." /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{categories.map((category) => <Link key={category.slug} to={`/motos?category=${category.slug}`} className="group relative min-h-64 overflow-hidden border border-white/10 bg-charcoal">{category.imageUrl ? <img src={category.imageUrl} alt="" loading="lazy" className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-[1.05]" /> : <div className="absolute inset-0 flex items-center justify-center text-gold/20"><Bike size={90} strokeWidth={1} aria-hidden="true" /></div>}<span className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-transparent" aria-hidden="true" /><span className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-3"><span><span className="font-display block text-xl font-bold text-white">{category.name}</span>{category.description && <span className="mt-1 block text-xs text-[#d1d1d1]">{category.description}</span>}</span><ArrowUpRight className="shrink-0 text-gold" size={20} aria-hidden="true" /></span></Link>)}</div></section>}

    {!hasMotorcycles && state === "ready" && <section className="site-container pb-20"><p className="border border-gold/20 bg-gold/10 p-6 text-sm leading-6 text-[#e4cf88]">Nenhuma motocicleta foi publicada ainda. Volte em breve para conferir as novidades da Marcos Motores.</p></section>}

    <section className="border-t border-white/10 bg-charcoal py-20 sm:py-24"><div className="site-container grid items-center gap-10 lg:grid-cols-2 lg:gap-20"><div><p className="eyebrow mb-5">MARCOS MOTORES</p><h2 className="font-display text-3xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-5xl">Um espaço para sua próxima escolha.</h2></div><div><p className="leading-7 text-muted">As informações oficiais sobre a história, o atendimento e os diferenciais da Marcos Motores serão publicadas após a confirmação pela equipe da loja.</p><Link to="/sobre" className="mt-7 inline-flex items-center gap-2 border-b border-gold pb-2 text-xs font-bold uppercase tracking-[0.12em] text-gold">Saiba mais <ArrowUpRight size={16} aria-hidden="true" /></Link></div></div></section>
    <section className="site-container py-20 sm:py-24"><div className="flex flex-col gap-7 border border-gold/30 bg-gold/10 p-7 sm:p-10 lg:flex-row lg:items-center lg:justify-between"><div><MessageCircle className="mb-5 text-gold" size={28} aria-hidden="true" /><p className="eyebrow mb-3">VAMOS CONVERSAR</p><h2 className="font-display text-2xl font-bold text-white sm:text-3xl">Encontrou uma moto interessante?</h2><p className="mt-3 max-w-xl text-sm leading-6 text-muted">O contato por WhatsApp será ativado quando o número oficial da loja for fornecido.</p></div><Link to="/contato" className="button-primary w-fit">Ver página de contato <ArrowRight size={18} aria-hidden="true" /></Link></div></section>
  </>;
}
