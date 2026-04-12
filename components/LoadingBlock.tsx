import { cx } from "@/lib/utils";

export function LoadingBlock({
  className
}: {
  className?: string;
}) {
  return <div className={cx("shimmer rounded-xl bg-white/5", className)} />;
}
