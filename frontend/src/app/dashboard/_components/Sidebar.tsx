"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Rocket,
  LayoutDashboard,
  ShoppingCart,
  ShoppingBag,
  Package,
  BarChart3,
  Settings,
  LogOut,
  User,
  ChevronRight,
  Building2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  { icon: Rocket, label: "Get Started", href: "/get-started" },
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
    icon: Package, 
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
      <SidebarHeader className="border-b border-sidebar-border" data-sidebar="header">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip={APP_NAME}>
              <Link href="/dashboard" className="group-data-[collapsible=icon]:!p-2">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{APP_NAME}</span>
                  <span className="truncate text-xs opacity-70">Parts & Inventory</span>
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
                            <Icon className="w-[18px] h-[18px] shrink-0" />
                            <span>{item.label}</span>
                            <ChevronRight className="w-4 h-4 ml-auto shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.submenu.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.label}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={pathname === subItem.href}
                                  className="h-9"
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
                          <Icon className="w-[18px] h-[18px] shrink-0" />
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
      <SidebarFooter className="border-t border-sidebar-border" data-sidebar="footer">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip={`${user?.name || 'User'} - Profile`}>
              <Link href="/dashboard/profile" className="group-data-[collapsible=icon]:!p-2">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={user?.avatar} alt={user?.name || 'User'} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user?.name || 'User'}</span>
                  <span className="truncate text-xs opacity-70">{user?.role || 'Admin'}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout} 
              tooltip="Logout"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-[18px] h-[18px] shrink-0" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  );
}
