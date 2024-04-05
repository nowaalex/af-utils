import type { APIRoute } from "astro";

const robotsTxt = `
User-agent: *
Disallow: /

Sitemap: ${import.meta.env.PUBLIC_ORIGIN}/sitemap-index.xml`;

export const GET: APIRoute = () =>
    new Response(robotsTxt.trim(), {
        headers: {
            "Content-Type": "text/plain; charset=utf-8"
        }
    });
