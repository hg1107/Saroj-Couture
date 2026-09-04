import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  /** Omit on the last (current-page) item — it renders as plain text. */
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

/** Visual breadcrumb trail. Pair with <BreadcrumbJsonLd> for the matching structured data. */
export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="w-full">
      <ol className="flex flex-wrap items-center gap-1.5 font-label-md text-[11px] text-on-surface-variant uppercase tracking-wider">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-secondary transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined} className={isLast ? "text-primary" : undefined}>
                  {item.label}
                </span>
              )}
              {!isLast && (
                <span className="material-symbols-outlined text-[14px] text-outline" aria-hidden="true">
                  chevron_right
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
