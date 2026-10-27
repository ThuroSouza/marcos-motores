import { getDb } from "./db.server";
import { ApiValidationError } from "./errors";

export function jsonResponse(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function runPublicApi(handler: (db: NonNullable<ReturnType<typeof getDb>>) => Promise<Response>) {
  const db = getDb();
  if (!db) return jsonResponse({ error: { code: "database_unavailable", message: "Catálogo temporariamente indisponível." } }, 503);
  try {
    return await handler(db);
  } catch (error) {
    if (error instanceof ApiValidationError) {
      return jsonResponse({ error: { code: "invalid_request", message: error.message } }, 400);
    }
    const requestId = crypto.randomUUID();
    console.error("Public API database error", requestId, error instanceof Error ? error.name : "UnknownError");
    return jsonResponse({ error: { code: "internal_error", message: "Não foi possível carregar os dados.", requestId } }, 500);
  }
}
