import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /admin/ — auth-gated by middleware + noindex in layout; disallow crawling too
        // /private/ — blocks /private/[token] detail pages; does NOT block /private (no trailing slash)
        disallow: ["/admin/", "/private/"],
      },
    ],
    sitemap: "https://1choice.gr/sitemap.xml",
  };
}
