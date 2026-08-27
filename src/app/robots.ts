import type { MetadataRoute } from "next";

/** The product is private; only its public policy pages belong in search results. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/privacy", "/terms"],
      disallow: "/",
    },
  };
}
