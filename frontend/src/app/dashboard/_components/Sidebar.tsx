"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Wrench,
  LayoutDashboard,
  ShoppingCart,
  ShoppingBag,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  User,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { APP_NAME } from "@/lib/constants";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const mainMenuItems = [
  { icon: Wrench, label: "Get Started", href: "/get-started" },
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { 
    icon: ShoppingCart, 
    label: "Sales", 
    href: "/sales",
    submenu: [
      { label: "Sales Invoices", href: "/sales/invoices" },
      { label: "Sales Payments", href: "/sales/payments" },
    ]
  },
  { 
    icon: ShoppingBag, 
    label: "Purchases", 
    href: "/purchases",
    submenu: [
      { label: "Purchase Invoices", href: "/purchases/invoices" },
      { label: "Purchase Payments", href: "/purchases/payments" },
    ]
  },
  { 
    icon: FileText, 
    label: "Common", 
    href: "/common",
    submenu: [
      { label: "Items", href: "/common/items" },
      { label: "Customers", href: "/common/customers" },
      { label: "Suppliers", href: "/common/suppliers" },
    ]
  },
  { 
    icon: BarChart3, 
    label: "Reports", 
    href: "/reports",
    submenu: [
      { label: "Profit And Loss", href: "/reports/profit-and-loss" },
      { label: "Balance Sheet", href: "/reports/balance-sheet" },
    ]
  },
  { icon: Settings, label: "Setup", href: "/setup" },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Don't render sidebar if not authenticated
  if (!isAuthenticated()) {
    return null;
  }

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      {/* Logo Header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Image 
                    src="/icon.svg" 
                    alt="Logo" 
                    width={20} 
                    height={20}
                    className="flex-shrink-0"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{APP_NAME}</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">Parts & Inventory</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Main Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                const isSubmenuActive = item.submenu?.some(sub => pathname === sub.href);
                
                return (
                  <SidebarMenuItem key={item.label}>
                    {item.submenu ? (
                      <Collapsible
                        defaultOpen={isSubmenuActive}
                        className="group/collapsible"
                      >
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            tooltip={item.label}
                            isActive={isActive || isSubmenuActive}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{item.label}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.submenu.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.label}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={pathname === subItem.href}
                                >
                                  <Link href={subItem.href}>
                                    <span>{subItem.label}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      <SidebarMenuButton
                        asChild
                        tooltip={item.label}
                        isActive={isActive}
                      >
                        <Link href={item.href}>
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Footer */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard/profile" className="flex items-center gap-2">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
                  <User className="w-4 h-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user?.name}</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">{user?.role}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  );
}
