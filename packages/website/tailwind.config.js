module.exports = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./AllExamples/**/*.{js,ts,jsx,tsx,mdx}"
    ],
    theme: {
        extend: {
            typography: theme => ({
                DEFAULT: {
                    css: {
                        "code::before": {
                            content: ""
                        },
                        "code::after": {
                            content: ""
                        }
                    }
                }
            })
        }
    },
    plugins: [require("@tailwindcss/typography"), require("@tailwindcss/forms")]
};
