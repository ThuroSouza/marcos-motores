import type { getDb } from "./db.server";
import { validCategoryId } from "./categories.server";

type Db = NonNullable<ReturnType<typeof getDb>>;
export type MotorcycleStatus = "available" | "reserved" | "sold";
export type MotorcycleDraft = {
  brand: string; model: string; version: string; slug: string; categoryId: string;
  manufactureYear: string; modelYear: string; mileageKm: string; engineCc: string;
  color: string; fuelType: string; price: string; description: string;
  observations: string; status: MotorcycleStatus; isPublished: boolean;
  isFeatured: boolean; features: string;
};
export type MotorcycleInput = Omit<MotorcycleDraft, "manufactureYear" | "modelYear" | "mileageKm" | "engineCc" | "price" | "features"> & {
  manufactureYear: number; modelYear: number; mileageKm: number; engineCc: number;
  priceCents: number; features: string[];
};

export class MotorcycleError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export function validMotorcycleId(id: string | undefined): id is string { return validCategoryId(id); }

const read = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

export function motorcycleDraftFromForm(form: FormData): MotorcycleDraft {
  const status = read(form, "status");
  return {
    brand: read(form, "brand"), model: read(form, "model"), version: read(form, "version"),
    slug: read(form, "slug"), categoryId: read(form, "categoryId"),
    manufactureYear: read(form, "manufactureYear"), modelYear: read(form, "modelYear"),
    mileageKm: read(form, "mileageKm"), engineCc: read(form, "engineCc"),
    color: read(form, "color"), fuelType: read(form, "fuelType"), price: read(form, "price"),
    description: read(form, "description"), observations: read(form, "observations"),
    status: (["available", "reserved", "sold"].includes(status) ? status : "available") as MotorcycleStatus,
    isPublished: read(form, "isPublished") === "true", isFeatured: read(form, "isFeatured") === "true",
    features: read(form, "features"),
  };
}

function integer(value: string, label: string, min: number, max: number) {
  if (!/^\d+$/.test(value)) throw new MotorcycleError(`${label} deve ser um número inteiro.`);
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result < min || result > max) throw new MotorcycleError(`${label} está fora do intervalo permitido.`);
  return result;
}

export function parseMotorcycleForm(form: FormData): MotorcycleInput {
  const draft = motorcycleDraftFromForm(form);
  for (const [value, label, max] of [
    [draft.brand, "Marca", 100], [draft.model, "Modelo", 120],
    [draft.color, "Cor", 80], [draft.description, "Descrição", 10000],
  ] as const) if (!value || value.length > max) throw new MotorcycleError(`${label} é obrigatório e deve ter até ${max} caracteres.`);
  if (draft.version.length > 120 || draft.fuelType.length > 80 || draft.observations.length > 10000) throw new MotorcycleError("Um dos campos opcionais excede o limite permitido.");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(draft.slug) || draft.slug.length > 240) throw new MotorcycleError("Slug inválido. Use letras minúsculas, números e hífens.");
  if (!validCategoryId(draft.categoryId)) throw new MotorcycleError("Selecione uma categoria válida.");
  const status = read(form, "status");
  if (!["available", "reserved", "sold"].includes(status)) throw new MotorcycleError("Status inválido.");
  if (!["true", "false"].includes(read(form, "isPublished")) || !["true", "false"].includes(read(form, "isFeatured"))) throw new MotorcycleError("Selecione publicação e destaque.");
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(draft.price)) throw new MotorcycleError("Preço inválido. Use reais com até duas casas decimais.");
  const [reais, cents = ""] = draft.price.split(".");
  const priceCents = Number(reais) * 100 + Number(cents.padEnd(2, "0"));
  const features = draft.features.split(/\r?\n/).map((part) => part.trim()).filter(Boolean);
  if (features.length > 20 || features.some((part) => part.length > 160)) throw new MotorcycleError("Informe até 20 características de no máximo 160 caracteres cada.");
  if (new Set(features.map((part) => part.toLocaleLowerCase("pt-BR"))).size !== features.length) throw new MotorcycleError("Remova características repetidas.");
  return {
    ...draft,
    manufactureYear: integer(draft.manufactureYear, "Ano de fabricação", 1950, 2100),
    modelYear: integer(draft.modelYear, "Ano do modelo", 1950, 2102),
    mileageKm: integer(draft.mileageKm, "Quilometragem", 0, 2_147_483_647),
    engineCc: integer(draft.engineCc, "Cilindrada", 1, 10000),
    priceCents, features,
  };
}

function dbError(error: unknown): never {
  if (error && typeof error === "object" && "code" in error) {
    if (error.code === "23505") throw new MotorcycleError("Este slug já está em uso. Escolha outro.", 409);
    if (error.code === "23503") throw new MotorcycleError("Selecione uma categoria existente e ativa.", 409);
    if (error.code === "P0002") throw new MotorcycleError("Motocicleta não encontrada.", 404);
    if (error.code === "P0001") throw new MotorcycleError("Verifique a categoria e as fotos. Para publicar, é preciso ter pelo menos uma foto.", 409);
    if (error.code === "23514" || error.code === "22001" || error.code === "22P02") throw new MotorcycleError("Confira os dados informados.");
  }
  throw error;
}

export async function saveMotorcycle(db: Db, id: string | null, input: MotorcycleInput) {
  try {
    const rows = await db.query(`SELECT save_motorcycle(
      $1::uuid, $2, $3, $4, $5, $6::uuid, $7::smallint, $8::smallint,
      $9::integer, $10::integer, $11, $12, $13::bigint, $14, $15, $16,
      $17::boolean, $18::boolean, $19::jsonb
    ) AS id`, [id, input.brand, input.model, input.version || null, input.slug,
      input.categoryId, input.manufactureYear, input.modelYear, input.mileageKm,
      input.engineCc, input.color, input.fuelType || null, input.priceCents,
      input.description, input.observations || null, input.status, input.isPublished,
      input.isFeatured, JSON.stringify(input.features)]);
    return String(rows[0].id);
  } catch (error) { return dbError(error); }
}

export async function listAdminMotorcycles(db: Db, params: URLSearchParams) {
  const q = (params.get("q") ?? "").trim().slice(0, 100);
  const status = params.get("status") ?? "";
  const rawPage = params.get("page") ?? "";
  const page = /^\d+$/.test(rawPage) ? Math.min(1000, Math.max(1, Number(rawPage))) : 1;
  const values: Array<string | number> = [];
  const where: string[] = [];
  if (q) { values.push(`%${q.replace(/[\\%_]/g, "\\$&")}%`); where.push(`(m.brand ILIKE $${values.length} OR m.model ILIKE $${values.length} OR m.slug ILIKE $${values.length})`); }
  if (["available", "reserved", "sold"].includes(status)) { values.push(status); where.push(`m.status = $${values.length}`); }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const count = await db.query(`SELECT count(*)::integer AS total FROM motorcycles m ${clause}`, values);
  const rows = await db.query(`SELECT m.id, m.brand, m.model, m.slug, m.model_year, m.price_cents,
    m.status, m.is_published, m.is_featured, m.created_at, c.name AS category_name,
    (SELECT count(*)::integer FROM motorcycle_images i WHERE i.motorcycle_id = m.id) AS image_count
    FROM motorcycles m JOIN categories c ON c.id = m.category_id ${clause}
    ORDER BY m.created_at DESC, m.id DESC LIMIT 20 OFFSET $${values.length + 1}`,
    [...values, (page - 1) * 20]);
  return { items: rows.map((row) => ({
    id: String(row.id), brand: String(row.brand), model: String(row.model), slug: String(row.slug),
    modelYear: Number(row.model_year), priceCents: Number(row.price_cents),
    status: String(row.status), isPublished: row.is_published === true,
    isFeatured: row.is_featured === true, categoryName: String(row.category_name),
    imageCount: Number(row.image_count),
  })), total: Number(count[0]?.total ?? 0), page, q, status };
}

export async function getAdminMotorcycle(db: Db, id: string) {
  const rows = await db.query(`SELECT m.*, c.name AS category_name FROM motorcycles m
    JOIN categories c ON c.id = m.category_id WHERE m.id = $1 LIMIT 1`, [id]);
  const row = rows[0];
  if (!row) return null;
  const [features, images] = await Promise.all([
    db.query("SELECT label FROM motorcycle_features WHERE motorcycle_id = $1 ORDER BY display_order, id", [id]),
    db.query(`SELECT id, alt_text, mime_type, byte_size, is_cover, display_order
      FROM motorcycle_images WHERE motorcycle_id = $1
      ORDER BY display_order, created_at, id`, [id]),
  ]);
  const draft: MotorcycleDraft = {
    brand: String(row.brand), model: String(row.model), version: String(row.version ?? ""),
    slug: String(row.slug), categoryId: String(row.category_id),
    manufactureYear: String(row.manufacture_year), modelYear: String(row.model_year),
    mileageKm: String(row.mileage_km), engineCc: String(row.engine_capacity_cc),
    color: String(row.color), fuelType: String(row.fuel_type ?? ""),
    price: (Number(row.price_cents) / 100).toFixed(2),
    description: String(row.description), observations: String(row.observations ?? ""),
    status: row.status as MotorcycleStatus, isPublished: row.is_published === true,
    isFeatured: row.is_featured === true,
    features: features.map((feature) => String(feature.label)).join("\n"),
  };
  return { id, draft, categoryName: String(row.category_name), images: images.map((image) => ({
    id: String(image.id), alt: String(image.alt_text ?? ""), mimeType: String(image.mime_type),
    byteSize: Number(image.byte_size ?? 0), isCover: image.is_cover === true,
    displayOrder: Number(image.display_order),
  })) };
}

