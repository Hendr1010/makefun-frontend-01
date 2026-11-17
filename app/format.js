// format.js — small pure helpers shared by the views.
// No dependencies; every function is defensive about its input.

/** Escape text for safe insertion into HTML. */
export function esc(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** First non-empty value among the given candidates. */
export function val(...candidates) {
  for (const c of candidates) {
    if (c === null || c === undefined) continue;
    if (typeof c === "string" && c.trim() === "") continue;
    return c;
  }
  return "";
}

/** Format a USD amount as $1,234.56 (or $1,234 when it is whole). */
export function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  const whole = Number.isInteger(n);
  return "$" + n.toLocaleString("en-US", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

/** Format an ISO date as e.g. "24 Nov 2026, 17:00 UTC". */
export function date(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const pad = (x) => String(x).padStart(2, "0");
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

/**
 * Time-left string from a deadline, e.g. "2d 4h left", "45m left",
 * or "Closed" once the deadline has passed.
 */
export function left(deadline, now = Date.now()) {
  if (!deadline) return "";
  const end = new Date(deadline).getTime();
  if (Number.isNaN(end)) return "";
  const diff = end - now;
  if (diff <= 0) return "Closed";
  const mins = Math.floor(diff / 60000);
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  const rest = mins % 60;
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${rest}m left`;
  return `${rest}m left`;
}

/** Short number, e.g. 12518 -> "12,518". */
export function num(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("en-US");
}
