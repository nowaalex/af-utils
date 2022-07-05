module.exports = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./AllExamples/**/*.{js,ts,jsx,tsx,mdx}"
    ],
    theme: {
        extend: {
            backgroundImage: {
                sloth: "url('/sloth.svg')"
            }
        }
    },
    plugins: [require("@tailwindcss/typography"), require("@tailwindcss/forms")]
};
