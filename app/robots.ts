import type { MetadataRoute } from "next";

// El `noindex` del layout cubre a los buscadores que sí leen la página.
// Esto cubre a los que sólo leen el robots.txt y nunca entran.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
