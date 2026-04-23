import type { Metadata } from "next";
import { Tajawal, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import ToastProvider from "@/components/ui/ToastProvider";
import ReactQueryProvider from "@/context/ReactQueryProvider";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["200", "300", "400", "500", "700", "800", "900"],
  display: "swap",
  variable: "--font-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "منصة تاج التعليمية",
  description: "منصتك الأولى للدروس الخصوصية",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} ${mono.variable}`}>
      <body className={tajawal.className}>
        <ReactQueryProvider>
          <AuthProvider>
            <ToastProvider />
            {children}
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}