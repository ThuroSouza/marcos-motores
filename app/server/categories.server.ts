import type { getDb } from "./db.server";

type Db = NonNullable<ReturnType<typeof getDb>>;
export type CategoryInput = { name: string; slug: string; description: string; isActive: boolean };
export type AdminCategory = CategoryInput & { id: string; motorcycleCount: number; createdAt: string; updatedAt: string };

export class CategoryError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export function validCategoryId(id: string | undefined): id is string {
  return !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export function parseCategoryForm(form: FormData): CategoryInput {
  const name = String(form.get("name") ?? "").trim();
  const slug = String(form.get("slug") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const active = String(form.get("isActive") ?? "");
  if (!name || name.length > 120) throw new CategoryError("Informe um nome de até 120 caracteres.");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 140) throw new CategoryError("O slug deve ter até 140 caracteres, com letras minúsculas, números e hífens entre palavras.");
  if (description.length > 2000) throw new CategoryError("A descrição deve ter até 2.000 caracteres.");
  if (!['true', 'false'].includes(active)) throw new CategoryError("Selecione o status da categoria.");
  return { name, slug, description, isActive: active === "true" };
}

export function categoryDraftFromForm(form: FormData): CategoryInput {
  return {
    name: String(form.get("name") ?? "").slice(0, 120),
    slug: String(form.get("slug") ?? "").slice(0, 140),
    description: String(form.get("description") ?? "").slice(0, 2000),
    isActive: form.get("isActive") !== "false",
  };
}

function categoryFromRow(row: Record<string, unknown>): AdminCategory {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: row.description ? String(row.description) : "",
    isActive: row.is_active === true,
    motorcycleCount: Number(row.motorcycle_count ?? 0),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function listAdminCategories(db: Db) {
  const rows = await db.query(`
    SELECT c.id, c.name, c.slug, c.description, c.is_active, c.created_at, c.updated_at,
      count(m.id)::integer AS motorcycle_count
    FROM categories c LEFT JOIN motorcycles m ON m.category_id = c.id
    GROUP BY c.id ORDER BY c.name ASC, c.id ASC
  `);
  return rows.map(categoryFromRow);
}

export async function getAdminCategory(db: Db, id: string) {
  const rows = await db.query(`
    SELECT c.id, c.name, c.slug, c.description, c.is_active, c.created_at, c.updated_at,
      count(m.id)::integer AS motorcycle_count
    FROM categories c LEFT JOIN motorcycles m ON m.category_id = c.id
    WHERE c.id = $1 GROUP BY c.id
  `, [id]);
  return rows[0] ? categoryFromRow(rows[0]) : null;
}

function mapWriteError(error: unknown): never {
  if (error && typeof error === "object" && "code" in error) {
    if (error.code === "23505") throw new CategoryError("Este slug já está em uso. Escolha outro.", 409);
    if (error.code === "23503") throw new CategoryError("Esta categoria possui motocicletas vinculadas e não pode ser excluída.", 409);
    if (error.code === "23514" || error.code === "22001") throw new CategoryError("Confira os dados informados.");
  }
  throw error;
}

export async function createCategory(db: Db, input: CategoryInput) {
  try {
    const rows = await db.query(`
      INSERT INTO categories (name, slug, description, is_active)
      VALUES ($1, $2, $3, $4) RETURNING id
    `, [input.name, input.slug, input.description || null, input.isActive]);
    return String(rows[0].id);
  } catch (error) { return mapWriteError(error); }
}

export async function updateCategory(db: Db, id: string, input: CategoryInput) {
  try {
    const rows = await db.query(`
      UPDATE categories SET name = $2, slug = $3, description = $4, is_active = $5
      WHERE id = $1 RETURNING id
    `, [id, input.name, input.slug, input.description || null, input.isActive]);
    if (!rows[0]) throw new CategoryError("Categoria não encontrada.", 404);
  } catch (error) { mapWriteError(error); }
}

export async function deleteCategory(db: Db, id: string) {
  const linked = await db.query("SELECT count(*)::integer AS total FROM motorcycles WHERE category_id = $1", [id]);
  if (Number(linked[0]?.total ?? 0) > 0) throw new CategoryError("Esta categoria possui motocicletas vinculadas e não pode ser excluída.", 409);
  try {
    const rows = await db.query("DELETE FROM categories WHERE id = $1 RETURNING id", [id]);
    if (!rows[0]) throw new CategoryError("Categoria não encontrada.", 404);
  } catch (error) { mapWriteError(error); }
}
