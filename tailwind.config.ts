import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"New York"', 'Iowan Old Style', 'Apple Garamond', 'Baskerville', 'Times New Roman', 'serif'],
      },
      letterSpacing: {
        'tightest': '-0.04em',
        'wide-editorial': '0.15em',
        'widest-editorial': '0.25em',
      },
      colors: {
        pairs: {
          black: '#000000',
          charcoal: '#121212',
          gray: '#757575',
          lightgray: '#F5F5F5',
          border: '#E5E5E5',
          sale: '#000000',
          badge: '#F2F2F2',
          accent: '#25D366', // WhatsApp community green
        },
      },
      animation: {
        marquee: 'marquee 25s linear infinite',
        'marquee-slow': 'marquee 40s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
