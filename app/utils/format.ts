export const formatPrice = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

export const formatKm = (km: number) => `${new Intl.NumberFormat("pt-BR").format(km)} km`;

export const statusLabel = {
  available: "Disponível",
  reserved: "Reservada",
  sold: "Vendida",
} as const;
