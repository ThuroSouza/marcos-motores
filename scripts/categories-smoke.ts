import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { CategoryError, createCategory, deleteCategory, getAdminCategory, listAdminCategories, parseCategoryForm, updateCategory } from "../app/server/categories.server";
import { listPublicCategories } from "../app/server/public-repository.server";

const database = await PGlite.create();
const db = { query: async (sql: string, values: Array<string | number | boolean | null> = []) => (await database.query(sql, values)).rows };
const categoryDb = db as unknown as Parameters<typeof createCategory>[0];
const publicDb = db as unknown as Parameters<typeof listPublicCategories>[0];

try {
  await database.exec(await readFile(new URL("../database/migrations/001_initial.sql", import.meta.url), "utf8"));
  const form = new FormData();
  form.set("name", "Trail"); form.set("slug", "trail"); form.set("description", "Motos para estrada e terra"); form.set("isActive", "true");
  const input = parseCategoryForm(form);
  assert.equal(input.slug, "trail");
  assert.equal((await listAdminCategories(categoryDb)).length, 0);

  const id = await createCategory(categoryDb, input);
  assert.equal((await listAdminCategories(categoryDb))[0].motorcycleCount, 0);
  assert.equal((await listPublicCategories(publicDb)).length, 1);
  await assert.rejects(createCategory(categoryDb, input), (error: unknown) => error instanceof CategoryError && error.status === 409);

  form.set("slug", "Trail Incorreto");
  assert.throws(() => parseCategoryForm(form), CategoryError);
  form.set("slug", "trail");
  await updateCategory(categoryDb, id, { ...input, name: "Trail revisada", isActive: false });
  assert.equal((await getAdminCategory(categoryDb, id))?.name, "Trail revisada");
  assert.equal((await listPublicCategories(publicDb)).length, 0, "Categoria inativa não pode aparecer na API pública");

  await database.query(`INSERT INTO motorcycles (brand, model, slug, category_id, manufacture_year, model_year, mileage_km,
    engine_capacity_cc, color, price_cents, description) VALUES ('Marca', 'Modelo', 'modelo', $1, 2023, 2024, 0, 500, 'Preto', 1000000, 'Teste')`, [id]);
  assert.equal((await getAdminCategory(categoryDb, id))?.motorcycleCount, 1);
  await assert.rejects(deleteCategory(categoryDb, id), (error: unknown) => error instanceof CategoryError && error.status === 409);
  await database.query("DELETE FROM motorcycles WHERE category_id = $1", [id]);
  await deleteCategory(categoryDb, id);
  assert.equal(await getAdminCategory(categoryDb, id), null);
  console.log("CRUD, validação, slug único, visibilidade e dependência de categorias validados.");
} finally {
  await database.close();
}
