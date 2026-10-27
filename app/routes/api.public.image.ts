import type { Route } from "./+types/api.public.image";
import { getDb } from "../server/db.server";
import { getImageObject, imageResponse } from "../server/motorcycle-images.server";
import { getImageBucket } from "../server/r2.server";
import { validMotorcycleId } from "../server/motorcycles-admin.server";

export async function loader({ params }: Route.LoaderArgs) {
  if (!validMotorcycleId(params.imageId)) return new Response("Imagem não encontrada.", { status: 404 });
  const db = getDb();
  if (!db) return new Response("Imagem indisponível.", { status: 503 });
  return imageResponse(await getImageObject(db, getImageBucket(), params.imageId, true), true);
}
