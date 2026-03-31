/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          0: '#06060b',
          1: '#0c0c14',
          2: '#13131e',
          3: '#1a1a28',
          4: '#232335',
        },
        accent: {
          DEFAULT: '#6366f1',
          light: '#818cf8',
          dim: '#4f46e5',
        },
        terminal: {
          green: '#00ff88',
          amber: '#ffb800',
          red: '#ff3344',
          cyan: '#00e5ff',
          blue: '#4488ff',
        },
        success: '#00ff88',
        warning: '#ffb800',
        danger: '#ff3344',
        muted: '#4a4a6a',
        text: {
          primary: '#e2e2f0',
          secondary: '#8888a8',
          dim: '#55557a',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"IBM Plex Mono"', '"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid-pattern': '24px 24px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
