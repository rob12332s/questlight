"use client";

import { Trash2 } from "lucide-react";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormAlert, Input, Select, SubmitButton } from "@/components/ui/form";
import { initialFormState } from "@/features/auth/schemas";
import { addCard, createDeck, deleteCard, deleteDeck, renameDeck } from "./actions";

export function CreateDeckForm({ subjects }: { subjects: Array<{ id: string; name: string }> }) {
  const [state, action] = useActionState(createDeck, initialFormState);
  return (
    <form action={action} className="space-y-4">
      {state.status === "error" && state.message && <FormAlert tone="error">{state.message}</FormAlert>}
      <Field label="Deck name" error={state.errors?.title}>
        {(props) => <Input {...props} name="title" maxLength={80} placeholder="For example: Cell organelles" required />}
      </Field>
      <Field label="Subject (optional)">
        {(props) => (
          <Select {...props} name="subjectId" defaultValue="">
            <option value="">No subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <SubmitButton pendingLabel="Creating…">Create deck</SubmitButton>
    </form>
  );
}

export function AddCardForm({ deckId }: { deckId: string }) {
  const [state, action] = useActionState(addCard.bind(null, deckId), initialFormState);
  const formRef = useRef<HTMLFormElement>(null);
  const frontRef = useRef<HTMLTextAreaElement>(null);

  // After a successful add, clear the form and put the cursor back on "Front".
  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      frontRef.current?.focus();
    }
  }, [state]);

  const area =
    "block w-full rounded-md border border-line-strong bg-deep px-3 py-2.5 text-ink placeholder:text-ink-muted focus:border-beam focus:ring-2 focus:ring-beam/30 focus:outline-none aria-[invalid=true]:border-incorrect";
  return (
    <form ref={formRef} action={action} className="space-y-4">
      {state.status === "error" && state.message && <FormAlert tone="error">{state.message}</FormAlert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Front" hint="A question or prompt." error={state.errors?.front}>
          {(props) => <textarea {...props} ref={frontRef} name="front" rows={3} maxLength={300} className={area} required />}
        </Field>
        <Field label="Back" hint="The answer." error={state.errors?.back}>
          {(props) => <textarea {...props} name="back" rows={3} maxLength={600} className={area} required />}
        </Field>
      </div>
      <Field label="Explanation (optional)" hint="Shown after you flip the card.">
        {(props) => <textarea {...props} name="explanation" rows={2} maxLength={900} className={area} />}
      </Field>
      <div className="flex items-center gap-3">
        <SubmitButton pendingLabel="Adding…">Add card</SubmitButton>
        {state.status === "success" && (
          <span role="status" className="animate-enter-soft text-sm text-correct">
            Card added
          </span>
        )}
      </div>
    </form>
  );
}

export function DeleteCardButton({ deckId, cardId }: { deckId: string; cardId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      onClick={() => start(() => deleteCard(deckId, cardId))}
      disabled={pending}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-slate hover:text-incorrect disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" aria-hidden />
      <span className="sr-only">Delete card</span>
    </button>
  );
}

export function DeckSettings({ deckId, title }: { deckId: string; title: string }) {
  const [name, setName] = useState(title);
  const [message, setMessage] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();
  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const r = await renameDeck(deckId, name);
            setMessage(r.ok ? "Saved." : (r.message ?? "Couldn't save."));
          });
        }}
        className="flex flex-wrap items-end gap-3"
      >
        <div className="min-w-0 flex-1">
          <Field label="Deck name">
            {(props) => <Input {...props} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />}
          </Field>
        </div>
        <Button type="submit" variant="secondary" disabled={pending || name.trim() === title}>
          Save name
        </Button>
        {message && (
          <p role="status" className="w-full text-sm text-ink-soft">
            {message}
          </p>
        )}
      </form>
      <div>
        {confirming ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-ink-soft">Delete this deck and all its cards? This can&apos;t be undone.</p>
            <Button variant="secondary" className="text-incorrect" disabled={pending} onClick={() => start(() => deleteDeck(deckId))}>
              Yes, delete deck
            </Button>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button variant="ghost" className="text-incorrect" onClick={() => setConfirming(true)}>
            Delete deck
          </Button>
        )}
      </div>
    </div>
  );
}
