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
            },
            typography: {
                DEFAULT: {
                    css: {
                        h1: {
                            "font-size": "1.6em"
                        },
                        h2: {
                            "font-size": "1.3em"
                        },
                        h3: {
                            "font-size": "1.2em"
                        },
                        h4: {
                            "font-size": "1.1em"
                        },
                        h5: {
                            "font-size": "1em"
                        }
                    }
                }
            }
        }
    },
    plugins: [typography, forms]
} satisfies Config;
