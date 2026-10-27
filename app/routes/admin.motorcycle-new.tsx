import { data, Link, redirect } from "react-router";
import type { Route } from "./+types/admin.motorcycle-new";
import { MotorcycleForm } from "../components/admin/MotorcycleForm";
import { requireAdmin } from "../server/admin-auth.server";
import { assertSameOrigin } from "../server/auth-cookie";
import { requireCategoryDb } from "../server/categories-db.server";
import { listAdminCategories } from "../server/categories.server";
import { MotorcycleError, motorcycleDraftFromForm, parseMotorcycleForm, saveMotorcycle, type MotorcycleDraft } from "../server/motorcycles-admin.server";

const emptyDraft: MotorcycleDraft = { brand: "", model: "", version: "", slug: "", categoryId: "", manufactureYear: "", modelYear: "", mileageKm: "0", engineCc: "", color: "", fuelType: "", price: "", description: "", observations: "", status: "available", isPublished: false, isFeatured: false, features: "" };
export function meta() { return [{ title: "Nova motocicleta | Marcos Motores" }, { name: "robots", content: "noindex,nofollow" }]; }
export function headers() { return { "Cache-Control": "private, no-store" }; }

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  return data({ categories: await listAdminCategories(requireCategoryDb()) }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function action({ request }: Route.ActionArgs) {
  assertSameOrigin(request);
  await requireAdmin(request);
  const form = await request.formData();
  try {
    const input = parseMotorcycleForm(form);
    const id = await saveMotorcycle(requireCategoryDb(), null, input);
    throw redirect(`/admin/motos/${id}/editar?notice=created#fotos`);
  } catch (error) {
    if (error instanceof MotorcycleError) return data({ error: error.message, draft: motorcycleDraftFromForm(form) }, { status: error.status });
    throw error;
  }
}

export default function NewMotorcycle({ loaderData, actionData }: Route.ComponentProps) {
  const categories = loaderData.categories;
  return <div className="mx-auto max-w-5xl px-5 py-9 sm:px-8 sm:py-12 lg:px-12"><Link to="/admin/motos" className="text-xs font-bold uppercase tracking-widest text-gold hover:underline">← Voltar às motocicletas</Link><p className="eyebrow mt-9">ESTOQUE / NOVO ANÚNCIO</p><h1 className="font-display mt-3 text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl">Cadastrar motocicleta</h1><p className="mt-3 text-sm leading-6 text-muted">Salve o anúncio como rascunho. Depois adicione fotos e publique quando estiver pronto.</p>{categories.filter((category) => category.isActive).length === 0 && <p className="mt-6 border border-gold/30 bg-gold/10 p-4 text-sm text-gold">É preciso ter uma categoria ativa antes de cadastrar motocicletas. <Link to="/admin/categorias/nova" className="underline">Criar categoria</Link></p>}<MotorcycleForm initial={actionData?.draft ?? emptyDraft} categories={categories} error={actionData?.error} submitLabel="Salvar rascunho" /></div>;
}
