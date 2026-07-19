import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import ErrorBoundary from '@/components/ErrorBoundary';
import PWARegistration from '@/components/PWARegistration';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: 'SSITE Event Photobooth',
  description: 'Capture, print, and sync your school memories offline or online.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning={true}>
      <body
        className={`${outfit.variable} font-sans antialiased text-slate-200 bg-[#060814] min-h-screen flex flex-col`}
        suppressHydrationWarning={true}
      >
        {/* Anti-extension hydration patch script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const clean = (el) => {
                  if (!el) return;
                  const attrs = Array.from(el.attributes);
                  attrs.forEach(attr => {
                    const name = attr.name;
                    if (
                      name !== 'class' && 
                      name !== 'style' && 
                      name !== 'lang' && 
                      name !== 'dir' && 
                      name !== 'id' && 
                      !name.startsWith('suppress')
                    ) {
                      el.removeAttribute(name);
                    }
                  });
                };
                clean(document.documentElement);
                clean(document.body);
              })();
            `
          }}
        />
        <ErrorBoundary>
          <PWARegistration />
          <Navbar />
          <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col justify-start">
            {children}
          </main>
        </ErrorBoundary>
      </body>
    </html>
  );
}
