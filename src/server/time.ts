import "server-only";

/** The current time on the server, for request-time labels like "Due tomorrow". */
export function serverNowMs(): number {
  return Date.now();
}
