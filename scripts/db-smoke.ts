import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { parsePublicCatalogQuery } from "../app/server/catalog-query.server";
import { getPublicMotorcycle, listPublicCategories, listPublicMotorcycles } from "../app/server/public-repository.server";

const database = await PGlite.create();
try {
  await database.exec(await readFile(new URL("../database/migrations/001_initial.sql", import.meta.url), "utf8"));
  const settings = await database.query<{ store_name: string; whatsapp_number: string | null }>("SELECT store_name, whatsapp_number FROM store_settings");
  assert.deepEqual(settings.rows, [{ store_name: "Marcos Motores", whatsapp_number: null }]);

  const category = await database.query<{ id: string }>("INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING id", ["Teste", "teste"]);
  const categoryId = category.rows[0].id;
  const motorcycle = await database.query<{ id: string }>(`
    INSERT INTO motorcycles (brand, model, slug, category_id, manufacture_year, model_year,
      mileage_km, engine_capacity_cc, color, price_cents, description, observations)
    VALUES ('Marca de teste', 'Modelo de teste', 'modelo-de-teste', $1, 2023, 2024,
      12000, 500, 'Preta', 3000000, 'Descrição de teste', 'NOTA ADMINISTRATIVA PRIVADA') RETURNING id
  `, [categoryId]);
  const motorcycleId = motorcycle.rows[0].id;

  await assert.rejects(database.query("INSERT INTO categories (name, slug) VALUES ('Duplicada', 'teste')"));
  await assert.rejects(database.query("UPDATE motorcycles SET status = 'unknown' WHERE id = $1", [motorcycleId]));
  await assert.rejects(database.query("DELETE FROM categories WHERE id = $1", [categoryId]));

  const adapter = {
    query: async (query: string, values: Array<string | number | boolean> = []) => (await database.query(query, values)).rows,
  } as unknown as Parameters<typeof listPublicMotorcycles>[0];
  const defaultFilters = parsePublicCatalogQuery(new URLSearchParams());
  assert.equal((await listPublicMotorcycles(adapter, defaultFilters)).total, 0, "Anúncio não publicado deve ficar oculto");

  await database.query("UPDATE motorcycles SET is_published = true WHERE id = $1", [motorcycleId]);
  await database.query("INSERT INTO motorcycle_images (motorcycle_id, storage_key, mime_type, is_cover) VALUES ($1, 'teste/cover.jpg', 'image/jpeg', true)", [motorcycleId]);
  await database.query("INSERT INTO motorcycle_features (motorcycle_id, label) VALUES ($1, 'Freios ABS')", [motorcycleId]);
  await assert.rejects(database.query("INSERT INTO motorcycle_images (motorcycle_id, storage_key, mime_type, is_cover) VALUES ($1, 'teste/other.jpg', 'image/jpeg', true)", [motorcycleId]));

  const catalog = await listPublicMotorcycles(adapter, defaultFilters);
  assert.equal(catalog.total, 1);
  assert.equal(catalog.items[0].brand, "Marca de teste");
  assert.equal(JSON.stringify(catalog).includes("NOTA ADMINISTRATIVA PRIVADA"), false);
  assert.equal(JSON.stringify(catalog).includes("teste/cover.jpg"), false);
  const detail = await getPublicMotorcycle(adapter, "modelo-de-teste");
  assert.equal(detail?.features[0], "Freios ABS");
  assert.equal(detail?.images.length, 1);
  assert.equal(JSON.stringify(detail).includes("NOTA ADMINISTRATIVA PRIVADA"), false);
  assert.equal(JSON.stringify(detail).includes("teste/cover.jpg"), false);

  const injected = parsePublicCatalogQuery(new URLSearchParams({ q: "%' OR TRUE --" }));
  assert.equal((await listPublicMotorcycles(adapter, injected)).total, 0, "Busca deve usar parâmetros SQL");

  await database.query("UPDATE motorcycles SET status = 'sold' WHERE id = $1", [motorcycleId]);
  assert.equal((await listPublicMotorcycles(adapter, defaultFilters)).total, 0, "Vendidas ficam fora do catálogo padrão");
  const allFilters = parsePublicCatalogQuery(new URLSearchParams({ status: "all" }));
  assert.equal((await listPublicMotorcycles(adapter, allFilters)).total, 1);
  await database.query("UPDATE categories SET is_active = false WHERE id = $1", [categoryId]);
  assert.equal((await listPublicMotorcycles(adapter, allFilters)).total, 0, "Categoria inativa fica fora da API pública");
  assert.equal((await listPublicCategories(adapter)).length, 0);

  console.log("Migration e consultas públicas validadas em PostgreSQL local isolado.");
} finally {
  await database.close();
}
