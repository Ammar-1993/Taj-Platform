import type { Metadata } from "next";
import * as Sentry from "@sentry/nextjs";
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

export function generateMetadata(): Metadata {
  return {
    title: {
      default: "منصة تاج التعليمية | نخبة المعلمين",
      template: "%s | منصة تاج التعليمية",
    },
    description: "المنصة الأولى للتعليم عن بعد. نخبة من المعلمين المعتمدين في جميع المواد. اختر معلمك وانطلق نحو التفوق.",
    metadataBase: new URL("https://www.taj-edu.online"),
    openGraph: {
      title: "منصة تاج التعليمية",
      description: "المنصة الأولى للتعليم عن بعد. نخبة من المعلمين المعتمدين في جميع المواد. اختر معلمك وانطلق نحو التفوق.",
      url: "https://www.taj-edu.online",
      siteName: "منصة تاج التعليمية",
      images: [
        {
          url: "/opengraph-image.png",
          width: 1200,
          height: 630,
          alt: "منصة تاج التعليمية",
        },
      ],
      locale: "ar_SA",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "منصة تاج التعليمية",
      description: "منصتك الأولى للدروس الخصوصية",
      images: ["/opengraph-image.png"],
    },
    icons: {
      icon: "/favicon.ico",
      apple: "/apple-icon.png",
    },
    other: {
      ...Sentry.getTraceData(),
    },
  };
}

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