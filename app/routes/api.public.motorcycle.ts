import type { Route } from "./+types/api.public.motorcycle";
import { jsonResponse, runPublicApi } from "../server/api.server";
import { getPublicMotorcycle } from "../server/public-repository.server";

export function loader({ params }: Route.LoaderArgs) {
  if (!params.slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(params.slug)) {
    return jsonResponse({ error: { code: "not_found", message: "Anúncio não encontrado." } }, 404);
  }
  return runPublicApi(async (db) => {
    const motorcycle = await getPublicMotorcycle(db, params.slug);
    if (!motorcycle) return jsonResponse({ error: { code: "not_found", message: "Anúncio não encontrado." } }, 404);
    return jsonResponse({ data: motorcycle });
  });
}
