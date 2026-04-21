/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        indigo: {
          50: "#EEEDFE",
          100: "#CECBF6",
          200: "#AFA9EC",
          400: "#7F77DD",
          600: "#534AB7",
          800: "#3C3489",
          900: "#26215C",
        },

        teal: {
          50: "#E1F5EE",
          100: "#9FE1CB",
          200: "#5DCAA5",
          400: "#1D9E75",
          600: "#0F6E56",
          800: "#085041",
          900: "#04342C",
        },

        coral: {
          50: "#FAECE7",
          100: "#F5C4B3",
          200: "#F0997B",
          400: "#D85A30",
          600: "#993C1D",
          800: "#712B13",
          900: "#4A1B0C",
        },

        sky: {
          50: "#E6F1FB",
          100: "#B5D4F4",
          200: "#85B7EB",
          400: "#378ADD",
          600: "#185FA5",
          800: "#0C447C",
          900: "#042C53",
        },

        sage: {
          50: "#EAF3DE",
          100: "#C0DD97",
          200: "#97C459",
          400: "#639922",
          600: "#3B6D11",
          800: "#27500A",
          900: "#173404",
        },

        stone: {
          50: "#F1EFE8",
          100: "#D3D1C7",
          200: "#B4B2A9",
          400: "#888780",
          600: "#5F5E5A",
          800: "#444441",
          900: "#2C2C2A",
        },

        rose: {
          50: "#FBEAF0",
          100: "#F4C0D1",
          200: "#ED93B1",
          400: "#D4537E",
          600: "#993556",
          800: "#72243E",
          900: "#4B1528",
        },

        amber: {
          50: "#FAEEDA",
          100: "#FAC775",
          200: "#EF9F27",
          400: "#BA7517",
          600: "#854F0B",
          800: "#633806",
          900: "#412402",
        },

        red: {
          50: "#FCEBEB",
          100: "#F7C1C1",
          200: "#F09595",
          400: "#E24B4A",
          600: "#A32D2D",
          800: "#791F1F",
          900: "#501313",
        },

        bucket: {
          background: "var(--background)",
          foreground: "var(--foreground)",
          card: "var(--card)",
          "card-foreground": "var(--card-foreground)",
          muted: "var(--muted)",
          "muted-foreground": "var(--muted-foreground)",
          border: "var(--border)",
          "border-strong": "var(--border-strong)",
          primary: "var(--primary)",
          "primary-foreground": "var(--primary-foreground)",
          "primary-subtle": "var(--primary-subtle)",
          accent: "var(--accent)",
          "accent-foreground": "var(--accent-foreground)",
          pinned: "var(--pinned)",
          archived: "var(--archived)",
          pending: "var(--pending)",
          dead: "var(--dead)",
          "type-youtube": "var(--type-youtube)",
          "type-article": "var(--type-article)",
          "type-product": "var(--type-product)",
          "type-tweet": "var(--type-tweet)",
          "type-github": "var(--type-github)",
          "type-generic": "var(--type-generic)",
        },
      },
    },
  },
  plugins: [],
};
