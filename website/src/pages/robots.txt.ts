import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
    const origin = site ?? new URL(import.meta.env.PUBLIC_ORIGIN);
    const sitemap = new URL("/sitemap-index.xml", origin);
    const robotsTxt = `User-agent: *\nAllow: /\n\nSitemap: ${sitemap}`;

    return new Response(robotsTxt, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8"
        }
    });
};
