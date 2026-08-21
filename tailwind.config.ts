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
      typography: {
        invert: {
          css: {
            '--tw-prose-body': '#fff',
            '--tw-prose-headings': '#fff',
            '--tw-prose-lead': '#fff',
            '--tw-prose-links': '#fff',
            '--tw-prose-bold': '#fff',
            '--tw-prose-counters': '#fff',
            '--tw-prose-bullets': '#fff',
            '--tw-prose-hr': '#0000',
            '--tw-prose-quotes': '#fff',
            '--tw-prose-quote-borders': '#fff',
            '--tw-prose-captions': '#fff',
            '--tw-prose-code': '#7ad31a',
            '--tw-prose-pre-code': '#7ad31a',
            '--tw-prose-pre-bg': '#3a3a3ae2',
            '--tw-prose-th-borders': '#0000',
            '--tw-prose-td-borders': '#0000',
            // --tw-prose-* only controls color — font-family needs its own
            // selectors, so headings pick up the same 'Redaction' display
            // font used for the logo/event headers elsewhere on the site.
            h1: { fontFamily: 'Redaction' },
            h2: { fontFamily: 'Redaction' },
            h3: { fontFamily: 'Redaction' },
            h4: { fontFamily: 'Redaction' },
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
export default config;
