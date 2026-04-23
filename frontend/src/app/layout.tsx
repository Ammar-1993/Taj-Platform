import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import ToastProvider from "@/components/ui/ToastProvider";
import ReactQueryProvider from "@/context/ReactQueryProvider";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["200", "300", "400", "500", "700", "800", "900"],
  display: "swap",
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
    <html lang="ar" dir="rtl">
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