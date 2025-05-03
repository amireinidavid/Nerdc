import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Providers } from "./providers";
import { AuthProvider } from "@/components/auth/auth-provider";
import ReactQueryProvider from "@/providers/react-query-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nerdc Journal | Modern Academic Publishing",
  description: "A modern platform for discovering, reading, and publishing cutting-edge research",
  authors: [{ name: "Nerdc Team" }],
  creator: "Nerdc Journal",
  publisher: "Nerdc Publishing",
  keywords: ["journal", "academic", "research", "papers", "scholarly", "publications"],
  icons: {
    icon: "/assets/logo.jpg",
    apple: "/assets/logo.jpg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1.5,
  userScalable: true,
  themeColor: "#0a0a12",
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen font-sans relative overflow-x-hidden`}
      >
        <div className="fixed inset-0 -z-10" aria-hidden="true">
          {/* Additional background elements can go here if needed */}
        </div>
        <AuthProvider>
          <Providers>
            <ReactQueryProvider>
            <Header />
            <main className="pt-24 min-h-screen">
              {children}
            </main>
            <Footer />
            </ReactQueryProvider>
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
