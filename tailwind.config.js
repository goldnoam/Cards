
module.exports = {
  content: ["./index.html", "./**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        'card-flip': 'flip 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards',
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        flip: {
          '0%': { transform: 'rotateY(90deg) scale(0.9)', opacity: '0' },
          '100%': { transform: 'rotateY(0deg) scale(1)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
