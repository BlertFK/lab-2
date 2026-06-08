import { forwardRef } from "react";
import { clsx } from "clsx";

/** Text input with label, error, hint, icon support */
export const Input = forwardRef(function Input(
  { label, error, hint, leftIcon, rightIcon, className, id, ...props },
  ref
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="uis-field">
      {label && <label htmlFor={inputId} className="uis-label">{label}</label>}
      <div className={clsx("uis-input-wrap", leftIcon && "has-left", rightIcon && "has-right")}>
        {leftIcon && <span className="uis-input-icon left">{leftIcon}</span>}
        <input
          ref={ref}
          id={inputId}
          className={clsx("uis-input", error && "uis-input--error", className)}
          {...props}
        />
        {rightIcon && <span className="uis-input-icon right">{rightIcon}</span>}
      </div>
      {error && <p className="uis-error">{error}</p>}
      {!error && hint && <p className="uis-hint">{hint}</p>}
    </div>
  );
});

/** Textarea with label and error */
export const Textarea = forwardRef(function Textarea(
  { label, error, hint, rows = 4, className, id, ...props },
  ref
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="uis-field">
      {label && <label htmlFor={inputId} className="uis-label">{label}</label>}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className={clsx("uis-input uis-textarea", error && "uis-input--error", className)}
        {...props}
      />
      {error && <p className="uis-error">{error}</p>}
      {!error && hint && <p className="uis-hint">{hint}</p>}
    </div>
  );
});

/** Select dropdown */
export const Select = forwardRef(function Select(
  { label, error, hint, options = [], className, id, placeholder, ...props },
  ref
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="uis-field">
      {label && <label htmlFor={inputId} className="uis-label">{label}</label>}
      <select
        ref={ref}
        id={inputId}
        className={clsx("uis-input uis-select", error && "uis-input--error", className)}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
      </select>
      {error && <p className="uis-error">{error}</p>}
      {!error && hint && <p className="uis-hint">{hint}</p>}
    </div>
  );
});
