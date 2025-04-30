import type { Config } from "tailwindcss";

export default {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Light mode colors
        primary: {
          DEFAULT: '#2563eb', // blue-600
          hover: '#1d4ed8', // blue-700
          light: '#dbeafe', // blue-100
          dark: '#1e40af', // blue-800
        },
        secondary: {
          DEFAULT: '#e5e7eb', // gray-200
          hover: '#d1d5db', // gray-300
          light: '#f3f4f6', // gray-100
          dark: '#9ca3af', // gray-400
        },
        success: {
          DEFAULT: '#16a34a', // green-600
          hover: '#15803d', // green-700
          light: '#dcfce7', // green-100
        },
        danger: {
          DEFAULT: '#dc2626', // red-600
          hover: '#b91c1c', // red-700
          light: '#fee2e2', // red-100
        },
        background: {
          DEFAULT: '#ffffff',
          dark: '#111827',
        },
        foreground: {
          DEFAULT: '#171717',
          dark: '#f9fafb',
        },
      },
      borderRadius: {
        'sm': '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        'dark-card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
        'dark-card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'fadeIn': 'fadeIn 300ms ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
