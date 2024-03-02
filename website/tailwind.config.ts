import typography from "@tailwindcss/typography";
import forms from "@tailwindcss/forms";
import type { Config } from "tailwindcss";

export default {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}"
    ],
    theme: {
        extend: {
            backgroundImage: {
                sloth: "url('/sloth.jpg')",
                sizif: "url('/sizif.jpg')"
            },
            typography: {
                DEFAULT: {
                    css: {
                        "table": {
                            /* prevent strething */
                            width: "auto"
                        },
                        "table td:not(:first-child), table th:not(:first-child)":
                            {
                                paddingLeft: "1rem"
                            },
                        "table td:not(:last-child), table th:not(:last-child)":
                            {
                                paddingRight: "1rem"
                            },
                        "li > p": {
                            /* for api-extractor lists */
                            margin: 0
                        },

                        /* api-documenter hack to format h1 as h2. all values here are copy-pasted from tailwind typography h2 styling */
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
