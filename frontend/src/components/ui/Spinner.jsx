import { clsx } from "clsx";

/** Loading spinner */
export default function Spinner({ size = "md", color, className }) {
  return (
    <span
      className={clsx("uis-spinner", `uis-spinner--${size}`, className)}
      style={color ? { borderTopColor: color } : undefined}
      aria-label="Loading"
      role="status"
    />
  );
}
