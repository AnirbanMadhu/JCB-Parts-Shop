'use client';

import { usePathname } from 'next/navigation';
import Sidebar from "@/app/dashboard/_components/Sidebar";
import { StockAlertsWidget } from "@/components/features/StockAlertsWidget";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Pages that don't need the sidebar
  const publicPages = ['/login', '/register', '/forgot-password', '/reset-password', '/change-password', '/change-password-otp'];
  const isPublicPage = publicPages.includes(pathname) || pathname.startsWith('/reset-password');

  if (isPublicPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 ml-[213px] overflow-y-auto">{children}</main>
      <StockAlertsWidget />
    </div>
  );
}
