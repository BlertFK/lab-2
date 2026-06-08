import { clsx } from "clsx";

/** Colored status badge */
export function Badge({ children, color = "blue", className }) {
  return (
    <span className={clsx("uis-badge", `uis-badge--${color}`, className)}>
      {children}
    </span>
  );
}

/** User avatar with image or initials fallback */
export function Avatar({ src, name = "?", size = "md", className }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className={clsx("uis-avatar", `uis-avatar--${size}`, className)}>
      {src ? (
        <img src={src} alt={name} loading="lazy" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

/** Removable tag / chip */
export function Tag({ children, onRemove, className }) {
  return (
    <span className={clsx("uis-tag", className)}>
      {children}
      {onRemove && (
        <button className="uis-tag__remove" onClick={onRemove} aria-label={`Remove ${children}`}>
          ×
        </button>
      )}
    </span>
  );
}

/** Generic card container */
export function Card({ children, padding = true, hoverable = false, className, ...props }) {
  return (
    <div
      className={clsx("uis-card", padding && "uis-card--padded", hoverable && "uis-card--hover", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/** Empty state placeholder */
export function EmptyState({ icon, title, description, action, className }) {
  return (
    <div className={clsx("uis-empty", className)}>
      {icon && <div className="uis-empty__icon">{icon}</div>}
      <p className="uis-empty__title">{title}</p>
      {description && <p className="uis-empty__desc">{description}</p>}
      {action && <div className="uis-empty__action">{action}</div>}
    </div>
  );
}

/** Skeleton loading block */
export function Skeleton({ lines = 3, height = "16px", className }) {
  return (
    <div className={clsx("uis-skeleton-wrap", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="uis-skeleton"
          style={{ height, width: i === lines - 1 ? "65%" : "100%" }}
        />
      ))}
    </div>
  );
}
