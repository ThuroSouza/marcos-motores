import type { getDb } from "./db.server";
import { buildCatalogWhere, orderBySql, type PublicCatalogQuery } from "./catalog-query.server";
import type { MotorcycleSummary } from "../types/motorcycle";

type Db = NonNullable<ReturnType<typeof getDb>>;
type QueryValue = string | number | boolean;

interface MotorcycleRow {
  id: string;
  slug: string;
  brand: string;
  model: string;
  version: string | null;
  category_slug: string;
  category_name: string;
  manufacture_year: number;
  model_year: number;
  mileage_km: number;
  engine_capacity_cc: number;
  color: string;
  fuel_type: string | null;
  price_cents: string | number;
  description: string;
  status: "available" | "reserved" | "sold";
  is_featured: boolean;
  created_at: string;
  cover_id?: string | null;
  cover_alt?: string | null;
}

const motorcycleColumns = `
  m.id, m.slug, m.brand, m.model, m.version,
  c.slug AS category_slug, c.name AS category_name,
  m.manufacture_year, m.model_year, m.mileage_km, m.engine_capacity_cc,
  m.color, m.fuel_type, m.price_cents, m.description, m.status,
  m.is_featured, m.created_at
`;

const coverJoin = `
  LEFT JOIN LATERAL (
    SELECT i.id AS cover_id, i.alt_text AS cover_alt
    FROM motorcycle_images i
    WHERE i.motorcycle_id = m.id
    ORDER BY i.is_cover DESC, i.display_order ASC, i.created_at ASC
    LIMIT 1
  ) cover ON true
`;

async function queryRows<T>(db: Db, query: string, values: QueryValue[] = []) {
  return await db.query(query, values) as T[];
}

function mapMotorcycle(row: MotorcycleRow) {
  return {
    id: row.id,
    slug: row.slug,
    brand: row.brand,
    model: row.model,
    version: row.version,
    category: { slug: row.category_slug, name: row.category_name },
    manufactureYear: row.manufacture_year,
    modelYear: row.model_year,
    mileageKm: row.mileage_km,
    engineCc: row.engine_capacity_cc,
    color: row.color,
    fuelType: row.fuel_type,
    priceCents: Number(row.price_cents),
    description: row.description,
    status: row.status,
    isFeatured: row.is_featured,
    createdAt: row.created_at,
  };
}

function mapSummary(row: MotorcycleRow): MotorcycleSummary {
  return {
    ...mapMotorcycle(row),
    coverImage: row.cover_id ? { id: row.cover_id, alt: row.cover_alt ?? null, url: `/api/public/images/${row.cover_id}` } : null,
  };
}

export async function listPublicMotorcycles(db: Db, filters: PublicCatalogQuery) {
  const { whereSql, values } = buildCatalogWhere(filters);
  const fromSql = `FROM motorcycles m JOIN categories c ON c.id = m.category_id`;
  const countRows = await queryRows<{ total: string | number }>(db, `SELECT count(*)::integer AS total ${fromSql} WHERE ${whereSql}`, values);
  const total = Number(countRows[0]?.total ?? 0);
  const pageValues: QueryValue[] = [...values, filters.limit, (filters.page - 1) * filters.limit];
  const rows = await queryRows<MotorcycleRow>(db, `
    SELECT ${motorcycleColumns}, cover.cover_id, cover.cover_alt
    ${fromSql} ${coverJoin}
    WHERE ${whereSql}
    ORDER BY ${orderBySql[filters.sort]}
    LIMIT $${values.length + 1} OFFSET $${values.length + 2}
  `, pageValues);
  return {
    items: rows.map(mapSummary),
    page: filters.page,
    limit: filters.limit,
    total,
    totalPages: Math.ceil(total / filters.limit),
  };
}

export async function getPublicMotorcycle(db: Db, slug: string) {
  const rows = await queryRows<MotorcycleRow>(db, `
    SELECT ${motorcycleColumns}, cover.cover_id, cover.cover_alt
    FROM motorcycles m JOIN categories c ON c.id = m.category_id ${coverJoin}
    WHERE m.slug = $1 AND m.is_published = true AND c.is_active = true
    LIMIT 1
  `, [slug]);
  const row = rows[0];
  if (!row) return null;
  const [images, features] = await Promise.all([
    queryRows<{ id: string; alt_text: string | null; is_cover: boolean; display_order: number }>(db, `
      SELECT id, alt_text, is_cover, display_order
      FROM motorcycle_images WHERE motorcycle_id = $1
      ORDER BY is_cover DESC, display_order ASC, created_at ASC
    `, [row.id]),
    queryRows<{ label: string }>(db, `
      SELECT label FROM motorcycle_features WHERE motorcycle_id = $1
      ORDER BY display_order ASC, id ASC
    `, [row.id]),
  ]);
  return {
    ...mapSummary(row),
    images: images.map((image) => ({ id: image.id, alt: image.alt_text, isCover: image.is_cover, displayOrder: image.display_order, url: `/api/public/images/${image.id}` })),
    features: features.map((feature) => feature.label),
  };
}

export async function getPublicCatalogOptions(db: Db) {
  const [rows, categories] = await Promise.all([
    queryRows<{ brand: string; model_year: number }>(db, `
      SELECT DISTINCT m.brand, m.model_year FROM motorcycles m
      JOIN categories c ON c.id = m.category_id
      WHERE m.is_published = true AND c.is_active = true
    `),
    listPublicCategories(db),
  ]);
  return {
    brands: [...new Set(rows.map((row) => row.brand))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    years: [...new Set(rows.map((row) => row.model_year))].sort((a, b) => b - a),
    categories: categories.map(({ slug, name }) => ({ slug, name })),
  };
}

export async function listCategoryShowcase(db: Db) {
  const rows = await queryRows<{ slug: string; name: string; description: string | null; image_id: string | null }>(db, `
    SELECT c.slug, c.name, c.description, cover.image_id
    FROM categories c LEFT JOIN LATERAL (
      SELECT i.id AS image_id FROM motorcycles m
      JOIN motorcycle_images i ON i.motorcycle_id = m.id
      WHERE m.category_id = c.id AND m.is_published = true
        AND m.status IN ('available', 'reserved')
      ORDER BY m.is_featured DESC, m.created_at DESC, i.is_cover DESC, i.display_order ASC
      LIMIT 1
    ) cover ON true
    WHERE c.is_active = true ORDER BY c.name ASC LIMIT 8
  `);
  return rows.map((row) => ({ slug: row.slug, name: row.name, description: row.description, imageUrl: row.image_id ? `/api/public/images/${row.image_id}` : null }));
}

export async function listSimilarMotorcycles(db: Db, motorcycle: MotorcycleSummary) {
  const rows = await queryRows<MotorcycleRow>(db, `
    SELECT ${motorcycleColumns}, cover.cover_id, cover.cover_alt
    FROM motorcycles m JOIN categories c ON c.id = m.category_id ${coverJoin}
    WHERE m.is_published = true AND c.is_active = true
      AND m.status IN ('available', 'reserved') AND m.id <> $1
      AND (c.slug = $2 OR m.brand = $3)
    ORDER BY (c.slug = $2) DESC, (m.brand = $3) DESC,
      abs(m.price_cents - $4::bigint) ASC, m.created_at DESC LIMIT 3
  `, [motorcycle.id, motorcycle.category.slug, motorcycle.brand, motorcycle.priceCents]);
  return rows.map(mapSummary);
}

export async function listPublicCategories(db: Db) {
  return await queryRows<{ id: string; name: string; slug: string; description: string | null }>(db, `
    SELECT id, name, slug, description FROM categories WHERE is_active = true ORDER BY name ASC
  `);
}

export async function getPublicStoreSettings(db: Db) {
  const rows = await queryRows<{
    store_name: string; whatsapp_number: string | null; phone: string | null;
    address: string | null; business_hours: string | null; instagram_url: string | null;
    facebook_url: string | null; description: string | null; about_text: string | null;
  }>(db, `
    SELECT store_name, whatsapp_number, phone, address, business_hours,
           instagram_url, facebook_url, description, about_text
    FROM store_settings WHERE id = 1
  `);
  const row = rows[0];
  if (!row) return null;
  return {
    storeName: row.store_name,
    whatsappNumber: row.whatsapp_number,
    phone: row.phone,
    address: row.address,
    businessHours: row.business_hours,
    instagramUrl: row.instagram_url,
    facebookUrl: row.facebook_url,
    description: row.description,
    aboutText: row.about_text,
  };
}
