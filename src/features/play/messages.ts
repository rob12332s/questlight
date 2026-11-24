/** Plain-language messages for the hints and errors the live-game functions return. */

export function joinErrorMessage(code: string | undefined): string {
  switch (code) {
    case "invalid_code":
      return "Codes are six letters and numbers, like K7M2QX. Check it and try again.";
    case "not_found":
      return "No open game has that code. Check it with the host, or ask them for a new one.";
    case "already_started":
      return "That game has already started. Ask the host to start a new one.";
    case "full":
      return "That game is full.";
    case "class_only":
      return "That game is only for members of a class.";
    case "rate_limited":
      return "Too many tries in the last few minutes. Wait a little, then try again.";
    default:
      return "Something went wrong. Try again.";
  }
}

export function gameErrorMessage(hint: string | undefined | null): string {
  switch (hint) {
    case "not_enough_questions":
      return "There aren't enough questions for that choice yet. Try a whole subject instead.";
    case "rate_limited":
      return "You've created a lot of games in the last hour. Try again a little later.";
    case "need_players":
      return "Wait for at least one more player to join.";
    case "not_host":
      return "Only the host can do that.";
    case "already_started":
      return "This game has already started.";
    case "round_over":
      return "Time's up for that question.";
    case "not_open":
      return "The question hasn't started yet.";
    case "already_answered":
      return "You've already answered this one.";
    case "not_running":
      return "This game isn't running any more.";
    case "not_found":
      return "We couldn't find that game. You may have left it.";
    case "not_teacher":
      return "Only the class's teacher can host a game for it.";
    case "not_player":
      return "You're hosting this game, so you don't answer.";
    case "still_open":
      return "This question is still open.";
    default:
      return "Something went wrong. Try again.";
  }
}
