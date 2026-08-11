import sharp from "sharp";
import ico from "sharp-ico";
import path from "node:path";

const faviconSrc = path.resolve("src/assets/favicon.png");

export async function GET() {
    const buffer = await sharp(faviconSrc)
        .resize(32)
        .toFormat("png")
        .toBuffer();

    const icoBuffer = ico.encode([buffer]);

    return new Response(Uint8Array.from(icoBuffer), {
        headers: { "Content-Type": "image/x-icon" }
    });
}
