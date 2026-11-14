export const seoKeys = {
  all: ["seo"] as const,
  metadata: () => [...seoKeys.all, "metadata"] as const,
  file: (name: "robots" | "sitemap") => [...seoKeys.all, name] as const,
};
