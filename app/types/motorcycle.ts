export type MotorcycleStatus = "available" | "reserved" | "sold";
export type CatalogSort = "recent" | "price-asc" | "price-desc" | "mileage-asc";
export type CatalogStatus = MotorcycleStatus | "all" | "";

export interface MotorcycleCategory {
  slug: string;
  name: string;
}

export interface MotorcycleImage {
  id: string;
  url: string;
  alt: string | null;
  isCover: boolean;
  displayOrder: number;
}

export interface MotorcycleSummary {
  id: string;
  slug: string;
  brand: string;
  model: string;
  version: string | null;
  category: MotorcycleCategory;
  manufactureYear: number;
  modelYear: number;
  mileageKm: number;
  engineCc: number;
  color: string;
  fuelType: string | null;
  priceCents: number;
  description: string;
  status: MotorcycleStatus;
  isFeatured: boolean;
  createdAt: string;
  coverImage: { id: string; url: string; alt: string | null } | null;
}

export interface MotorcycleDetail extends MotorcycleSummary {
  images: MotorcycleImage[];
  features: string[];
}

export interface CatalogFilters {
  query: string;
  brand: string;
  category: string;
  year: string;
  minPrice: string;
  maxPrice: string;
  minCc: string;
  maxCc: string;
  status: CatalogStatus;
  sort: CatalogSort;
  featured: boolean;
}
