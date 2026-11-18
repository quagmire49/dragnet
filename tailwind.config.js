/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#000000',
        card: '#0a0a0a',
        accent: '#aa88ff',
        text: '#dddddd',
        muted: '#8a8a8a',
        chip: '#1c1c1c',
        line: '#2a2a2a',
        critical: '#FF3B5C',
        high: '#FF8A3D',
        medium: '#FFD23D',
        low: '#3DA9FF',
      },
      fontFamily: {
        mono: [
          '"SF Mono"',
          'Menlo',
          'Consolas',
          '"Liberation Mono"',
          'monospace',
        ],
      },
      letterSpacing: {
        tightest: '.02em',
      },
    },
  },
  plugins: [],
}
