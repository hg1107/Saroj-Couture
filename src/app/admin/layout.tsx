// Admin layout — wraps all /admin/* routes.
// Phase 2 will add auth guard, AdminHeader, AdminSidebar.
// Middleware already blocks unauthenticated access at the edge.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col bg-surface-container-low">
      {/* AdminHeader + AdminSidebar added in Phase 2 */}
      <div className="flex-1">{children}</div>
    </div>
  );
}
