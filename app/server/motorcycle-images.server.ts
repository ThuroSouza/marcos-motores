import type { getDb } from "./db.server";
import { MotorcycleError } from "./motorcycles-admin.server";
import { allowedImageTypes, validateImage } from "./image-validation";

type Db = NonNullable<ReturnType<typeof getDb>>;
export async function uploadMotorcycleImage(db: Db, bucket: R2Bucket, motorcycleId: string, file: File, alt: string) {
  if (alt.length > 240) throw new MotorcycleError("Texto alternativo deve ter até 240 caracteres.");
  const bytes = await validateImage(file);
  const key = `motorcycles/${motorcycleId}/${crypto.randomUUID()}.${allowedImageTypes.get(file.type)}`;
  await db.query("INSERT INTO r2_delete_jobs (storage_key) VALUES ($1)", [key]);
  try {
    await bucket.put(key, bytes, { httpMetadata: { contentType: file.type } });
    await db.query("SELECT attach_motorcycle_image($1::uuid, $2, $3, $4, $5::integer)", [motorcycleId, key, alt || null, file.type, file.size]);
  } catch (error) {
    try {
      await bucket.delete(key);
      await db.query("DELETE FROM r2_delete_jobs WHERE storage_key = $1", [key]);
    } catch { /* O registro pendente permite nova limpeza. */ }
    throw error;
  }
  try { await db.query("DELETE FROM r2_delete_jobs WHERE storage_key = $1", [key]); }
  catch { /* A limpeza pendente ignora objetos vinculados a imagens válidas. */ }
}

export async function setCoverImage(db: Db, motorcycleId: string, imageId: string) {
  await db.query("SELECT set_motorcycle_cover($1::uuid, $2::uuid)", [motorcycleId, imageId]);
}

export async function moveImage(db: Db, motorcycleId: string, imageId: string, direction: -1 | 1) {
  await db.query("SELECT move_motorcycle_image($1::uuid, $2::uuid, $3::integer)", [motorcycleId, imageId, direction]);
}

async function deleteStoredObject(db: Db, bucket: R2Bucket, key: string) {
  await bucket.delete(key);
  await db.query("DELETE FROM r2_delete_jobs WHERE storage_key = $1", [key]);
}

export async function removeImage(db: Db, bucket: R2Bucket, motorcycleId: string, imageId: string) {
  const rows = await db.query("SELECT storage_key FROM motorcycle_images WHERE id = $1 AND motorcycle_id = $2", [imageId, motorcycleId]);
  if (!rows[0]) throw new MotorcycleError("Imagem não encontrada.", 404);
  const key = String(rows[0].storage_key);
  await db.query("SELECT remove_motorcycle_image($1::uuid, $2::uuid)", [motorcycleId, imageId]);
  try { await deleteStoredObject(db, bucket, key); }
  catch { return false; }
  return true;
}

export async function deleteMotorcycleWithImages(db: Db, bucket: R2Bucket, motorcycleId: string) {
  const rows = await db.query("SELECT storage_key FROM motorcycle_images WHERE motorcycle_id = $1", [motorcycleId]);
  await db.query("SELECT delete_motorcycle($1::uuid)", [motorcycleId]);
  let pending = 0;
  for (const row of rows) {
    try { await deleteStoredObject(db, bucket, String(row.storage_key)); }
    catch { pending++; }
  }
  return pending;
}

export async function cleanupPendingImages(db: Db, bucket: R2Bucket) {
  const rows = await db.query(`SELECT j.storage_key FROM r2_delete_jobs j
    LEFT JOIN motorcycle_images i ON i.storage_key = j.storage_key
    WHERE j.created_at < now() - interval '5 minutes' AND i.id IS NULL
    ORDER BY j.created_at LIMIT 50`);
  let cleaned = 0;
  for (const row of rows) {
    try { await deleteStoredObject(db, bucket, String(row.storage_key)); cleaned++; }
    catch { /* Permanece na fila para nova tentativa. */ }
  }
  return cleaned;
}

export async function getImageObject(db: Db, bucket: R2Bucket, imageId: string, publicOnly: boolean) {
  const rows = await db.query(`SELECT i.storage_key FROM motorcycle_images i
    JOIN motorcycles m ON m.id = i.motorcycle_id JOIN categories c ON c.id = m.category_id
    WHERE i.id = $1 ${publicOnly ? "AND m.is_published = true AND c.is_active = true" : ""} LIMIT 1`, [imageId]);
  if (!rows[0]) return null;
  return bucket.get(String(rows[0].storage_key));
}

export function imageResponse(object: R2ObjectBody | null, publicOnly: boolean) {
  if (!object) return new Response("Imagem não encontrada.", { status: 404, headers: { "Cache-Control": "no-store" } });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Content-Type", object.httpMetadata?.contentType ?? "application/octet-stream");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("ETag", object.httpEtag);
  headers.set("Cache-Control", publicOnly ? "public, max-age=3600" : "private, no-store");
  return new Response(object.body, { headers });
}
