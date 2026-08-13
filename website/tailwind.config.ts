import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";
import type { Config } from "tailwindcss";

export default {
    content: ["./src/**/*.{js,ts,jsx,tsx,mdx,astro}"],
    theme: {
        extend: {
            typography: {
                DEFAULT: {
                    css: {
                        maxWidth: "none",
                        "--tw-prose-pre-code": "inherit",
                        "--tw-prose-pre-bg": "#fefdfd",
                        table: {
                            width: "100%"
                        },
                        "table td, table th": {
                            paddingLeft: "0.75rem",
                            paddingRight: "0.75rem"
                        },
                        "td p, th p": {
                            /* api-documenter started to generate tags for tables instead of md syntax */
                            margin: 0
                        },
                        th: {
                            textAlign: "left"
                        },
                        "li > p": {
                            /* for api-extractor lists */
                            margin: 0
                        },

                        /* api-documenter hack to format h1 as h2. all values here are copy-pasted from tailwind typography h2 */
                        "p:first-child + h1": {
                            marginTop: "2em",
                            fontSize: "1.5em",
                            marginBottom: "1em",
                            lineHeight: "1.3333333",
                            fontWeight: "700"
                        }
                    }
                }
            }
        }
    },
    plugins: [typography, forms]
} satisfies Config;
