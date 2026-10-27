import { data, Form, Link, redirect } from "react-router";
import type { Route } from "./+types/admin.category-delete";
import { requireAdmin } from "../server/admin-auth.server";
import { assertSameOrigin } from "../server/auth-cookie";
import { CategoryError, deleteCategory, getAdminCategory, validCategoryId } from "../server/categories.server";
import { requireCategoryDb } from "../server/categories-db.server";

export function meta() { return [{ title: "Excluir categoria | Marcos Motores" }, { name: "robots", content: "noindex,nofollow" }]; }
export function headers() { return { "Cache-Control": "private, no-store" }; }

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireAdmin(request);
  if (!validCategoryId(params.id)) throw new Response("Categoria não encontrada.", { status: 404 });
  const category = await getAdminCategory(requireCategoryDb(), params.id);
  if (!category) throw new Response("Categoria não encontrada.", { status: 404 });
  return data({ category }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function action({ request, params }: Route.ActionArgs) {
  assertSameOrigin(request);
  await requireAdmin(request);
  if (!validCategoryId(params.id)) throw new Response("Categoria não encontrada.", { status: 404 });
  const form = await request.formData();
  if (form.get("confirm") !== "delete") return data({ error: "Confirme a exclusão." }, { status: 400 });
  try {
    await deleteCategory(requireCategoryDb(), params.id);
    throw redirect("/admin/categorias?notice=deleted");
  } catch (error) {
    if (error instanceof CategoryError) return data({ error: error.message }, { status: error.status });
    throw error;
  }
}

export default function DeleteCategory({ loaderData, actionData }: Route.ComponentProps) {
  const { category } = loaderData;
  const linked = category.motorcycleCount > 0;
  return <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12 lg:px-12"><Link to="/admin/categorias" className="text-xs font-bold uppercase tracking-widest text-gold hover:underline">← Voltar às categorias</Link><div className="mt-9 max-w-2xl border border-red-400/25 bg-charcoal p-6 sm:p-9"><p className="eyebrow">CONFIRMAÇÃO</p><h1 className="font-display mt-3 text-3xl font-bold tracking-[-0.04em] text-white">Excluir {category.name}?</h1>{linked ? <p className="mt-4 text-sm leading-6 text-red-200">Esta categoria possui {category.motorcycleCount} {category.motorcycleCount === 1 ? "motocicleta vinculada" : "motocicletas vinculadas"}. Ela não pode ser excluída enquanto houver vínculos. Você pode desativá-la na edição.</p> : <p className="mt-4 text-sm leading-6 text-muted">A categoria será removida do catálogo. Esta ação não pode ser desfeita.</p>}{actionData?.error && <p role="alert" className="mt-5 border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{actionData.error}</p>}<div className="mt-8 flex flex-wrap gap-3">{!linked && <Form method="post"><input type="hidden" name="confirm" value="delete" /><button type="submit" className="inline-flex min-h-12 items-center bg-red-500 px-5 text-xs font-bold uppercase tracking-widest text-white hover:bg-red-400">Confirmar exclusão</button></Form>}<Link to="/admin/categorias" className="button-secondary">Cancelar</Link>{linked && <Link to={`/admin/categorias/${category.id}/editar`} className="button-primary">Editar categoria</Link>}</div></div></div>;
}
