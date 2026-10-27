import { jsonResponse, runPublicApi } from "../server/api.server";
import { getPublicStoreSettings } from "../server/public-repository.server";

export function loader() {
  return runPublicApi(async (db) => jsonResponse({ data: await getPublicStoreSettings(db) }));
}
