import type { Metadata } from "next";
import { ActaLogo } from "@/components/shared/ActaLogo";
import { LoginForm } from "@/components/admin/LoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Masuk — ACTA Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const next = sp.next && sp.next.startsWith("/admin") ? sp.next : "/admin";
  const unauthorized = sp.error === "unauthorized";

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-background p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <ActaLogo className="h-8" />
          <span className="text-xs font-medium tracking-[0.14em] text-muted-foreground">ADMIN</span>
        </div>
        <h1 className="mt-6 text-lg font-semibold">Masuk ke Panel</h1>
        <p className="mt-1 text-sm text-muted-foreground">Akses khusus tim ACTA.</p>
        <div className="mt-6">
          <LoginForm next={next} unauthorized={unauthorized} />
        </div>
      </div>
    </main>
  );
}
