import { Bike, Plus, Search } from "lucide-react";
import { data, Form, Link, redirect } from "react-router";
import type { Route } from "./+types/admin.motorcycles";
import { requireAdmin } from "../server/admin-auth.server";
import { assertSameOrigin } from "../server/auth-cookie";
import { requireCategoryDb } from "../server/categories-db.server";
import { cleanupPendingImages } from "../server/motorcycle-images.server";
import { getImageBucket } from "../server/r2.server";
import { listAdminMotorcycles } from "../server/motorcycles-admin.server";

const statusLabels: Record<string, string> = { available: "Disponível", reserved: "Reservada", sold: "Vendida" };
export function meta() { return [{ title: "Motocicletas | Marcos Motores" }, { name: "robots", content: "noindex,nofollow" }]; }
export function headers() { return { "Cache-Control": "private, no-store" }; }

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  const url = new URL(request.url);
  const catalog = await listAdminMotorcycles(requireCategoryDb(), url.searchParams);
  const notice = url.searchParams.get("notice");
  const message = notice === "created" ? "Motocicleta cadastrada como rascunho." : notice === "updated" ? "Motocicleta atualizada." : notice === "deleted" ? (url.searchParams.get("pending") ? "Motocicleta excluída. Algumas fotos aguardam limpeza no R2." : "Motocicleta excluída.") : notice === "cleaned" ? "Limpeza pendente processada." : null;
  return data({ catalog, message }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function action({ request }: Route.ActionArgs) {
  assertSameOrigin(request);
  await requireAdmin(request);
  const form = await request.formData();
  if (form.get("intent") !== "cleanup") throw new Response("Ação inválida.", { status: 400 });
  await cleanupPendingImages(requireCategoryDb(), getImageBucket());
  throw redirect("/admin/motos?notice=cleaned");
}

export default function AdminMotorcycles({ loaderData }: Route.ComponentProps) {
  const { catalog, message } = loaderData;
  const totalPages = Math.ceil(catalog.total / 20);
  const search = (page: number) => `?${new URLSearchParams({ ...(catalog.q ? { q: catalog.q } : {}), ...(catalog.status ? { status: catalog.status } : {}), page: String(page) })}`;
  return <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12 lg:px-12">
    <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow">CATÁLOGO / ESTOQUE</p><h1 className="font-display mt-3 text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl">Motocicletas</h1><p className="mt-3 text-sm text-muted">Gerencie anúncios, disponibilidade, destaque e fotografias.</p></div><Link to="/admin/motos/nova" className="button-primary"><Plus size={17} aria-hidden="true" />Nova motocicleta</Link></div>
    {message && <p role="status" className="mt-7 border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">{message}</p>}
    <Form method="get" className="mt-8 flex flex-wrap gap-3 border border-white/10 bg-charcoal p-4"><label className="sr-only" htmlFor="admin-moto-q">Buscar motocicletas</label><input id="admin-moto-q" name="q" maxLength={100} className="filter-field mt-0 min-w-48 flex-1" placeholder="Marca, modelo ou slug" defaultValue={catalog.q} /><label className="sr-only" htmlFor="admin-moto-status">Status</label><select id="admin-moto-status" name="status" className="filter-field mt-0 w-full sm:w-44" defaultValue={catalog.status}><option value="">Todos os status</option><option value="available">Disponíveis</option><option value="reserved">Reservadas</option><option value="sold">Vendidas</option></select><button type="submit" className="button-secondary"><Search size={16} aria-hidden="true" />Buscar</button></Form>
    <div className="mt-6 border border-white/10 bg-charcoal"><div className="flex items-center justify-between border-b border-white/10 px-5 py-5 sm:px-7"><h2 className="font-display text-lg font-bold text-white">Anúncios cadastrados</h2><span className="text-sm text-muted">{catalog.total} no total</span></div>{catalog.items.length === 0 ? <div className="flex flex-col items-center px-6 py-16 text-center"><Bike size={30} className="text-gold" aria-hidden="true" /><p className="mt-5 font-display text-xl font-bold text-white">Nenhuma motocicleta encontrada</p><p className="mt-2 max-w-sm text-sm text-muted">Crie um anúncio ou ajuste os filtros de busca.</p><Link to="/admin/motos/nova" className="button-secondary mt-6">Cadastrar motocicleta</Link></div> : <ul className="divide-y divide-white/10">{catalog.items.map((item) => <li key={item.id} className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7"><div className="min-w-0"><p className="font-semibold text-white">{item.brand} {item.model} <span className="text-muted">{item.modelYear}</span></p><p className="mt-1 text-xs text-muted">{item.categoryName} · {statusLabels[item.status] ?? item.status} · {item.imageCount} {item.imageCount === 1 ? "foto" : "fotos"}</p><div className="mt-2 flex flex-wrap gap-2"><span className={`text-[11px] font-bold ${item.isPublished ? "text-green-300" : "text-muted"}`}>{item.isPublished ? "PUBLICADO" : "RASCUNHO"}</span>{item.isFeatured && <span className="text-[11px] font-bold text-gold">DESTAQUE</span>}</div></div><div className="flex shrink-0 gap-2"><Link to={`/admin/motos/${item.id}`} className="admin-image-button inline-flex items-center">Visualizar</Link><Link to={`/admin/motos/${item.id}/editar`} className="admin-image-button inline-flex items-center">Editar</Link></div></li>)}</ul>}</div>
    {totalPages > 1 && <nav aria-label="Páginas do estoque" className="mt-6 flex items-center justify-between gap-4 text-sm"><span className="text-muted">Página {catalog.page} de {totalPages}</span><div className="flex gap-2">{catalog.page > 1 && <Link to={search(catalog.page - 1)} className="button-secondary">Anterior</Link>}{catalog.page < totalPages && <Link to={search(catalog.page + 1)} className="button-secondary">Próxima</Link>}</div></nav>}
    <Form method="post" className="mt-10"><input type="hidden" name="intent" value="cleanup" /><button type="submit" className="text-xs font-bold uppercase tracking-widest text-muted hover:text-gold">Processar limpeza pendente de fotos</button><p className="mt-2 text-xs text-muted">Remove objetos sem vínculo após falhas de armazenamento. Tente novamente depois de cinco minutos se necessário.</p></Form>
  </div>;
}
