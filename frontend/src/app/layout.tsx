import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/components/NotificationProvider";
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
          <ThemeProvider>
            <AuthProvider>
              <NotificationProvider>
                <AppLayout>{children}</AppLayout>
              </NotificationProvider>
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
