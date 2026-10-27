import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { parsePublicCatalogQuery } from "../app/server/catalog-query.server";
import { getPublicCatalogOptions, getPublicMotorcycle, listCategoryShowcase, listPublicMotorcycles, listSimilarMotorcycles } from "../app/server/public-repository.server";

const database = await PGlite.create();
const db = { query: async (sql: string, values: Array<string | number | boolean> = []) => (await database.query(sql, values)).rows } as unknown as Parameters<typeof listPublicMotorcycles>[0];
const filters = (params: Record<string, string> = {}) => parsePublicCatalogQuery(new URLSearchParams(params));

try {
  for (const file of ["001_initial.sql", "002_motorcycle_media.sql"]) await database.exec(await readFile(new URL(`../database/migrations/${file}`, import.meta.url), "utf8"));
  const cat = await database.query<{ id: string }>("INSERT INTO categories (name, slug) VALUES ('Trail', 'trail') RETURNING id");
  const categoryId = cat.rows[0].id;
  await database.query("INSERT INTO categories (name, slug) VALUES ('Custom', 'custom')");
  const insert = async (slug: string, model: string, status: string, published: boolean, featured: boolean, year: number, price: number) => {
    const rows = await database.query<{ id: string }>(`INSERT INTO motorcycles (brand, model, slug, category_id,
      manufacture_year, model_year, mileage_km, engine_capacity_cc, color, price_cents, description,
      status, is_published, is_featured) VALUES ('Marca', $1, $2, $3, $4, $4, 1000, 500, 'Preto', $5,
      'Descrição real de teste', $6, $7, $8) RETURNING id`, [model, slug, categoryId, year, price, status, published, featured]);
    return rows.rows[0].id;
  };
  const a = await insert("moto-a", "Modelo A", "available", true, true, 2025, 3000000);
  const b = await insert("moto-b", "Modelo B", "reserved", true, false, 2024, 4000000);
  await insert("moto-c", "Modelo C", "available", false, true, 2025, 3500000);
  await insert("moto-d", "Modelo D", "sold", true, false, 2023, 2000000);
  await database.query("INSERT INTO motorcycle_images (motorcycle_id, storage_key, mime_type, is_cover) VALUES ($1, 'a.jpg', 'image/jpeg', true)", [a]);
  await database.query("INSERT INTO motorcycle_features (motorcycle_id, label) VALUES ($1, 'ABS')", [a]);

  const defaultCatalog = await listPublicMotorcycles(db, filters());
  assert.equal(defaultCatalog.total, 2);
  assert.equal(defaultCatalog.items.some((item) => item.slug === "moto-c"), false);
  assert.equal(defaultCatalog.items.some((item) => item.slug === "moto-d"), false);
  assert.equal(defaultCatalog.items.find((item) => item.slug === "moto-a")?.coverImage?.url.startsWith("/api/public/images/"), true);
  assert.equal((await listPublicMotorcycles(db, filters({ featured: "true" }))).total, 1);
  assert.equal((await listPublicMotorcycles(db, filters({ status: "sold" }))).total, 1);
  assert.equal((await listPublicMotorcycles(db, filters({ status: "all" }))).total, 3);
  assert.equal((await listPublicMotorcycles(db, filters({ brand: "Marca", category: "trail", year: "2025", minPrice: "30000", maxPrice: "35000", minCc: "400", maxCc: "600" }))).total, 1);
  assert.equal((await listPublicMotorcycles(db, filters({ q: "%' OR TRUE --" }))).total, 0);
  assert.equal((await listPublicMotorcycles(db, filters({ sort: "price-asc" }))).items[0].slug, "moto-a");
  const page = await listPublicMotorcycles(db, filters({ page: "2", limit: "1" }));
  assert.equal(page.totalPages, 2); assert.equal(page.items.length, 1);

  const detail = await getPublicMotorcycle(db, "moto-a");
  assert.equal(detail?.features[0], "ABS");
  assert.equal(detail?.images[0].url.startsWith("/api/public/images/"), true);
  assert.equal((await listSimilarMotorcycles(db, detail!))[0].slug, "moto-b");
  const options = await getPublicCatalogOptions(db);
  assert.deepEqual(options.brands, ["Marca"]);
  assert.deepEqual(options.years, [2025, 2024, 2023]);
  assert.equal(options.categories.length, 2);
  assert.equal((await listCategoryShowcase(db)).find((item) => item.slug === "trail")?.imageUrl?.startsWith("/api/public/images/"), true);

  await database.query("UPDATE motorcycles SET is_published = false WHERE id = $1", [b]);
  assert.equal((await listPublicMotorcycles(db, filters())).total, 1, "Despublicação precisa refletir na próxima consulta");
  await database.query("UPDATE categories SET is_active = false WHERE id = $1", [categoryId]);
  assert.equal((await listPublicMotorcycles(db, filters({ status: "all" }))).total, 0);
  assert.equal(await getPublicMotorcycle(db, "moto-a"), null);
  console.log("Catálogo real, filtros, paginação, detalhes e atualização da publicação validados.");
} finally {
  await database.close();
}
