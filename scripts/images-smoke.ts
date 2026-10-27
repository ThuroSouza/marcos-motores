import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { validateImage } from "../app/server/image-validation";
import { cleanupPendingImages, getImageObject, removeImage, uploadMotorcycleImage } from "../app/server/motorcycle-images.server";

const database = await PGlite.create();
const db = { query: async (sql: string, values: Array<string | number | boolean | null> = []) => (await database.query(sql, values)).rows } as unknown as Parameters<typeof uploadMotorcycleImage>[0];
const objects = new Map<string, Uint8Array>();
let failDelete = false;
const bucket = {
  put: async (key: string, bytes: Uint8Array) => { objects.set(key, bytes); return {}; },
  delete: async (key: string) => { if (failDelete) throw new Error("Falha simulada no R2"); objects.delete(key); },
  get: async (key: string) => objects.has(key) ? { key } : null,
} as unknown as R2Bucket;

try {
  for (const file of ["001_initial.sql", "002_motorcycle_media.sql"]) await database.exec(await readFile(new URL(`../database/migrations/${file}`, import.meta.url), "utf8"));
  const category = await database.query<{ id: string }>("INSERT INTO categories (name, slug) VALUES ('Teste', 'teste') RETURNING id");
  const moto = await database.query<{ id: string }>(`INSERT INTO motorcycles (brand, model, slug, category_id, manufacture_year, model_year,
    mileage_km, engine_capacity_cc, color, price_cents, description) VALUES ('Marca', 'Modelo', 'modelo', $1, 2023, 2024,
    0, 500, 'Preto', 1000000, 'Teste') RETURNING id`, [category.rows[0].id]);
  const id = moto.rows[0].id;
  const jpeg = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00])], "foto.jpg", { type: "image/jpeg" });
  await validateImage(jpeg);
  await assert.rejects(validateImage(new File(["não é foto"], "falsa.jpg", { type: "image/jpeg" })));
  await uploadMotorcycleImage(db, bucket, id, jpeg, "Foto de teste");
  const images = await database.query<{ id: string; storage_key: string }>("SELECT id, storage_key FROM motorcycle_images WHERE motorcycle_id = $1", [id]);
  assert.equal(images.rows.length, 1);
  assert.equal(objects.has(images.rows[0].storage_key), true);
  assert.equal((await database.query("SELECT * FROM r2_delete_jobs")).rows.length, 0);
  await database.query("INSERT INTO r2_delete_jobs (storage_key, created_at) VALUES ($1, now() - interval '6 minutes')", [images.rows[0].storage_key]);
  assert.equal(await cleanupPendingImages(db, bucket), 0, "Limpeza não pode apagar foto ainda vinculada");
  assert.equal(objects.has(images.rows[0].storage_key), true);
  await database.query("DELETE FROM r2_delete_jobs WHERE storage_key = $1", [images.rows[0].storage_key]);
  assert.equal(await getImageObject(db, bucket, images.rows[0].id, true), null, "Rascunho não expõe imagem na rota pública");
  await database.query("UPDATE motorcycles SET is_published = true WHERE id = $1", [id]);
  assert.ok(await getImageObject(db, bucket, images.rows[0].id, true));

  failDelete = true;
  assert.equal(await removeImage(db, bucket, id, images.rows[0].id), false);
  assert.equal((await database.query("SELECT * FROM motorcycle_images")).rows.length, 0);
  assert.equal((await database.query("SELECT * FROM r2_delete_jobs")).rows.length, 1);
  assert.equal((await database.query<{ is_published: boolean }>("SELECT is_published FROM motorcycles WHERE id = $1", [id])).rows[0].is_published, false);
  await database.query("UPDATE r2_delete_jobs SET created_at = now() - interval '6 minutes'");
  failDelete = false;
  assert.equal(await cleanupPendingImages(db, bucket), 1);
  assert.equal(objects.size, 0);
  assert.equal((await database.query("SELECT * FROM r2_delete_jobs")).rows.length, 0);
  console.log("Upload, validação, leitura protegida e limpeza após falha simulada de R2 validados.");
} finally {
  await database.close();
}
