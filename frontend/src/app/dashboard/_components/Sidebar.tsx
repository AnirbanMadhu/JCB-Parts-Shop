"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
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
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

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

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState<string | null>("Sales");
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
    <aside className="w-[213px] bg-[#f5f5f5] border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="p-4 pb-6 flex items-center gap-3">
        <Image 
          src="/icon.svg" 
          alt="Logo" 
          width={40} 
          height={40}
          className="flex-shrink-0"
        />
        <h1 className="text-lg font-semibold text-gray-800 leading-tight">S.P.TRADERS AND BUILDERS</h1>
      </div>

      {/* Main Menu */}
      <nav className="flex-1 px-2">
        {mainMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const isSubmenuActive = item.submenu?.some(sub => pathname === sub.href);
          const isMenuOpen = openMenu === item.label;
          
          return (
            <div key={item.label}>
              {item.submenu ? (
                <>
                  <button
                    onClick={() => setOpenMenu(isMenuOpen ? null : item.label)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md mb-1 w-full text-left transition-colors ${
                      isActive || isSubmenuActive
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                  {isMenuOpen && (
                    <div className="ml-6 mb-1">
                      {item.submenu.map((subItem) => (
                        <Link
                          key={subItem.label}
                          href={subItem.href}
                          className={`flex items-center gap-3 px-3 py-2 rounded-md mb-1 text-sm transition-colors ${
                            pathname === subItem.href
                              ? "text-gray-900 font-medium"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md mb-1 transition-colors ${
                    isActive
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-200">
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-3 mb-3 px-3 py-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors cursor-pointer"
        >
          <User className="w-5 h-5 text-gray-600" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.role}</p>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-md w-full text-left text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
