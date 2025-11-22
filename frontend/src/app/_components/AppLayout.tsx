'use client';

import { usePathname } from 'next/navigation';
import { Suspense } from 'react';
import AppSidebar from "@/app/dashboard/_components/Sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import RouteGuard from "@/components/RouteGuard";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Pages that don't need the sidebar
  const publicPages = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/change-password', '/change-password-otp'];
  const isPublicPage = publicPages.includes(pathname) || pathname.startsWith('/reset-password');

  if (isPublicPage) {
    return (
      <>
        {children}
        <Toaster />
      </>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 min-w-0">
          <header className="sticky top-0 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 z-20">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-px bg-border" />
            <div className="flex flex-1 items-center gap-2">
              {/* You can add breadcrumb or page title here */}
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto bg-background">
            {children}
          </main>
        </SidebarInset>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard>
      <LayoutContent>{children}</LayoutContent>
    </RouteGuard>
  );
}
