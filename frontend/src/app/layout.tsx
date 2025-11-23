import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import AppLayout from "./_components/AppLayout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "S.P.TRADERS AND BUILDERS - Dashboard",
  description: "JCB Parts Shop Management System",
  icons: {
    icon: "/icon.svg",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ErrorBoundary>
          <Providers>
            <AppLayout>{children}</AppLayout>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
