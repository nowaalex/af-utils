import type { APIRoute } from "astro";
import siteConfig from "../../../site.config.json";

const robotsTxt = `
User-agent: *
Allow: /

Sitemap: ${siteConfig.origin}/sitemap-index.xml`;

export const GET: APIRoute = () =>
    new Response(robotsTxt.trim(), {
        headers: {
            "Content-Type": "text/plain; charset=utf-8"
        }
    });
