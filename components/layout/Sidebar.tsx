"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Boxes,
  ClipboardList,
  FolderTree,
  Gauge,
  LogOut,
  PackageSearch,
  UserRound,
  Users,
  Warehouse,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const adminNav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: Gauge },
  { href: "/admin/parts", label: "Qismlar", icon: PackageSearch },
  { href: "/admin/categories", label: "Kategoriyalar", icon: FolderTree },
  { href: "/admin/suppliers", label: "Ta'minotchilar", icon: Warehouse },
  { href: "/admin/customers", label: "Mijozlar", icon: UserRound },
  { href: "/admin/orders", label: "Buyurtmalar", icon: ClipboardList },
  { href: "/admin/users", label: "Foydalanuvchilar", icon: Users },
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

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="sticky top-0 flex h-dvh w-64 shrink-0 flex-col border-r bg-background">
      <div className="border-b px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Boxes className="size-5" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-none">AutoParts</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {role === "admin" ? "Admin" : "Menejer"}
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {nav.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === (role === "admin" ? "/admin" : "/manager")
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              onClick={(event) => {
                if (active) event.preventDefault();
              }}
              className={cn(
                "group relative flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="size-4" />
              <span className="flex-1 truncate">{item.label}</span>
              <PendingDot />
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <div className="rounded-md bg-muted/50 px-3 py-2">
          <div className="truncate text-sm font-medium">{userName}</div>
          <div className="text-xs text-muted-foreground">
            {role === "admin" ? "Admin" : "Menejer"}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-2 flex h-9 w-full items-center gap-2 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="size-4" />
          Chiqish
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
