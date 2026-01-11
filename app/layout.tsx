import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: 'swap',
  preload: true,
  weight: ['400', '500', '600'] // Restrict to regular, medium, semibold only
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: 'swap',
  preload: true
});

export const metadata: Metadata = {
  title: "CodeToContent",
  description: "Turn real code into real content—automatically.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Inline script to prevent FOUC by setting theme before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme-preference') || 
                    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                  document.documentElement.classList.add(theme);
                } catch (e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
        {/* Preload critical fonts to reduce layout shift */}
        <link
          rel="preload"
          href="/_next/static/media/inter-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable}`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
