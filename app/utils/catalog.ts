import type { PublicCatalogQuery } from "../server/catalog-query.server";
import type { CatalogFilters } from "../types/motorcycle";

export function toCatalogFilters(query: PublicCatalogQuery): CatalogFilters {
  return {
    query: query.query,
    brand: query.brand,
    category: query.category,
    year: query.year === undefined ? "" : String(query.year),
    minPrice: query.minPriceCents === undefined ? "" : (query.minPriceCents / 100).toFixed(2),
    maxPrice: query.maxPriceCents === undefined ? "" : (query.maxPriceCents / 100).toFixed(2),
    minCc: query.minCc === undefined ? "" : String(query.minCc),
    maxCc: query.maxCc === undefined ? "" : String(query.maxCc),
    status: query.status,
    sort: query.sort,
    featured: query.featured,
  };
}
