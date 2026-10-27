import { data, Link, redirect } from "react-router";
import type { Route } from "./+types/admin.category-new";
import { CategoryForm } from "../components/admin/CategoryForm";
import { requireAdmin } from "../server/admin-auth.server";
import { assertSameOrigin } from "../server/auth-cookie";
import { CategoryError, categoryDraftFromForm, createCategory, parseCategoryForm } from "../server/categories.server";
import { requireCategoryDb } from "../server/categories-db.server";

export function meta() { return [{ title: "Nova categoria | Marcos Motores" }, { name: "robots", content: "noindex,nofollow" }]; }
export function headers() { return { "Cache-Control": "private, no-store" }; }
export async function loader({ request }: Route.LoaderArgs) { await requireAdmin(request); return null; }

export async function action({ request }: Route.ActionArgs) {
  assertSameOrigin(request);
  await requireAdmin(request);
  const form = await request.formData();
  try {
    const input = parseCategoryForm(form);
    await createCategory(requireCategoryDb(), input);
    throw redirect("/admin/categorias?notice=created");
  } catch (error) {
    if (error instanceof CategoryError) return data({ error: error.message, draft: categoryDraftFromForm(form) }, { status: error.status });
    throw error;
  }
}

export default function NewCategory({ actionData }: Route.ComponentProps) {
  return <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12 lg:px-12"><Link to="/admin/categorias" className="text-xs font-bold uppercase tracking-widest text-gold hover:underline">← Voltar às categorias</Link><p className="eyebrow mt-9">CATÁLOGO / CATEGORIAS</p><h1 className="font-display mt-3 text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl">Nova categoria</h1><p className="mt-3 text-sm text-muted">Defina o nome, a URL e a visibilidade desta categoria.</p><CategoryForm key={JSON.stringify(actionData?.draft)} initial={actionData?.draft ?? { name: "", slug: "", description: "", isActive: true }} error={actionData?.error} submitLabel="Criar categoria" /></div>;
}
