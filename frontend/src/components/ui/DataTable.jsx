import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Skeleton } from "./Display";
import { EmptyState } from "./Display";
import { Pagination } from "./Navigation";
import { clsx } from "clsx";

/**
 * Server-driven data table.
 * @param {string[]} queryKey - React Query key
 * @param {function} queryFn - receives {page, pageSize, sort, filters}, returns {rows, total}
 * @param {Array<{key, label, render?, sortable?}>} columns
 * @param {object} filters - external filter state
 * @param {number} defaultPageSize
 */
export default function DataTable({
  queryKey,
  queryFn,
  columns = [],
  filters = {},
  defaultPageSize = 20,
  onRowClick,
  className,
}) {
  const [page, setPage]         = useState(1);
  const [pageSize]              = useState(defaultPageSize);
  const [sort, setSort]         = useState({ field: null, dir: "asc" });

  const { data, isLoading, isError } = useQuery({
    queryKey: [...queryKey, page, pageSize, sort, filters],
    queryFn: () => queryFn({ page, pageSize, sort, filters }),
    placeholderData: (prev) => prev,
  });

  const rows  = data?.rows  ?? [];
  const total = data?.total ?? 0;

  const handleSort = (field) => {
    setSort((prev) =>
      prev.field === field
        ? { field, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { field, dir: "asc" }
    );
    setPage(1);
  };

  return (
    <div className={clsx("uis-datatable-wrap", className)}>
      <div className="uis-datatable-scroll">
        <table className="uis-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={clsx(col.sortable && "sortable")}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {col.label}
                    {col.sortable && sort.field === col.key && (
                      sort.dir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: "32px" }}>
                  <Skeleton lines={5} />
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState title="Failed to load data" description="Please try again." />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState title="No results" description="Try adjusting your filters." />
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={row.id ?? i}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={onRowClick ? "clickable" : undefined}
                >
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
      />
    </div>
  );
}
