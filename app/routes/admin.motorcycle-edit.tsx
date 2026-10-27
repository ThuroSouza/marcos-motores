import { data, Link, redirect } from "react-router";
import type { Route } from "./+types/admin.motorcycle-edit";
import { MotorcycleForm } from "../components/admin/MotorcycleForm";
import { PhotoManager } from "../components/admin/PhotoManager";
import { requireAdmin } from "../server/admin-auth.server";
import { assertSameOrigin } from "../server/auth-cookie";
import { requireCategoryDb } from "../server/categories-db.server";
import { listAdminCategories } from "../server/categories.server";
import { moveImage, removeImage, setCoverImage, uploadMotorcycleImage } from "../server/motorcycle-images.server";
import { validateImage } from "../server/image-validation";
import { getImageBucket, getOptionalImageBucket } from "../server/r2.server";
import { getAdminMotorcycle, MotorcycleError, motorcycleDraftFromForm, parseMotorcycleForm, saveMotorcycle, validMotorcycleId, type MotorcycleDraft } from "../server/motorcycles-admin.server";

export function meta() { return [{ title: "Editar motocicleta | Marcos Motores" }, { name: "robots", content: "noindex,nofollow" }]; }
export function headers() { return { "Cache-Control": "private, no-store" }; }

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireAdmin(request);
  if (!validMotorcycleId(params.id)) throw new Response("Motocicleta não encontrada.", { status: 404 });
  const db = requireCategoryDb();
  const [motorcycle, categories] = await Promise.all([getAdminMotorcycle(db, params.id), listAdminCategories(db)]);
  if (!motorcycle) throw new Response("Motocicleta não encontrada.", { status: 404 });
  const notice = new URL(request.url).searchParams.get("notice");
  const message = notice === "created" ? "Rascunho salvo. Adicione as fotos antes de publicar." : notice === "updated" ? "Alterações salvas." : notice === "uploaded" ? "Fotos enviadas." : notice === "cover" ? "Foto de capa atualizada." : notice === "moved" ? "Ordem das fotos atualizada." : notice === "removed" ? "Foto removida." : notice === "cleanupPending" ? "Foto removida do anúncio. A limpeza do arquivo será tentada novamente." : null;
  return data({ motorcycle, categories, message: notice === "created" && !getOptionalImageBucket() ? "Rascunho salvo. Fotos e publicação aguardam um armazenamento de imagens." : message, photosAvailable: Boolean(getOptionalImageBucket()) }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function action({ request, params }: Route.ActionArgs) {
  assertSameOrigin(request);
  await requireAdmin(request);
  if (!validMotorcycleId(params.id)) throw new Response("Motocicleta não encontrada.", { status: 404 });
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");
  const db = requireCategoryDb();
  const back = (notice: string) => `/admin/motos/${params.id}/editar?notice=${notice}#fotos`;
  try {
    if (intent === "save") {
      await saveMotorcycle(db, params.id, parseMotorcycleForm(form));
      throw redirect(back("updated"));
    }
    const motorcycle = await getAdminMotorcycle(db, params.id);
    if (!motorcycle) throw new MotorcycleError("Motocicleta não encontrada.", 404);
    const bucket = getImageBucket();
    if (intent === "upload") {
      const files = form.getAll("photos").filter((value): value is File => value instanceof File && value.size > 0);
      if (files.length === 0 || files.length > 3 || motorcycle.images.length + files.length > 12) throw new MotorcycleError("Envie até 3 fotos por vez, sem ultrapassar 12 imagens por anúncio.");
      const alt = String(form.get("alt") ?? "").trim();
      for (const file of files) await validateImage(file);
      for (const file of files) await uploadMotorcycleImage(db, bucket, params.id, file, alt);
      throw redirect(back("uploaded"));
    }
    const imageId = String(form.get("imageId") ?? "");
    if (!validMotorcycleId(imageId)) throw new MotorcycleError("Imagem inválida.");
    if (intent === "cover") { await setCoverImage(db, params.id, imageId); throw redirect(back("cover")); }
    if (intent === "up" || intent === "down") { await moveImage(db, params.id, imageId, intent === "up" ? -1 : 1); throw redirect(back("moved")); }
    if (intent === "remove") { const cleaned = await removeImage(db, bucket, params.id, imageId); throw redirect(back(cleaned ? "removed" : "cleanupPending")); }
    throw new MotorcycleError("Ação inválida.");
  } catch (error) {
    if (error instanceof MotorcycleError) return data({ error: error.message, draft: intent === "save" ? motorcycleDraftFromForm(form) : null as MotorcycleDraft | null }, { status: error.status });
    if (error && typeof error === "object" && "code" in error && ["P0001", "P0002", "23505", "23514"].includes(String(error.code))) return data({ error: "Não foi possível concluir a operação. Confira o limite de fotos e tente novamente.", draft: null as MotorcycleDraft | null }, { status: 409 });
    throw error;
  }
}

export default function EditMotorcycle({ loaderData, actionData }: Route.ComponentProps) {
  const { motorcycle, categories, message, photosAvailable } = loaderData;
  return <div className="mx-auto max-w-5xl px-5 py-9 sm:px-8 sm:py-12 lg:px-12"><Link to="/admin/motos" className="text-xs font-bold uppercase tracking-widest text-gold hover:underline">← Voltar às motocicletas</Link><p className="eyebrow mt-9">ESTOQUE / EDIÇÃO</p><h1 className="font-display mt-3 text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl">{motorcycle.draft.brand} {motorcycle.draft.model}</h1><p className="mt-3 text-sm text-muted">{photosAvailable ? "Gerencie informações, publicação e fotografias do anúncio." : "Gerencie os dados do rascunho. Fotos e publicação estão indisponíveis."}</p>{message && <p role="status" className="mt-6 border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">{message}</p>}{actionData?.error && actionData.draft === null && <p role="alert" className="mt-6 border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{actionData.error}</p>}<MotorcycleForm initial={actionData?.draft ?? motorcycle.draft} categories={categories} error={actionData?.draft ? actionData.error : undefined} submitLabel="Salvar alterações" photosAvailable={photosAvailable} />{photosAvailable && <PhotoManager images={motorcycle.images} />}<div className="mt-8 flex flex-wrap gap-4 text-sm"><Link to={`/admin/motos/${motorcycle.id}`} className="text-gold hover:underline">Visualizar anúncio no painel</Link><Link to={`/admin/motos/${motorcycle.id}/excluir`} className="text-red-300 hover:underline">Excluir motocicleta</Link></div></div>;
}
