import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  redirects() {
    return [
      { source: "/admin/seo", destination: "/admin/seo/page-seo", permanent: false },
      { source: "/admin/reports/sales", destination: "/admin/reports/sales-revenue?view=sales", permanent: false },
      { source: "/admin/reports/revenue", destination: "/admin/reports/sales-revenue?view=revenue", permanent: false },
      { source: "/admin/reports/products", destination: "/admin/reports/products-inventory?view=products", permanent: false },
      { source: "/admin/reports/inventory", destination: "/admin/reports/products-inventory?view=inventory", permanent: false },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
