import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Dashboard/Sidebar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Layer Dream - Dashboard",
  description: "JCB Parts Shop Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-gray-50`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-[213px]">{children}</main>
        </div>
      </body>
    </html>
  );
}
