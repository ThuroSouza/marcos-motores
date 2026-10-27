import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { Form, Link } from "react-router";
import type { CatalogFilters as CatalogFiltersType, MotorcycleCategory } from "../../types/motorcycle";

interface FilterOptions { brands: string[]; years: number[]; categories: MotorcycleCategory[] }

export function CatalogFilters({ filters, options }: { filters: CatalogFiltersType; options: FilterOptions }) {
  const [open, setOpen] = useState(false);
  const fieldClass = "filter-field";

  return (
    <aside className="lg:w-[270px] lg:shrink-0" aria-label="Filtros do catálogo">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="catalog-filter-form" className="mb-5 flex w-full items-center justify-between border border-white/15 px-5 py-4 text-sm font-bold text-white lg:hidden">
        <span className="inline-flex items-center gap-2"><SlidersHorizontal size={18} aria-hidden="true" /> Filtrar motos</span>{open ? <X size={18} aria-hidden="true" /> : <span className="text-gold">Abrir</span>}
      </button>
      <Form key={JSON.stringify(filters)} id="catalog-filter-form" method="get" className={`${open ? "block" : "hidden"} border border-white/10 bg-charcoal p-5 lg:block lg:p-6`}>
        <div className="mb-6 hidden items-center justify-between lg:flex"><h2 className="font-display text-lg font-bold text-white">Filtros</h2><SlidersHorizontal size={18} className="text-gold" aria-hidden="true" /></div>
        <div className="space-y-5">
          <label className="filter-label">Buscar por modelo
            <input className={fieldClass} name="q" type="search" maxLength={100} placeholder="Ex.: Naked 500" defaultValue={filters.query} />
          </label>
          <label className="filter-label">Marca
            <select className={fieldClass} name="brand" defaultValue={filters.brand}><option value="">Todas as marcas</option>{options.brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}</select>
          </label>
          <label className="filter-label">Categoria
            <select className={fieldClass} name="category" defaultValue={filters.category}><option value="">Todas as categorias</option>{options.categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}</select>
          </label>
          <label className="filter-label">Ano do modelo
            <select className={fieldClass} name="year" defaultValue={filters.year}><option value="">Todos os anos</option>{options.years.map((year) => <option key={year} value={year}>{year}</option>)}</select>
          </label>
          <div><span className="filter-label">Preço (R$)</span><div className="mt-2 grid grid-cols-2 gap-2"><label className="sr-only" htmlFor="minPrice">Preço mínimo</label><input id="minPrice" className={fieldClass} name="minPrice" type="number" min="0" step="0.01" placeholder="Mínimo" defaultValue={filters.minPrice} /><label className="sr-only" htmlFor="maxPrice">Preço máximo</label><input id="maxPrice" className={fieldClass} name="maxPrice" type="number" min="0" step="0.01" placeholder="Máximo" defaultValue={filters.maxPrice} /></div></div>
          <div><span className="filter-label">Cilindrada (cc)</span><div className="mt-2 grid grid-cols-2 gap-2"><label className="sr-only" htmlFor="minCc">Cilindrada mínima</label><input id="minCc" className={fieldClass} name="minCc" type="number" min="1" step="1" placeholder="Mínima" defaultValue={filters.minCc} /><label className="sr-only" htmlFor="maxCc">Cilindrada máxima</label><input id="maxCc" className={fieldClass} name="maxCc" type="number" min="1" step="1" placeholder="Máxima" defaultValue={filters.maxCc} /></div></div>
          <label className="filter-label">Disponibilidade
            <select className={fieldClass} name="status" defaultValue={filters.status}><option value="">Disponíveis e reservadas</option><option value="available">Disponíveis</option><option value="reserved">Reservadas</option><option value="sold">Vendidas</option><option value="all">Todas</option></select>
          </label>
          <label className="filter-label">Destaques
            <select className={fieldClass} name="featured" defaultValue={filters.featured ? "true" : ""}><option value="">Todas as motos</option><option value="true">Somente destaques</option></select>
          </label>
          <label className="filter-label">Ordenar por
            <select className={fieldClass} name="sort" defaultValue={filters.sort}><option value="recent">Mais recentes</option><option value="price-asc">Menor preço</option><option value="price-desc">Maior preço</option><option value="mileage-asc">Menor quilometragem</option></select>
          </label>
        </div>
        <button type="submit" className="button-primary mt-7 w-full">Aplicar filtros</button>
        <Link to="/motos" className="mt-4 block text-center text-xs font-bold uppercase tracking-[0.12em] text-muted transition hover:text-gold">Limpar pesquisa</Link>
      </Form>
    </aside>
  );
}
