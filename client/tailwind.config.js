/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Modern Dark Theme
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'sm': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(14, 165, 233, 0.3)',
        'glow-lg': '0 0 40px rgba(14, 165, 233, 0.4)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
      },
      keyframes: {
        shuttleIn: {
          '0%': { opacity: '0', filter: 'blur(8px)' },
          '100%': { opacity: '1', filter: 'blur(0)' },
        }
      },
      animation: {
        shuttle: 'shuttleIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }
    },
  },
  plugins: [
    require('tailwindcss/plugin')(function({ addComponents, addUtilities }) {
      addComponents({
        '.os-window-base': {
          '@apply rounded-[1.8rem] border border-white/5 bg-black/40 backdrop-blur-3xl shadow-2xl relative overflow-hidden': {},
          'box-shadow': '0 50px 100px -20px rgba(0,0,0,0.8)',
        },
        '.os-sidebar-base': {
          '@apply w-64 border-r border-white/5 bg-white/[0.02] p-6 flex flex-col gap-8': {},
        },
        '.os-main-base': {
          '@apply flex-grow p-10 bg-white/[0.01]': {},
        },
        '.os-glass-card': {
          '@apply rounded-[1.5rem] border border-white/[0.03] bg-white/[0.02] backdrop-blur-2xl transition-all duration-500': {},
          '&:hover': {
            '@apply bg-white/[0.05] border-white/10': {},
          }
        },
        '.os-label': {
          '@apply text-[9px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-4 block': {},
        }
      });
      addUtilities({
        '.hide-scrollbar': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            'display': 'none',
          }
        }
      });
    })
  ],
}
