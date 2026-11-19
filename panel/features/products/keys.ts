export const productKeys = {
  all: ["admin", "products"] as const,
  detail: (id: string) => ["admin", "products", id] as const,
  brands: ["admin", "brands"] as const,
};
