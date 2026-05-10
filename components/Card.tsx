import type { ReactNode } from "react";

import { cx } from "@/lib/utils";

export function Card({
  title,
  eyebrow,
  action,
  className,
  children
}: {
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cx("panel overflow-hidden p-4 md:p-5", className)}>
      {(title || eyebrow || action) && (
        <header className="mb-4 flex items-start justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div className="space-y-1">
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            {title ? <h2 className="text-[1.08rem] font-semibold text-white">{title}</h2> : null}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
