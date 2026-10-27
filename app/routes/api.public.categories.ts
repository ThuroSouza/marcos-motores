import { jsonResponse, runPublicApi } from "../server/api.server";
import { listPublicCategories } from "../server/public-repository.server";

export function loader() {
  return runPublicApi(async (db) => jsonResponse({ data: await listPublicCategories(db) }));
}
