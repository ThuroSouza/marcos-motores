import { AlertCircle, SearchX } from "lucide-react";
import { data, Link, useLocation, useNavigation } from "react-router";
import type { Route } from "./+types/motorcycles";
import { CatalogFilters } from "../components/filters/CatalogFilters";
import { MotorcycleCard } from "../components/motorcycle/MotorcycleCard";
import { parsePublicCatalogQuery } from "../server/catalog-query.server";
import { getDb } from "../server/db.server";
import { ApiValidationError } from "../server/errors";
import { getPublicCatalogOptions, listPublicMotorcycles } from "../server/public-repository.server";
import { toCatalogFilters } from "../utils/catalog";

export function meta() {
  return [{ title: "Catálogo de motos | Marcos Motores" }, { name: "description", content: "Explore as motocicletas publicadas pela Marcos Motores. Filtre por marca, categoria, ano, preço e disponibilidade." }];
}
export function headers() { return { "Cache-Control": "no-store" }; }

const emptyCatalog = { items: [], page: 1, limit: 12, total: 0, totalPages: 0 };
const emptyOptions = { brands: [], years: [], categories: [] };

export async function loader({ request }: Route.LoaderArgs) {
  const params = new URL(request.url).searchParams;
  let query;
  try { query = parsePublicCatalogQuery(params); }
  catch (error) {
    if (!(error instanceof ApiValidationError)) throw error;
    return data({ state: "invalid" as const, message: error.message, filters: toCatalogFilters(parsePublicCatalogQuery(new URLSearchParams())), catalog: emptyCatalog, options: emptyOptions }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  const filters = toCatalogFilters(query);
  const db = getDb();
  if (!db) return data({ state: "unavailable" as const, message: "O catálogo está temporariamente indisponível. Tente novamente em instantes.", filters, catalog: emptyCatalog, options: emptyOptions }, { status: 503, headers: { "Cache-Control": "no-store" } });
  try {
    const [catalog, options] = await Promise.all([listPublicMotorcycles(db, query), getPublicCatalogOptions(db)]);
    return data({ state: "ready" as const, message: "", filters, catalog, options }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Public catalog unavailable", error instanceof Error ? error.name : "UnknownError");
    return data({ state: "unavailable" as const, message: "O catálogo está temporariamente indisponível. Tente novamente em instantes.", filters, catalog: emptyCatalog, options: emptyOptions }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export default function Motorcycles({ loaderData }: Route.ComponentProps) {
  const { catalog, filters, options, state, message } = loaderData;
  const navigation = useNavigation();
  const location = useLocation();
  const loading = navigation.state !== "idle";
  const hasFilters = Boolean(filters.query || filters.brand || filters.category || filters.year || filters.minPrice || filters.maxPrice || filters.minCc || filters.maxCc || filters.status || filters.featured);
  const pageLink = (page: number) => { const params = new URLSearchParams(location.search); params.set("page", String(page)); return `/motos?${params}`; };

  return <>
    <section className="border-b border-white/10 bg-charcoal"><div className="site-container py-14 sm:py-20"><p className="eyebrow mb-5">VITRINE DIGITAL / CATÁLOGO</p><h1 className="font-display text-4xl font-semibold tracking-[-0.05em] text-white sm:text-6xl">Encontre sua próxima moto.</h1><p className="mt-5 max-w-2xl leading-7 text-muted">Explore os anúncios publicados, combine filtros e abra os detalhes de cada moto.</p></div></section>
    <div className="site-container flex flex-col gap-8 py-10 lg:flex-row lg:gap-9 lg:py-14">
      <CatalogFilters filters={filters} options={options} />
      <section className="min-w-0 flex-1" aria-label="Resultados do catálogo" aria-busy={loading}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5"><p className="text-sm text-muted">{state === "ready" ? <><strong className="text-white">{catalog.total}</strong> {catalog.total === 1 ? "moto encontrada" : "motos encontradas"}</> : "Resultados indisponíveis"}</p>{state === "ready" && catalog.totalPages > 1 && <p className="text-xs text-muted">Página {catalog.page} de {catalog.totalPages}</p>}</div>
        {loading && <div role="status" className="mb-5 flex items-center gap-3 text-sm text-gold"><span className="size-4 animate-spin rounded-full border-2 border-gold/30 border-t-gold" /> Atualizando resultados...</div>}
        {state !== "ready" ? <div role="alert" className="flex min-h-72 flex-col items-center justify-center border border-white/10 bg-charcoal px-6 py-12 text-center"><AlertCircle size={34} className="text-gold" aria-hidden="true" /><h2 className="font-display mt-5 text-2xl font-bold text-white">{state === "invalid" ? "Confira os filtros" : "Catálogo indisponível"}</h2><p className="mt-3 max-w-md text-sm leading-6 text-muted">{message}</p><Link to="/motos" className="button-primary mt-7">Tentar novamente</Link></div>
          : catalog.items.length > 0 ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{catalog.items.map((motorcycle) => <MotorcycleCard key={motorcycle.id} motorcycle={motorcycle} />)}</div>
            : <div className="flex min-h-80 flex-col items-center justify-center border border-white/10 bg-charcoal px-6 py-12 text-center"><SearchX size={34} className="text-gold" aria-hidden="true" /><h2 className="font-display mt-5 text-2xl font-bold text-white">{catalog.total > 0 ? "Página sem anúncios" : hasFilters ? "Nenhuma moto encontrada" : "Ainda não há motos publicadas"}</h2><p className="mt-3 max-w-sm text-sm leading-6 text-muted">{catalog.total > 0 ? "Volte à primeira página para continuar explorando." : hasFilters ? "Ajuste os filtros ou limpe a pesquisa para ver outros anúncios." : "A vitrine será atualizada assim que a loja publicar os primeiros anúncios."}</p>{(hasFilters || catalog.total > 0) && <Link to="/motos" className="button-primary mt-7">{catalog.total > 0 ? "Primeira página" : "Limpar filtros"}</Link>}</div>}
        {state === "ready" && catalog.totalPages > 1 && <nav aria-label="Paginação do catálogo" className="mt-8 flex flex-wrap items-center justify-between gap-4 text-sm"><span className="text-muted">Página {catalog.page} de {catalog.totalPages}</span><div className="flex gap-2">{catalog.page > 1 && <Link to={pageLink(catalog.page - 1)} className="button-secondary">Anterior</Link>}{catalog.page < catalog.totalPages && <Link to={pageLink(catalog.page + 1)} className="button-secondary">Próxima</Link>}</div></nav>}
      </section>
    </div>
  </>;
}

export function ErrorBoundary() {
  return <div className="site-container flex min-h-[60svh] flex-col items-center justify-center py-16 text-center"><AlertCircle size={36} className="text-gold" aria-hidden="true" /><h1 className="font-display mt-5 text-3xl font-bold text-white">Não foi possível carregar o catálogo</h1><p className="mt-3 text-muted">Tente atualizar a página em instantes.</p><Link to="/" className="button-primary mt-7">Voltar ao início</Link></div>;
}
