import { data, Form, Link, redirect } from "react-router";
import type { Route } from "./+types/admin.motorcycle-delete";
import { requireAdmin } from "../server/admin-auth.server";
import { assertSameOrigin } from "../server/auth-cookie";
import { requireCategoryDb } from "../server/categories-db.server";
import { deleteMotorcycleWithImages } from "../server/motorcycle-images.server";
import { getImageBucket } from "../server/r2.server";
import { getAdminMotorcycle, validMotorcycleId } from "../server/motorcycles-admin.server";

export function meta() { return [{ title: "Excluir motocicleta | Marcos Motores" }, { name: "robots", content: "noindex,nofollow" }]; }
export function headers() { return { "Cache-Control": "private, no-store" }; }

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireAdmin(request);
  if (!validMotorcycleId(params.id)) throw new Response("Motocicleta não encontrada.", { status: 404 });
  const motorcycle = await getAdminMotorcycle(requireCategoryDb(), params.id);
  if (!motorcycle) throw new Response("Motocicleta não encontrada.", { status: 404 });
  return data({ motorcycle }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function action({ request, params }: Route.ActionArgs) {
  assertSameOrigin(request);
  await requireAdmin(request);
  if (!validMotorcycleId(params.id)) throw new Response("Motocicleta não encontrada.", { status: 404 });
  const form = await request.formData();
  if (form.get("confirm") !== "delete") return data({ error: "Confirme a exclusão." }, { status: 400 });
  const pending = await deleteMotorcycleWithImages(requireCategoryDb(), getImageBucket(), params.id);
  throw redirect(`/admin/motos?notice=deleted${pending ? "&pending=1" : ""}`);
}

export default function DeleteMotorcycle({ loaderData, actionData }: Route.ComponentProps) {
  const { motorcycle } = loaderData;
  const moto = motorcycle.draft;
  return <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12 lg:px-12"><Link to="/admin/motos" className="text-xs font-bold uppercase tracking-widest text-gold hover:underline">← Voltar às motocicletas</Link><div className="mt-9 max-w-2xl border border-red-400/25 bg-charcoal p-6 sm:p-9"><p className="eyebrow">CONFIRMAÇÃO</p><h1 className="font-display mt-3 text-3xl font-bold tracking-[-0.04em] text-white">Excluir {moto.brand} {moto.model}?</h1><p className="mt-4 text-sm leading-6 text-muted">O anúncio, suas características e {motorcycle.images.length} {motorcycle.images.length === 1 ? "foto" : "fotos"} serão removidos. A exclusão não pode ser desfeita. Motocicletas vendidas permanecem no histórico até serem excluídas manualmente aqui.</p>{actionData?.error && <p role="alert" className="mt-5 border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{actionData.error}</p>}<div className="mt-8 flex flex-wrap gap-3"><Form method="post"><input type="hidden" name="confirm" value="delete" /><button type="submit" className="inline-flex min-h-12 items-center bg-red-500 px-5 text-xs font-bold uppercase tracking-widest text-white hover:bg-red-400">Confirmar exclusão</button></Form><Link to={`/admin/motos/${motorcycle.id}`} className="button-secondary">Cancelar</Link></div></div></div>;
}
