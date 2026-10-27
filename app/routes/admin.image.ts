import type { Route } from "./+types/admin.image";
import { requireAdmin } from "../server/admin-auth.server";
import { requireCategoryDb } from "../server/categories-db.server";
import { getImageObject, imageResponse } from "../server/motorcycle-images.server";
import { getImageBucket } from "../server/r2.server";
import { validMotorcycleId } from "../server/motorcycles-admin.server";

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireAdmin(request);
  if (!validMotorcycleId(params.imageId)) return new Response("Imagem não encontrada.", { status: 404 });
  return imageResponse(await getImageObject(requireCategoryDb(), getImageBucket(), params.imageId, false), false);
}
