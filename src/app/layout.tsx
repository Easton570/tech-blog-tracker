import type { Metadata } from 'next';
import './globals.css';
import { Nav } from './_components/nav';

export const metadata: Metadata = {
  title: 'BlogScope — Tech Blog Intelligence',
  description: 'AI-powered tracking and analysis of 100 top tech blogs for investment research',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-surface-0 text-text-primary font-sans antialiased">
        <div className="flex min-h-screen">
          <Nav />
          <main className="flex-1 ml-16 lg:ml-56">
            <div className="max-w-[1600px] mx-auto">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
