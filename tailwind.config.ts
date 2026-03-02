import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out both',
        'fade-in-up': 'fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in-down': 'fadeInDown 0.3s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in-scale': 'fadeInScale 0.3s cubic-bezier(0.16,1,0.3,1) both',
        'slide-in-right': 'slideInRight 0.35s cubic-bezier(0.16,1,0.3,1) both',
        'slide-in-left': 'slideInLeft 0.35s cubic-bezier(0.16,1,0.3,1) both',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in': 'scaleIn 0.25s cubic-bezier(0.16,1,0.3,1) both',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'gradient': 'gradientShift 6s ease infinite',
        'overlay': 'overlayFadeIn 0.25s ease-out both',
        'spinner': 'spin 0.8s linear infinite',
        'count-up': 'countUp 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'wiggle': 'wiggle 0.5s ease-in-out',
        'notification': 'notificationBounce 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
      },
      boxShadow: {
        'soft': '0 1px 2px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.04), 0 8px 16px rgba(0,0,0,0.03)',
        'elevated': '0 2px 4px rgba(0,0,0,0.04), 0 8px 16px rgba(0,0,0,0.06), 0 16px 32px rgba(0,0,0,0.04)',
        'glow-primary': '0 4px 14px rgba(59,130,246,0.25)',
        'glow-success': '0 4px 14px rgba(34,197,94,0.25)',
        'glow-danger': '0 4px 14px rgba(239,68,68,0.25)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.1)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'shimmer': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
      },
    },
  },
  plugins: [],
}
export default config
