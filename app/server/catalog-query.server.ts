import { ApiValidationError } from "./errors";

type StatusFilter = "" | "available" | "reserved" | "sold" | "all";
type Sort = "recent" | "price-asc" | "price-desc" | "mileage-asc";

export interface PublicCatalogQuery {
  query: string;
  brand: string;
  category: string;
  year?: number;
  minPriceCents?: number;
  maxPriceCents?: number;
  minCc?: number;
  maxCc?: number;
  status: StatusFilter;
  sort: Sort;
  featured: boolean;
  page: number;
  limit: number;
}

function textParam(params: URLSearchParams, key: string, maxLength: number) {
  const value = (params.get(key) ?? "").trim();
  if (value.length > maxLength) throw new ApiValidationError(`O filtro ${key} excede o tamanho permitido.`);
  return value;
}

function intParam(params: URLSearchParams, key: string, min: number, max: number) {
  const raw = params.get(key);
  if (!raw) return undefined;
  if (!/^\d+$/.test(raw)) throw new ApiValidationError(`O filtro ${key} deve ser um número inteiro.`);
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new ApiValidationError(`O filtro ${key} está fora do intervalo permitido.`);
  return value;
}

function priceParam(params: URLSearchParams, key: string) {
  const raw = params.get(key);
  if (!raw) return undefined;
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(raw)) throw new ApiValidationError(`O filtro ${key} deve ser um valor monetário válido.`);
  return Math.round(Number(raw) * 100);
}

export function parsePublicCatalogQuery(params: URLSearchParams): PublicCatalogQuery {
  const status = textParam(params, "status", 20);
  const sort = textParam(params, "sort", 20) || "recent";
  const category = textParam(params, "category", 140);
  const featured = textParam(params, "featured", 5);
  if (!["", "available", "reserved", "sold", "all"].includes(status)) throw new ApiValidationError("Status inválido.");
  if (!["recent", "price-asc", "price-desc", "mileage-asc"].includes(sort)) throw new ApiValidationError("Ordenação inválida.");
  if (category && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(category)) throw new ApiValidationError("Categoria inválida.");
  if (featured && featured !== "true") throw new ApiValidationError("Filtro featured inválido.");
  const minPriceCents = priceParam(params, "minPrice");
  const maxPriceCents = priceParam(params, "maxPrice");
  const minCc = intParam(params, "minCc", 1, 10000);
  const maxCc = intParam(params, "maxCc", 1, 10000);
  if (minPriceCents !== undefined && maxPriceCents !== undefined && minPriceCents > maxPriceCents) throw new ApiValidationError("Preço mínimo maior que o máximo.");
  if (minCc !== undefined && maxCc !== undefined && minCc > maxCc) throw new ApiValidationError("Cilindrada mínima maior que a máxima.");
  return {
    query: textParam(params, "q", 100),
    brand: textParam(params, "brand", 100),
    category,
    year: intParam(params, "year", 1950, 2102),
    minPriceCents,
    maxPriceCents,
    minCc,
    maxCc,
    status: status as StatusFilter,
    sort: sort as Sort,
    featured: featured === "true",
    page: intParam(params, "page", 1, 10000) ?? 1,
    limit: intParam(params, "limit", 1, 48) ?? 12,
  };
}

export function buildCatalogWhere(filters: PublicCatalogQuery) {
  const values: Array<string | number | boolean> = [];
  const conditions = ["m.is_published = true", "c.is_active = true"];
  const add = (condition: string, value: string | number | boolean) => {
    values.push(value);
    conditions.push(condition.replace("?", `$${values.length}`));
  };

  if (!filters.status) conditions.push("m.status IN ('available', 'reserved')");
  else if (filters.status !== "all") add("m.status = ?", filters.status);
  if (filters.featured) conditions.push("m.is_featured = true");
  if (filters.brand) add("m.brand = ?", filters.brand);
  if (filters.category) add("c.slug = ?", filters.category);
  if (filters.year !== undefined) add("m.model_year = ?", filters.year);
  if (filters.minPriceCents !== undefined) add("m.price_cents >= ?", filters.minPriceCents);
  if (filters.maxPriceCents !== undefined) add("m.price_cents <= ?", filters.maxPriceCents);
  if (filters.minCc !== undefined) add("m.engine_capacity_cc >= ?", filters.minCc);
  if (filters.maxCc !== undefined) add("m.engine_capacity_cc <= ?", filters.maxCc);
  if (filters.query) {
    values.push(`%${filters.query.replace(/[\\%_]/g, "\\$&")}%`);
    conditions.push(`(m.brand ILIKE $${values.length} OR m.model ILIKE $${values.length} OR m.version ILIKE $${values.length})`);
  }
  return { whereSql: conditions.join(" AND "), values };
}

export const orderBySql: Record<Sort, string> = {
  recent: "m.created_at DESC, m.id DESC",
  "price-asc": "m.price_cents ASC, m.id DESC",
  "price-desc": "m.price_cents DESC, m.id DESC",
  "mileage-asc": "m.mileage_km ASC, m.id DESC",
};
