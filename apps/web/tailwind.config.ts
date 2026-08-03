import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#12303A',
        'ink-soft': '#4A6570',
        door: '#1F5C86',
        'door-deep': '#164560',
        whitewash: '#FBF8F2',
        sand: '#EFE6D0',
        ochre: '#C97B3D',
        'ochre-deep': '#A85F27',
        brass: '#A9822E',
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        sans: ['var(--font-ibm-plex)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        arch: '100px 100px 0 0',
        'arch-sm': '70px 70px 0 0',
        'arch-lg': '120px 120px 0 0',
      },
    },
  },
  plugins: [],
};

export default config;
