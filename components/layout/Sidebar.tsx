"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Boxes,
  ClipboardList,
  Gauge,
  LogOut,
  PackageSearch,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  UserRound,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const adminNav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: Gauge },
  { href: "/admin/parts", label: "Qismlar", icon: PackageSearch },
  { href: "/admin/orders", label: "Buyurtmalar", icon: ClipboardList },
  { href: "/admin/settings", label: "Sozlamalar", icon: Settings },
];

const managerNav: NavItem[] = [
  { href: "/manager", label: "Dashboard", icon: Gauge },
  { href: "/manager/parts", label: "Qismlar", icon: PackageSearch },
  { href: "/manager/customers", label: "Mijozlar", icon: UserRound },
  { href: "/manager/orders", label: "Buyurtmalar", icon: ClipboardList },
];

interface SidebarProps {
  role: "admin" | "manager";
  userName: string;
}

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const nav = role === "admin" ? adminNav : managerNav;
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem("sidebar-collapsed") === "true");
  }, []);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-dvh shrink-0 flex-col border-r bg-background transition-[width] duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="border-b px-3 py-4">
        <div
          className={cn(
            "flex items-center",
            collapsed ? "justify-center" : "gap-3"
          )}
        >
          <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Boxes className="size-5" />
          </div>
          <div className={cn("min-w-0", collapsed && "sr-only")}>
            <div className="text-sm font-semibold leading-none">AutoParts</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {role === "admin" ? "Admin" : "Menejer"}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Sidebarni ochish" : "Sidebarni yopish"}
          title={collapsed ? "Sidebarni ochish" : "Sidebarni yopish"}
          className={cn(
            "mt-4 flex h-9 w-full items-center rounded-md text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
            collapsed ? "justify-center px-0" : "gap-2 px-3"
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
          <span className={cn(collapsed && "sr-only")}>
            {collapsed ? "Ochish" : "Yopish"}
          </span>
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {nav.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === (role === "admin" ? "/admin" : "/manager")
              ? pathname === item.href
              : pathname.startsWith(item.href);
          const exactActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              onClick={(event) => {
                if (exactActive) event.preventDefault();
              }}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group relative flex h-9 items-center rounded-md text-sm font-medium transition-colors",
                collapsed ? "justify-center px-0" : "gap-3 px-3",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className={cn("flex-1 truncate", collapsed && "sr-only")}>
                {item.label}
              </span>
              <PendingDot />
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <div
          className={cn(
            "rounded-md bg-muted/50 px-3 py-2",
            collapsed && "sr-only"
          )}
        >
          <div className="truncate text-sm font-medium">{userName}</div>
          <div className="text-xs text-muted-foreground">
            {role === "admin" ? "Admin" : "Menejer"}
          </div>
        </div>
        <button
          onClick={handleLogout}
          title={collapsed ? "Chiqish" : undefined}
          className={cn(
            "flex h-9 w-full items-center rounded-md text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
            collapsed ? "mt-0 justify-center px-0" : "mt-2 gap-2 px-3"
          )}
        >
          <LogOut className="size-4 shrink-0" />
          <span className={cn(collapsed && "sr-only")}>Chiqish</span>
        </button>
      </div>
    </aside>
  );
}

function PendingDot() {
  const { pending } = useLinkStatus();

  if (!pending) return null;

  return (
    <span
      aria-hidden
      className="size-1.5 animate-pulse rounded-full bg-foreground/60"
    />
  );
}
