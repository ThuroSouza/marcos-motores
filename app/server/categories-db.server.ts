import { getDb } from "./db.server";

export function requireCategoryDb() {
  const db = getDb();
  if (!db) throw new Response("Banco de dados indisponível.", { status: 503 });
  return db;
}
