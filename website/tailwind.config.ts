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
                sizif: "url('/sizif.jpg')",
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
                        }
                    }
                }
            }
        }
    },
    plugins: [typography, forms]
} satisfies Config;
