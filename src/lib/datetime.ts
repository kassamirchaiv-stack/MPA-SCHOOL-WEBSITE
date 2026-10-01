/**
 * Date/time inputs in the admin are entered in school time (Africa/Addis_Ababa,
 * UTC+3 all year — Ethiopia has no daylight saving).
 */
const OFFSET = "+03:00";
const OFFSET_MS = 3 * 60 * 60 * 1000;

/** Date → "YYYY-MM-DDTHH:mm" for <input type="datetime-local">, in school time. */
export function toLocalInput(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(new Date(date).getTime() + OFFSET_MS);
  return d.toISOString().slice(0, 16);
}

/** Date → "YYYY-MM-DD" for <input type="date">, in school time. */
export function toDateInput(date: Date | string | null | undefined): string {
  return toLocalInput(date).slice(0, 10);
}

/** "YYYY-MM-DDTHH:mm" or "YYYY-MM-DD" (school time) → ISO string (UTC), or "" if empty. */
export function fromLocalInput(value: string | null | undefined): string {
  if (!value) return "";
  const withTime = value.length === 10 ? `${value}T00:00` : value;
  const d = new Date(`${withTime}:00${OFFSET}`);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}
