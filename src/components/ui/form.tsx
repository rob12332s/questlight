"use client";

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useId, type ComponentProps, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/cn";
import { Button } from "./button";

const control =
  "block w-full rounded-md border bg-deep px-3 text-ink placeholder:text-ink-muted transition-colors " +
  "border-line-strong hover:border-ink-muted focus:border-beam focus:outline-none focus:ring-2 focus:ring-beam/30 " +
  "aria-[invalid=true]:border-incorrect aria-[invalid=true]:focus:ring-incorrect/30";

/** Label + control + hint/error, wired together for screen readers. */
export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: (props: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean }) => ReactNode;
}) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="mt-1.5">{children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}</div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 flex items-center gap-1.5 text-sm text-incorrect">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(control, "h-11", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(control, "h-11 pr-8", className)} {...props} />;
}

export function Checkbox({
  label,
  error,
  className,
  ...props
}: ComponentProps<"input"> & { label: ReactNode; error?: string }) {
  const id = useId();
  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-line-strong bg-deep accent-beam"
          {...props}
        />
        <label htmlFor={id} className="cursor-pointer text-sm text-ink-soft">
          {label}
        </label>
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 ml-8 flex items-center gap-1.5 text-sm text-incorrect">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}

export function FormAlert({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  const Icon = tone === "error" ? AlertCircle : CheckCircle2;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex gap-3 rounded-lg border p-3.5 text-sm",
        tone === "error" ? "border-incorrect/40 bg-incorrect/10 text-ink" : "border-correct/40 bg-correct/10 text-ink",
      )}
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", tone === "error" ? "text-incorrect" : "text-correct")} aria-hidden />
      <div>{children}</div>
    </div>
  );
}

/** Submit button that shows progress and prevents double submission. */
export function SubmitButton({
  children,
  pendingLabel,
  disabled,
  ...props
}: Omit<ComponentProps<typeof Button>, "type"> & { pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} aria-busy={pending || undefined} {...props}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {pending ? pendingLabel : children}
    </Button>
  );
}
