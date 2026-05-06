import type { Metadata } from "next";
import { Cairo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import ToastProvider from "@/components/ui/ToastProvider";
import ReactQueryProvider from "@/context/ReactQueryProvider";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-sans",
  preload: false, // Prevent font download during build
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-mono",
  preload: false, // Prevent font download during build
});

export const metadata: Metadata = {
  title: "منصة تاج التعليمية",
  description: "منصتك الأولى للدروس الخصوصية",
};

import { ViewTransitions } from "@/components/providers/ViewTransitions";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className={cairo.className}>
        <ReactQueryProvider>
          <AuthProvider>
            <ViewTransitions>
              <ToastProvider />
              {children}
            </ViewTransitions>
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}