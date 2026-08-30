import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth";

/** AdminHeader — fixed top bar for all /admin/* pages. */
function AdminHeader() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-margin-mobile h-16 bg-background border-b border-outline-variant">
      {/* Menu — placeholder (could open a drawer if needed) */}
      <Link
        href="/admin/garments"
        className="font-headline-md text-headline-md text-primary tracking-widest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col bg-surface-container-low">
      <AdminHeader />
      <div className="flex-1 pt-16">{children}</div>
    </div>
  );
}
