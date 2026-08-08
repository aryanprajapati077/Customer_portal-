import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/site-config"

const PUBLIC_PAGES = [
  "",
  "/services",
  "/products",
  "/partner-program",
  "/contact",
  "/references",
  "/recognitions",
  "/supporter-page",
  "/privacy-policy",
  "/terms-of-service",
  "/login",
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return PUBLIC_PAGES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/services" || path === "/contact" ? 0.9 : 0.7,
  }))
}
