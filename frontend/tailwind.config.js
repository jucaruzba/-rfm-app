module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        "brand-navy": "#5B5FEF",
        "brand-dark-gray": "#2C2C2E",
        "brand-white": "#FAFAFA",
        "sidebar-bg": "#171717",
        "signout": "#FF6961",
        "card-bg": "#FFFFFF",
        "border-light": "#E5E5EA",
        "pending": "#EF4444",
        "in-progress": "#F59E0B",
        "completed": "#10B981",
        "blocked": "#6B7280",
        "text-primary": "#1C1C1E",
        "text-secondary": "#6E6E73",
        "text-muted": "#AEAEB2",
      },
      borderRadius: {
        DEFAULT: "10px",
      },
      fontFamily: {
        sans: ["SF Pro", "Inter", "sans-serif"],
      },
      fontSize: {
        xs: "11px",
        sm: "13px",
        base: "14px",
        lg: "15px",
        xl: "20px",
        "2xl": "22px",
      },
    },
  },
  plugins: [],
  darkMode: false,
};