import type { Metadata } from "next";
import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth";

export const metadata: Metadata = {
  title: { default: "Admin Dashboard", template: "%s | Admin — Saroj Couture" },
  robots: { index: false, follow: false },
};

/** AdminHeader — fixed top bar for the authenticated admin dashboard. */
function AdminHeader() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-margin-mobile h-14 bg-background border-b border-outline-variant">
      {/* Menu — placeholder (could open a drawer if needed) */}
      <Link
        href="/admin/garments"
        className="font-headline-md text-base text-primary tracking-widest hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
        aria-label="Admin home — Manage Work"
      >
        Manage Work
      </Link>

      {/* Logout */}
      <form action={logoutAction}>
        <button
          type="submit"
          aria-label="Sign out"
          className="text-primary hover:opacity-80 transition-opacity p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded"
        >
          <span className="material-symbols-outlined" aria-hidden="true">logout</span>
        </button>
      </form>
    </header>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col bg-surface-container-low">
      <AdminHeader />
      <div className="flex-1 pt-14">{children}</div>
    </div>
  );
}
