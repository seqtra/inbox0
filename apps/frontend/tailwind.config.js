/**
 * Tailwind CSS Configuration for Frontend
 *
 * This configures Tailwind CSS with support for shadcn/ui components
 * and custom theme settings.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      spacing: {
        '1/5': '20%',
        '2/5': '40%',
        '3/5': '60%',
        '4/5': '80%',
      },
      colors: {
        /* Landing design tokens (inbox-0-new-frontend) */
        navy: '#1A1F36',
        'gray-dark': '#424657',
        'gray-mid': '#6E7491',
        'gray-light': '#E8EAF0',
        'coral-vivid': '#FF6B58',
        'coral-light': '#FFB4A9',
        'whatsapp-green': '#25D366',
        'purple-light': '#C4B5FD',
        'green-light': '#b7efb2',
        'bg-warm': '#f6f5f3',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        'landing-lg': '16px',
        'landing-full': '999px',
      },
      fontFamily: {
        display: ['var(--font-outfit)', 'Outfit', 'sans-serif'],
        body: ['var(--font-plus-jakarta)', 'Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        'landing-sm': '0 2px 8px rgba(26, 31, 54, 0.04)',
        'landing-md': '0 4px 16px rgba(26, 31, 54, 0.08)',
        'landing-lg': '0 8px 32px rgba(26, 31, 54, 0.12)',
        'landing-float': '0 12px 48px rgba(26, 31, 54, 0.16)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(-30px, 30px) scale(1.1)' },
        },
        'pulse-badge': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.05)', opacity: '0.8' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'float': 'float 20s ease-in-out infinite',
        'float-reverse': 'float 15s ease-in-out infinite reverse',
        'pulse-badge': 'pulse-badge 2s ease-in-out infinite',
      },
      backgroundImage: {
        'gradient-text-hero': 'linear-gradient(135deg, #ccb1f7 0%, #ffd7f0 100%)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
