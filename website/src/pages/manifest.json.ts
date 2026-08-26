import { getImage } from "astro:assets";
import favicon from "assets/favicon.png";

const sizes = [192, 512];

export async function GET() {
    const images = await Promise.all(
        sizes.map(size =>
            getImage({
                src: favicon,
                width: size,
                height: size,
                format: "png"
            })
        )
    );

    return new Response(
        JSON.stringify({
            name: "af-utils",
            short_name: "af-utils",
            description: "Practical open-source utilities.",
            start_url: "/",
            scope: "/",
            display: "standalone",
            background_color: "#ffffff",
            theme_color: "#1d4ed8",
            icons: images.map(image => ({
                src: image.src,
                type: `image/${image.options.format}`,
                sizes: `${image.options.width}x${image.options.height}`
            }))
        }),
        {
            headers: {
                "Content-Type": "application/manifest+json; charset=utf-8"
            }
        }
    );
}
