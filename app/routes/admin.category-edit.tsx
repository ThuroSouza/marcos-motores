import { data, Link, redirect } from "react-router";
import type { Route } from "./+types/admin.category-edit";
import { CategoryForm } from "../components/admin/CategoryForm";
import { requireAdmin } from "../server/admin-auth.server";
import { assertSameOrigin } from "../server/auth-cookie";
import { CategoryError, categoryDraftFromForm, getAdminCategory, parseCategoryForm, updateCategory, validCategoryId } from "../server/categories.server";
import { requireCategoryDb } from "../server/categories-db.server";

export function meta() { return [{ title: "Editar categoria | Marcos Motores" }, { name: "robots", content: "noindex,nofollow" }]; }
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
  try {
    const input = parseCategoryForm(form);
    await updateCategory(requireCategoryDb(), params.id, input);
    throw redirect("/admin/categorias?notice=updated");
  } catch (error) {
    if (error instanceof CategoryError) return data({ error: error.message, draft: categoryDraftFromForm(form) }, { status: error.status });
    throw error;
  }
}

export default function EditCategory({ loaderData, actionData }: Route.ComponentProps) {
  const { category } = loaderData;
  return <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12 lg:px-12"><Link to="/admin/categorias" className="text-xs font-bold uppercase tracking-widest text-gold hover:underline">← Voltar às categorias</Link><p className="eyebrow mt-9">CATÁLOGO / CATEGORIAS</p><h1 className="font-display mt-3 text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl">Editar categoria</h1><p className="mt-3 text-sm text-muted">{category.motorcycleCount} {category.motorcycleCount === 1 ? "moto vinculada" : "motos vinculadas"}. Alterar o slug muda o filtro público associado.</p><CategoryForm key={JSON.stringify(actionData?.draft)} initial={actionData?.draft ?? category} error={actionData?.error} submitLabel="Salvar alterações" /><Link to={`/admin/categorias/${category.id}/excluir`} className="mt-8 inline-block text-sm text-red-300 hover:underline">Excluir esta categoria</Link></div>;
}
