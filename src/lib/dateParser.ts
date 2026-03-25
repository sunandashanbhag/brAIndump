import * as chrono from "chrono-node";

const AMBIGUOUS_TERMS = ["soon", "later", "eventually", "sometime", "at some point"];
const DEFAULT_HOUR = 9;

export function parseReminderDate(
  text: string,
  referenceDate: Date = new Date()
): Date | null {
  const lower = text.toLowerCase().trim();

  if (AMBIGUOUS_TERMS.some((term) => lower.includes(term))) {
    return null;
  }

  // Normalize reference date so chrono operates on UTC wall-clock values.
  // chrono uses local time; we create a local Date whose local components
  // match the UTC components of the caller's referenceDate so that results
  // returned via getHours() / getDate() are consistent with UTC expectations.
  const offset = referenceDate.getTimezoneOffset() * 60 * 1000;
  const utcAlignedRef = new Date(referenceDate.getTime() + offset);

  const results = chrono.parse(text, utcAlignedRef, { forwardDate: true });
  if (results.length === 0) return null;

  const parsed = results[0];
  const date = parsed.start.date();

  if (!parsed.start.isCertain("hour") && !parsed.start.isCertain("minute")) {
    date.setHours(DEFAULT_HOUR, 0, 0, 0);
  }

  return date;
}
