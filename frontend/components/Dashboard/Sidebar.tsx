"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Wrench,
  LayoutDashboard,
  ShoppingCart,
  ShoppingBag,
  FileText,
  BarChart3,
  Settings,
} from "lucide-react";

const mainMenuItems = [
  { icon: Wrench, label: "Get Started", href: "/get-started" },
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
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
  const [openMenu, setOpenMenu] = useState<string | null>("Sales");

  return (
    <aside className="w-[213px] bg-[#f5f5f5] border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="p-4 pb-6">
        <h1 className="text-xl font-semibold text-gray-800">Layer Dream</h1>
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
    </aside>
  );
}
