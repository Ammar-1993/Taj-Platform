import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      screens: {
        "xs": "480px",
      },

      // ─── Font Family ─────────────────────────────────────
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },

      // ─── Color Tokens ────────────────────────────────────
      colors: {
        // shadcn/ui compatibility
        border:      "hsl(var(--border))",
        input:       "hsl(var(--input))",
        ring:        "hsl(var(--ring))",
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // ─── Taj semantic tokens ───────────────────────────
        brand: {
          50:  "var(--color-brand-50)",
          100: "var(--color-brand-100)",
          200: "var(--color-brand-200)",
          500: "var(--color-brand-500)",
          600: "var(--color-brand-600)",  // primary action
          700: "var(--color-brand-700)",  // hover
          800: "var(--color-brand-800)",  // active
        },
        surface: {
          DEFAULT: "var(--color-surface)",
          subtle:  "var(--color-surface-subtle)",
          muted:   "var(--color-surface-muted)",
        },
        // Status colors
        success: {
          bg:   "var(--color-success-bg)",
          text: "var(--color-success-text)",
        },
        warning: {
          bg:   "var(--color-warning-bg)",
          text: "var(--color-warning-text)",
        },
        error: {
          bg:   "var(--color-error-bg)",
          text: "var(--color-error-text)",
        },
        info: {
          bg:   "var(--color-info-bg)",
          text: "var(--color-info-text)",
        },
        neutral: {
          bg:   "var(--color-neutral-bg)",
          text: "var(--color-neutral-text)",
        },
        // Text specific
        text: {
          primary:   "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          muted:     "var(--color-text-muted)",
        },
      },

      // ─── Border Radius (4-level scale) ───────────────────
      // Existing 'lg/md/sm' kept for shadcn compat; new scale layered on top.
      borderRadius: {
        // shadcn compat
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // Taj 4-level scale
        "taj-sm": "var(--radius-sm)",   // 8px  — badges, small buttons
        "taj-md": "var(--radius-md)",   // 12px — inputs, secondary buttons
        "taj-lg": "var(--radius-lg)",   // 16px — cards, modals
        "taj-xl": "var(--radius-xl)",   // 24px — hero banners, wallet cards
      },

      // ─── Keyframes ───────────────────────────────────────
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        shimmer: {
          "0%":   { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(300%)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.5" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%":      { transform: "translateX(-4px)" },
          "75%":      { transform: "translateX(4px)" },
        },
        successScale: {
          "0%":   { transform: "scale(0.9)", opacity: "0" },
          "50%":  { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        }
      },

      // ─── Animation utilities ──────────────────────────────
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        shimmer:          "shimmer 2s infinite",
        "fade-up":        "fadeUp 0.5s ease-out both",
        "fade-up-1":      "fadeUp 0.5s ease-out 0.1s both",
        "fade-up-2":      "fadeUp 0.5s ease-out 0.2s both",
        "fade-up-3":      "fadeUp 0.5s ease-out 0.3s both",
        "pulse-dot":      "pulseDot 1.5s ease-in-out infinite",
        "shake":          "shake 0.3s ease-in-out 0s 2",
        "success-scale":  "successScale 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
