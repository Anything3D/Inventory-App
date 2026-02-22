/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#06b6d4", // Cyan
                secondary: "#8b5cf6", // Violet
                accent: "#f472b6", // Pink
                background: "#0d1117", // Deep Charcoal
                surface: "#161b22", // Lighter Charcoal
            },
        },
    },
    plugins: [],
}
