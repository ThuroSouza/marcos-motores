import { Plus, Pencil, Trash2, Tags } from "lucide-react";
import { data, Link } from "react-router";
import type { Route } from "./+types/admin.categories";
import { requireAdmin } from "../server/admin-auth.server";
import { listAdminCategories } from "../server/categories.server";
import { requireCategoryDb } from "../server/categories-db.server";

export function meta() { return [{ title: "Categorias | Marcos Motores" }, { name: "robots", content: "noindex,nofollow" }]; }
export function headers() { return { "Cache-Control": "private, no-store" }; }

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  const categories = await listAdminCategories(requireCategoryDb());
  const notice = new URL(request.url).searchParams.get("notice");
  const message = notice === "created" ? "Categoria criada." : notice === "updated" ? "Categoria atualizada." : notice === "deleted" ? "Categoria excluída." : null;
  return data({ categories, message }, { headers: { "Cache-Control": "private, no-store" } });
}

export default function AdminCategories({ loaderData }: Route.ComponentProps) {
  const { categories, message } = loaderData;
  return (
    <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12 lg:px-12">
      <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow">CATÁLOGO / ORGANIZAÇÃO</p><h1 className="font-display mt-3 text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl">Categorias</h1><p className="mt-3 text-sm text-muted">Organize os tipos de motocicleta exibidos na vitrine.</p></div><Link to="/admin/categorias/nova" className="button-primary"><Plus size={17} aria-hidden="true" />Nova categoria</Link></div>
      {message && <p role="status" className="mt-7 border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">{message}</p>}
      <div className="mt-9 border border-white/10 bg-charcoal">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-5 sm:px-7"><h2 className="font-display text-lg font-bold text-white">Categorias cadastradas</h2><span className="text-sm text-muted">{categories.length} {categories.length === 1 ? "categoria" : "categorias"}</span></div>
        {categories.length === 0 ? <div className="flex flex-col items-center px-6 py-16 text-center"><Tags size={30} className="text-gold" aria-hidden="true" /><p className="mt-5 font-display text-xl font-bold text-white">Nenhuma categoria cadastrada</p><p className="mt-2 max-w-sm text-sm leading-6 text-muted">Crie a primeira categoria para organizar os futuros anúncios da loja.</p><Link to="/admin/categorias/nova" className="button-secondary mt-6">Criar categoria</Link></div> : <ul className="divide-y divide-white/10">{categories.map((category) => <li key={category.id} className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-white">{category.name}</h3><span className={`border px-2 py-0.5 text-[11px] font-bold ${category.isActive ? "border-green-400/25 bg-green-400/10 text-green-300" : "border-white/20 text-muted"}`}>{category.isActive ? "Ativa" : "Inativa"}</span></div><p className="mt-1 break-all text-xs text-muted">/{category.slug} · {category.motorcycleCount} {category.motorcycleCount === 1 ? "moto vinculada" : "motos vinculadas"}</p>{category.description && <p className="mt-2 line-clamp-2 text-sm text-muted">{category.description}</p>}</div><div className="flex shrink-0 gap-2"><Link to={`/admin/categorias/${category.id}/editar`} className="inline-flex min-h-10 items-center gap-2 border border-white/20 px-3 text-xs font-bold text-white hover:border-gold hover:text-gold"><Pencil size={14} aria-hidden="true" />Editar</Link><Link to={`/admin/categorias/${category.id}/excluir`} className="inline-flex min-h-10 items-center gap-2 border border-white/20 px-3 text-xs font-bold text-white hover:border-red-400 hover:text-red-300"><Trash2 size={14} aria-hidden="true" />Excluir</Link></div></li>)}</ul>}
      </div>
    </div>
  );
}
