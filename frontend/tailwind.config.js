/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0B1F1E',
          900: '#0F2A28',
          800: '#163B38',
          700: '#1F4E49',
        },
        paper: '#F5F1E7',
        sage: {
          400: '#7FA98C',
          500: '#5B8C72',
          600: '#456B58',
        },
        amber: {
          400: '#EAB35F',
          500: '#E8A33D',
          600: '#C6862A',
        },
        coral: {
          400: '#D9695F',
          500: '#C1443C',
          600: '#9C332C',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
