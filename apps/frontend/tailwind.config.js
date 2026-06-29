/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0f1117',
          sidebar: '#161b27',
          card: '#1a2035',
        },
        border: {
          card: '#2a3550',
          active: '#7c3aed',
        },
        accent: {
          DEFAULT: '#7c3aed',
          hover: '#6d28d9',
        },
        text: {
          primary: '#f1f5f9',
          secondary: '#94a3b8',
        },
        status: {
          active: '#10b981',
          inactive: '#ef4444',
        },
      },
    },
  },
  plugins: [],
}
