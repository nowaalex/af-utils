module.exports = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./AllExamples/**/*.{js,ts,jsx,tsx,mdx}"
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
                            "font-size": "inherit"
                        }
                    }
                }
            }
        }
    },
    plugins: [require("@tailwindcss/typography"), require("@tailwindcss/forms")]
};
