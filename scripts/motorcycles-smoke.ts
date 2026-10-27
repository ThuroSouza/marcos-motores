import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { getAdminMotorcycle, listAdminMotorcycles, parseMotorcycleForm, saveMotorcycle } from "../app/server/motorcycles-admin.server";
import { getPublicMotorcycle, listPublicMotorcycles } from "../app/server/public-repository.server";
import { parsePublicCatalogQuery } from "../app/server/catalog-query.server";

const database = await PGlite.create();
const db = { query: async (sql: string, values: Array<string | number | boolean | null> = []) => (await database.query(sql, values)).rows };
const adminDb = db as unknown as Parameters<typeof saveMotorcycle>[0];
const publicDb = db as unknown as Parameters<typeof listPublicMotorcycles>[0];

try {
  for (const file of ["001_initial.sql", "002_motorcycle_media.sql"]) await database.exec(await readFile(new URL(`../database/migrations/${file}`, import.meta.url), "utf8"));
  const category = await database.query<{ id: string }>("INSERT INTO categories (name, slug) VALUES ('Trail', 'trail') RETURNING id");
  const categoryId = category.rows[0].id;
  const form = new FormData();
  const values = { brand: "Marca", model: "Adventure", slug: "marca-adventure-2025", categoryId,
    manufactureYear: "2024", modelYear: "2025", mileageKm: "1200", engineCc: "500",
    color: "Preto", price: "34567.89", description: "Moto de teste", status: "available",
    isPublished: "false", isFeatured: "true", features: "ABS\nPainel digital" };
  for (const [key, value] of Object.entries(values)) form.set(key, value);
  const input = parseMotorcycleForm(form);
  assert.equal(input.priceCents, 3456789);
  const id = await saveMotorcycle(adminDb, null, input);
  assert.equal((await getAdminMotorcycle(adminDb, id))?.draft.features, "ABS\nPainel digital");
  assert.equal((await listAdminMotorcycles(adminDb, new URLSearchParams())).total, 1);
  assert.equal((await listPublicMotorcycles(publicDb, parsePublicCatalogQuery(new URLSearchParams()))).total, 0);

  await assert.rejects(saveMotorcycle(adminDb, id, { ...input, isPublished: true }), "Publicação sem foto deve falhar");
  const image1 = await database.query<{ id: string }>("SELECT attach_motorcycle_image($1::uuid, 'motorcycles/teste/a.jpg', 'Vista frontal', 'image/jpeg', 1234) AS id", [id]);
  const image2 = await database.query<{ id: string }>("SELECT attach_motorcycle_image($1::uuid, 'motorcycles/teste/b.jpg', 'Vista lateral', 'image/jpeg', 2345) AS id", [id]);
  await database.query("SELECT move_motorcycle_image($1::uuid, $2::uuid, 1)", [id, image1.rows[0].id]);
  assert.equal((await getAdminMotorcycle(adminDb, id))?.images[0].id, image2.rows[0].id);
  await database.query("SELECT set_motorcycle_cover($1::uuid, $2::uuid)", [id, image2.rows[0].id]);
  assert.equal((await getAdminMotorcycle(adminDb, id))?.images.find((image) => image.isCover)?.id, image2.rows[0].id);

  await saveMotorcycle(adminDb, id, { ...input, status: "sold", isPublished: true });
  assert.equal((await getPublicMotorcycle(publicDb, input.slug))?.status, "sold");
  assert.equal((await listPublicMotorcycles(publicDb, parsePublicCatalogQuery(new URLSearchParams()))).total, 0, "Vendidas não aparecem por padrão");
  assert.equal((await listPublicMotorcycles(publicDb, parsePublicCatalogQuery(new URLSearchParams({ status: "sold" })))).total, 1);
  assert.equal((await getPublicMotorcycle(publicDb, input.slug))?.images[0].url.startsWith("/api/public/images/"), true);

  await database.query("SELECT remove_motorcycle_image($1::uuid, $2::uuid)", [id, image2.rows[0].id]);
  assert.equal((await getAdminMotorcycle(adminDb, id))?.images[0].isCover, true);
  assert.equal((await database.query<{ storage_key: string }>("SELECT storage_key FROM r2_delete_jobs")).rows.length, 1);
  await database.query("SELECT delete_motorcycle($1::uuid)", [id]);
  assert.equal((await listAdminMotorcycles(adminDb, new URLSearchParams())).total, 0);
  assert.equal((await database.query<{ storage_key: string }>("SELECT storage_key FROM r2_delete_jobs")).rows.length, 2);
  console.log("Cadastro, publicação, fotos, capa, ordem, status e exclusão validados em PostgreSQL isolado.");
} finally {
  await database.close();
}
