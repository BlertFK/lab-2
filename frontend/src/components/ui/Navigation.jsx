import { clsx } from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Tab bar */
export function Tabs({ items = [], activeKey, onChange, className }) {
  return (
    <div className={clsx("uis-tabs", className)}>
      {items.map((item) => (
        <button
          key={item.key}
          className={clsx("uis-tab", item.key === activeKey && "uis-tab--active")}
          onClick={() => onChange(item.key)}
        >
          {item.icon && <span className="uis-tab__icon">{item.icon}</span>}
          {item.label}
          {item.count != null && (
            <span className="uis-tab__count">{item.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/** Page-based pagination */
export function Pagination({ page, pageSize, total, onPageChange, className }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className={clsx("uis-pagination", className)}>
      <span className="uis-pagination__info">
        {from}–{to} of {total}
      </span>
      <div className="uis-pagination__controls">
        <button
          className="uis-pagination__btn"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce((acc, p, idx, arr) => {
            if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="uis-pagination__ellipsis">…</span>
            ) : (
              <button
                key={p}
                className={clsx("uis-pagination__btn", p === page && "uis-pagination__btn--active")}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            )
          )}
        <button
          className="uis-pagination__btn"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
