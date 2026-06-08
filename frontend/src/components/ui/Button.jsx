import { clsx } from "clsx";
import Spinner from "./Spinner";

/**
 * Button component.
 * @param {'primary'|'secondary'|'ghost'|'danger'|'link'} variant
 * @param {'sm'|'md'|'lg'} size
 * @param {boolean} loading
 * @param {React.ReactNode} leftIcon
 * @param {React.ReactNode} rightIcon
 */
export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  className,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={clsx("uis-btn", `uis-btn--${variant}`, `uis-btn--${size}`, loading && "uis-btn--loading", className)}
      {...props}
    >
      {loading ? (
        <Spinner size="sm" />
      ) : (
        <>
          {leftIcon && <span className="uis-btn__icon">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="uis-btn__icon">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}
