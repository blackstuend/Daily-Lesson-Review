import type { MetadataRoute } from "next"

import { siteConfig } from "@/lib/site-config"

const routes = ["/", "/auth/login", "/auth/sign-up", "/auth/check-email"] as const

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: new URL(route, siteConfig.url).toString(),
    lastModified: new Date(),
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.5,
  }))
}
