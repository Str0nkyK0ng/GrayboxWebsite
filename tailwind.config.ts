import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}', 
  ],
  theme: {
    extend: {
      colors: {
        offWhite: '#ACACAC',
        grayboxYellow: '#FFC500',
        offBlack: '#262626',
      },
      typography: (theme: any) => ({
        invert: {
          css: {
            '--tw-prose-links': theme('colors.offWhite'),
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;