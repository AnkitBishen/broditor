import { Badge } from "@/components/Badge";
import { cx } from "@/lib/utils";
import type { DomainMetric } from "@/lib/types";

export function BarList({
  data,
  className
}: {
  data: DomainMetric[];
  className?: string;
}) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className={cx("space-y-4", className)}>
      {data.map((item) => (
        <div key={item.label} className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-sm">
            <div>
              <p className="font-medium text-white">{item.label}</p>
              {item.change ? <p className="text-xs text-slate-400">{item.change}</p> : null}
            </div>
            <Badge variant="info">{item.value}%</Badge>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-sky-400"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
