import type { Route } from "./+types/api.public.motorcycles";
import { jsonResponse, runPublicApi } from "../server/api.server";
import { parsePublicCatalogQuery } from "../server/catalog-query.server";
import { listPublicMotorcycles } from "../server/public-repository.server";

export function loader({ request }: Route.LoaderArgs) {
  return runPublicApi(async (db) => {
    const filters = parsePublicCatalogQuery(new URL(request.url).searchParams);
    return jsonResponse({ data: await listPublicMotorcycles(db, filters) });
  });
}
