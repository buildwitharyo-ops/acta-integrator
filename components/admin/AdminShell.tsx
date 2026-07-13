"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  FileText,
  Images,
  Inbox,
  LayoutDashboard,
  LayoutTemplate,
  Menu,
  Newspaper,
  Package,
  Settings as SettingsIcon,
  Signpost,
  SlidersHorizontal,
} from "lucide-react";
import { ActaLogo } from "@/components/shared/ActaLogo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { signOutAdmin } from "@/lib/actions/admin/session";
import { cn } from "@/lib/utils";
import type { AdminContext } from "@/lib/admin/auth";

type NavItem = { label: string; href: string; icon: typeof LayoutDashboard; adminOnly?: boolean };

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Pages", href: "/admin/pages", icon: LayoutTemplate },
  { label: "Solutions", href: "/admin/solutions", icon: Boxes },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Categories & Specs", href: "/admin/categories", icon: SlidersHorizontal },
  { label: "Articles", href: "/admin/articles", icon: Newspaper },
  { label: "Media", href: "/admin/media", icon: Images },
  { label: "Leads", href: "/admin/leads", icon: Inbox },
  { label: "Redirects", href: "/admin/redirects", icon: Signpost },
  { label: "Settings", href: "/admin/settings", icon: SettingsIcon, adminOnly: true },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

function crumbLabel(pathname: string) {
  const match = [...NAV].reverse().find((n) => isActive(pathname, n.href));
  return match?.label ?? "Admin";
}

function NavList({ role, onNavigate }: { role: AdminContext["role"]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.filter((n) => !n.adminOnly || role === "admin").map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              active ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({ user, children }: { user: AdminContext; children: React.ReactNode }) {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  const sidebarInner = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-3 py-4">
        <ActaLogo className="h-7" />
        <span className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground">ADMIN</span>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <NavList role={user.role} onNavigate={() => setSheetOpen(false)} />
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 border-r border-border lg:block">
        <div className="sticky top-0 h-screen">{sidebarInner}</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger className="inline-flex h-9 w-9 items-center justify-center rounded-md ring-1 ring-border lg:hidden">
                <Menu className="h-4 w-4" />
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetTitle className="sr-only">Navigasi Admin</SheetTitle>
                {sidebarInner}
              </SheetContent>
            </Sheet>
            <p className="text-sm font-medium">{crumbLabel(pathname)}</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="hidden items-center gap-1 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground ring-1 ring-border transition-colors hover:text-foreground sm:inline-flex"
            >
              <FileText className="h-3.5 w-3.5" /> Lihat Situs ↗
            </Link>
            <ThemeToggle />
            <div className="flex items-center gap-2 rounded-md py-1 pl-2.5 pr-1 ring-1 ring-border">
              <div className="text-right leading-tight">
                <p className="text-xs font-medium">{user.displayName}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{user.role}</p>
              </div>
              <form action={signOutAdmin}>
                <button
                  type="submit"
                  className="rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Keluar
                </button>
              </form>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
}
