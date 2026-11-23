import { Crown, Users } from "lucide-react";
import { formatRoomCode } from "@/domain/room-code";

const PLAYERS = [
  { name: "mira.k", host: true },
  { name: "Jonah", host: false },
  { name: "AbiR", host: false },
  { name: "Tomasz-11", host: false },
];

/**
 * An illustration of the live-game lobby built from the real UI pieces. It is labelled
 * as a preview; the names are made up and nothing here is live.
 */
export function LobbyPreview() {
  return (
    <figure className="rounded-xl border border-line bg-deep p-5 shadow-raised sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-ink-muted">Room code</p>
          <p className="tabular mt-1 text-3xl font-semibold tracking-[0.12em] text-ink">{formatRoomCode("KX49QT")}</p>
        </div>
        <span className="rounded-sm bg-slate px-2 py-0.5 text-xs text-ink-soft">Preview</span>
      </div>

      <div className="mt-5 flex items-center justify-between text-sm">
        <p className="text-ink-soft">Chemistry, atomic structure, 10 questions</p>
        <p className="tabular flex items-center gap-1.5 text-ink-muted">
          <Users className="h-4 w-4" aria-hidden />4 / 30
        </p>
      </div>

      <ul className="mt-3 grid grid-cols-2 gap-2">
        {PLAYERS.map((player) => (
          <li key={player.name} className="flex items-center gap-2 rounded-md bg-slate px-3 py-2.5 text-sm text-ink">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-raised text-xs font-semibold text-ink-soft">
              {player.name.charAt(0).toUpperCase()}
            </span>
            <span className="truncate">{player.name}</span>
            {player.host && (
              <span className="ml-auto flex items-center gap-1 text-xs text-beam-bright">
                <Crown className="h-3.5 w-3.5" aria-hidden />
                Host
              </span>
            )}
          </li>
        ))}
      </ul>

      <figcaption className="mt-4 text-xs text-ink-muted">
        Illustration of the lobby. Live games are in development.
      </figcaption>
    </figure>
  );
}
