"use client";

import { useAdminAuthStore } from "@/lib/store";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Scan,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Megaphone,
  Barcode,
  Bot,
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/scanner/inventory", label: "Inventory Scan", icon: Scan },
  { href: "/admin/scanner/billing", label: "Billing Scan", icon: Scan },
  { href: "/admin/insights", label: "Insights", icon: BarChart3 },
  { href: "/admin/alerts", label: "Alerts", icon: Bell },
  { href: "/admin/broadcast", label: "Broadcast", icon: Megaphone },
  { href: "/admin/playground", label: "Bot Playground", icon: Bot },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, logout } = useAdminAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isBillingPage = pathname === "/admin/scanner/billing";
  const isLoginPage = pathname === "/admin/login";
  const showFab = !isBillingPage && !isLoginPage;

  useEffect(() => {
    if (!isAuthenticated && pathname !== "/admin/login") {
      router.push("/admin/login");
    }
  }, [isAuthenticated, pathname, router]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white shadow-nav h-16 flex items-center justify-between px-4">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 -ml-1 rounded-lg hover:bg-gray-100 transition-colors">
          {sidebarOpen ? <X className="h-5 w-5 text-gray-700" /> : <Menu className="h-5 w-5 text-gray-700" />}
        </button>
        <Link href="/admin/dashboard" className="font-semibold text-sm text-gray-900">
          Kiranax Admin
        </Link>
        <button onClick={logout} className="p-1 -mr-1 rounded-lg hover:bg-gray-100 transition-colors">
          <LogOut className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 transform transition-transform lg:translate-x-0 shadow-nav lg:shadow-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center px-5 border-b border-gray-100">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <div>
              <span className="font-bold text-lg text-gray-900 leading-none">Kiranax</span>
              <span className="text-[10px] text-gray-500 ml-1.5">Admin</span>
            </div>
          </Link>
        </div>
        <nav className="p-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "bg-green-50 text-green-700"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <item.icon className={cn("h-5 w-5", active ? "text-green-600" : "text-gray-400")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-4 left-3 right-3">
          <Button
            variant="outline"
            className="w-full justify-start text-gray-500 rounded-full border-gray-200"
            onClick={logout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        {children}
      </main>

      {/* Quick Sell FAB — Frap style */}
      {showFab && (
        <Link href="/admin/scanner/billing">
          <button className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-green-600 text-white shadow-frap flex items-center justify-center hover:bg-green-700 active:scale-95 active:shadow-frap-active transition-all">
            <Barcode className="h-6 w-6" />
          </button>
        </Link>
      )}
    </div>
  );
}
