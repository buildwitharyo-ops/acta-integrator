"use client";

import { useId, type ChangeEvent } from "react";
import { cn } from "@/lib/utils";

export type SelectOption = {
  /** Submitted as the GET param value — keep it short and URL-safe. */
  value: string;
  /** Bahasa Indonesia label. */
  label: string;
  disabled?: boolean;
};

export type SelectFieldProps = {
  /** GET param name — this field participates in the native form. Required. */
  name: string;
  label: string;
  options: readonly SelectOption[];
  /** Uncontrolled seed (server render / no-JS path). */
  defaultValue?: string;
  /** Controlled value, for a client Panel that owns the state. */
  value?: string;
  onValueChange?: (value: string) => void;
  /** Helper line under the field. */
  hint?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

/**
 * A native `<select>` — never a Radix listbox, which needs JavaScript to be
 * operable at all and would break the no-JS contract (03-UI §12.6). The chevron
 * is a 45° caret drawn inline, so no icon package enters the /learn bundle.
 */
export function SelectField({
  name,
  label,
  options,
  defaultValue,
  value,
  onValueChange,
  hint,
  id,
  required,
  disabled,
  className,
}: SelectFieldProps) {
  const reactId = useId();
  const fieldId = id ?? `sf${reactId}`;
  const hintId = `${fieldId}-hint`;

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onValueChange?.(event.target.value);
  };

  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={fieldId} className="body-sm font-medium text-foreground">
        {label}
      </label>

      <div className="relative mt-2">
        <select
          id={fieldId}
          name={name}
          required={required}
          disabled={disabled}
          aria-describedby={hint ? hintId : undefined}
          onChange={handleChange}
          {...(value !== undefined ? { value } : { defaultValue })}
          className={cn(
            "h-11 w-full appearance-none rounded-md border border-input bg-background pl-3 pr-10 text-base text-foreground",
            "focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 10 6"
          className="pointer-events-none absolute right-3 top-1/2 h-1.5 w-2.5 -translate-y-1/2 text-muted-foreground"
        >
          <path
            d="M1 1 L5 5 L9 1"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
          />
        </svg>
      </div>

      {hint ? (
        <p id={hintId} className="caption mt-2 text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
