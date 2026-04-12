"use client";

import { ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react";
import { useState } from "react";

import { cx } from "@/lib/utils";
import type { TableColumn } from "@/lib/types";

export function Table<T extends { id: string }>({
  columns,
  data,
  pageSize = 6,
  emptyTitle = "No records found",
  emptyCopy = "Try adjusting the current filters or search terms.",
  loading = false
}: {
  columns: TableColumn<T>[];
  data: T[];
  pageSize?: number;
  emptyTitle?: string;
  emptyCopy?: string;
  loading?: boolean;
}) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const sorted = [...data].sort((left, right) => {
    if (!sortKey) {
      return 0;
    }

    const column = columns.find((item) => item.key === sortKey);
    if (!column) {
      return 0;
    }

    const leftValue = column.sortValue ? column.sortValue(left) : String((left as Record<string, unknown>)[sortKey] ?? "");
    const rightValue = column.sortValue ? column.sortValue(right) : String((right as Record<string, unknown>)[sortKey] ?? "");

    if (leftValue === rightValue) {
      return 0;
    }

    const comparison = leftValue > rightValue ? 1 : -1;
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const start = (clampedPage - 1) * pageSize;
  const pageRows = sorted.slice(start, start + pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
    setPage(1);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <div className="table-scroll overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <thead className="bg-white/[0.03]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cx("px-4 py-3 text-left font-medium text-slate-300", column.className)}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      className="inline-flex items-center gap-2 text-left hover:text-white"
                    >
                      {column.header}
                      <ChevronsUpDown className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading
              ? Array.from({ length: pageSize }).map((_, index) => (
                  <tr key={`loading-${index}`} className="shimmer">
                    <td colSpan={columns.length} className="h-14 bg-white/[0.03]" />
                  </tr>
                ))
              : null}

            {!loading &&
              pageRows.map((row) => (
                <tr key={row.id} className="hover:bg-white/[0.03]">
                  {columns.map((column) => (
                    <td key={column.key} className={cx("px-4 py-4 align-top text-slate-200", column.className)}>
                      {column.render
                        ? column.render(row)
                        : String((row as Record<string, unknown>)[column.key] ?? "-")}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {!loading && pageRows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
          <p className="text-lg font-semibold text-white">{emptyTitle}</p>
          <p className="max-w-md text-sm text-slate-400">{emptyCopy}</p>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-white/[0.02] px-4 py-3 text-xs text-slate-400">
        <p>
          Showing {pageRows.length === 0 ? 0 : start + 1}-{Math.min(start + pageRows.length, sorted.length)} of{" "}
          {sorted.length}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={clampedPage === 1}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-16 text-center text-slate-300">
            {clampedPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={clampedPage === totalPages}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
