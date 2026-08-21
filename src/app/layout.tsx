import type { Metadata } from 'next';
import './globals.css';
import AnimatedFavi from './components/AnimatedFavi';
export const metadata: Metadata = {
  title: {
    template: 'GRAYBOX ARCADE',
    default: 'GRAYBOX ARCADE', // a default is required when creating a template
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <link rel='icon' href='/favicon.ico' sizes='any' />
      <body className='font-[Work Sans] bg-[#262626] '>
        <AnimatedFavi />
        {children}
      </body>
    </html>
  );
}
