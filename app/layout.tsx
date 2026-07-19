import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ErrorBoundary from '@/components/ErrorBoundary';
import PWARegistration from '@/components/PWARegistration';
import { ThemeProvider } from '@/context/ThemeContext';
import { CameraProvider } from '@/context/CameraContext';

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
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const t = localStorage.getItem('ssite_theme');
                  if (t === 'dark') {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  } else {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                  }
                } catch(e) {}
              })();
            `
          }}
        />
      </head>
      <body
        className={`${outfit.variable} font-sans antialiased text-[#060814] dark:text-slate-200 dark:bg-[#060814] bg-slate-50 min-h-screen flex flex-col transition-colors duration-300`}
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
        <ThemeProvider>
          <CameraProvider>
            <ErrorBoundary>
              <PWARegistration />
              <Navbar />
              <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col justify-start">
                {children}
              </main>
              <Footer />
            </ErrorBoundary>
          </CameraProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

