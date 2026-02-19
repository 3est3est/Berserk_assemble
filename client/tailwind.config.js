/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Vibe Design Tokens — Light & Dark
        accent: '#ff4eab',
        'accent-secondary': '#714eff',
        vibe: {
          green:  '#16a34a',
          'green-light': '#22c55e',
          purple: '#7c3aed',
          orange: '#ea580c',
          pink:   '#db2777',
          cyan:   '#0891b2',
          yellow: '#ca8a04',
          lime:   '#65a30d',
        },
        // Semantic Tokens linked to CSS Variables
        'v-bg': 'var(--bg-base)',
        'v-bg-base': 'var(--bg-base)',
        'v-bg-subtle': 'var(--bg-subtle)',
        'v-text-primary': 'var(--text-primary)',
        'v-text-secondary': 'var(--text-secondary)',
        'v-text-muted': 'var(--text-muted)',
        'v-border': 'var(--border-subtle)',
        'v-glass': 'var(--glass-bg)',
        'v-glass-border': 'var(--glass-border)',
        'v-glass-hover': 'var(--glass-bg-hover)',
        'v-accent-subtle': 'var(--accent-subtle)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'monospace'],
      },
      borderRadius: {
        'sm':  '6px',
        'md':  '10px',
        'lg':  '14px',
        'xl':  '18px',
        '2xl': '22px',
        '3xl': '28px',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeUp: {
          'from': { opacity: '0', transform: 'translateY(10px)' },
          'to':   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          'from': { opacity: '0' },
          'to':   { opacity: '1' },
        },
        shimmer: {
          'from': { backgroundPosition: '-200% 0' },
          'to':   { backgroundPosition: '200% 0' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4' },
        },
        scaleIn: {
          'from': { opacity: '0', transform: 'scale(0.96)' },
          'to':   { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up':   'fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in':   'fadeIn 0.3s ease forwards',
        'shimmer':   'shimmer 1.6s infinite',
        'pulse-dot': 'pulse 2s ease-in-out infinite',
        'scale-in':  'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
    },
  },
  plugins: [
    require('tailwindcss/plugin')(function({ addUtilities }) {
      addUtilities({
        '.hide-scrollbar': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': { 'display': 'none' },
        },
        '.text-balance': { 'text-wrap': 'balance' },
        '.gpu': {
          'transform': 'translateZ(0)',
          'will-change': 'transform',
        },
      });
    })
  ],
}
