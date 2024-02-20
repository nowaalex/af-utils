import { MetadataRoute } from "next";

const robots = () => {
    return {
        rules: {
            userAgent: "*",
            allow: "/"
        },
        sitemap: `${process.env.NEXT_PUBLIC_ORIGIN}/sitemap.xml`
    } satisfies MetadataRoute.Robots;
};

export default robots;
