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
            icons: images.map(image => ({
                src: image.src,
                type: `image/${image.options.format}`,
                sizes: `${image.options.width}x${image.options.height}`
            }))
        })
    );
}
