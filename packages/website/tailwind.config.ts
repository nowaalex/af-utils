import typography from "@tailwindcss/typography";
import forms from "@tailwindcss/forms";
import type { Config } from "tailwindcss";

export default {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./mdx-components.tsx"
    ],
    theme: {
        extend: {
            backgroundImage: {
                sloth: "url('/sloth.jpg')"
            }
        }
    },
    plugins: [typography, forms]
} satisfies Config;
