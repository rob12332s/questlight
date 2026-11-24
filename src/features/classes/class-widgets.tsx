"use client";

import { Check, Copy } from "lucide-react";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert, SubmitButton } from "@/components/ui/form";
import { joinGame, type PlayFormState } from "@/features/play/actions";

/** Copies a join link for this page's origin. */
export function CopyLinkButton({ path, label }: { path: string; label: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }
  return (
    <Button variant="secondary" size="sm" onClick={() => void copy()}>
      {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
      {copied ? "Link copied" : label}
    </Button>
  );
}

/** Joins a class game straight from the class page. */
export function JoinRoomButton({ code, label }: { code: string; label: string }) {
  const [state, action] = useActionState<PlayFormState, FormData>(joinGame, {});
  return (
    <form action={action} className="flex flex-col items-end gap-2">
      <input type="hidden" name="code" value={code} />
      <SubmitButton pendingLabel="Joining…" size="sm">
        {label}
      </SubmitButton>
      {state.error && <FormAlert tone="error">{state.error}</FormAlert>}
    </form>
  );
}
