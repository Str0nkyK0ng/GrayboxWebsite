import type { Config } from 'tailwindcss';

// prettier-ignore
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
      './src/app/lib/**/*.{ts,tsx}',
      './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {

    extend: {
      colors: {
        offWhite: '#ACACAC',
        grayboxYellow: '#FFC500',
      },
      typography: {
        invert: {
          css: {
            '--tw-prose-links': 'offWhite',
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
export default config;
