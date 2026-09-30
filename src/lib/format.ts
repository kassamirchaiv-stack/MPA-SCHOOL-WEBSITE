/** All public dates are shown in the school's local time. */
export const SCHOOL_TIME_ZONE = "Africa/Addis_Ababa";

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: SCHOOL_TIME_ZONE });
const shortDateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: SCHOOL_TIME_ZONE });
const timeFmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: SCHOOL_TIME_ZONE });
const dayFmt = new Intl.DateTimeFormat("en-GB", { day: "2-digit", timeZone: SCHOOL_TIME_ZONE });
const monthFmt = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: SCHOOL_TIME_ZONE });
const ymdFmt = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: SCHOOL_TIME_ZONE });

export function formatDate(date: Date | null | undefined): string {
  return date ? dateFmt.format(date) : "";
}

export function formatShortDate(date: Date | null | undefined): string {
  return date ? shortDateFmt.format(date) : "";
}

export function formatTime(date: Date): string {
  return timeFmt.format(date);
}

/** Day number and short month for date badges, e.g. { day: "05", month: "Oct" }. */
export function dateBadge(date: Date) {
  return { day: dayFmt.format(date), month: monthFmt.format(date) };
}

function sameDay(a: Date, b: Date) {
  return ymdFmt.format(a) === ymdFmt.format(b);
}

/** "12 October 2026, 09:00–12:00", "12 October 2026 (all day)", "12–14 October 2026". */
export function formatEventWhen(event: { startsAt: Date; endsAt: Date | null; allDay: boolean }): string {
  const { startsAt, endsAt, allDay } = event;
  if (!endsAt || sameDay(startsAt, endsAt)) {
    const day = formatDate(startsAt);
    if (allDay) return day;
    return endsAt ? `${day}, ${formatTime(startsAt)}–${formatTime(endsAt)}` : `${day}, ${formatTime(startsAt)}`;
  }
  const range = `${formatDate(startsAt)} – ${formatDate(endsAt)}`;
  return allDay ? range : `${formatDate(startsAt)}, ${formatTime(startsAt)} – ${formatDate(endsAt)}, ${formatTime(endsAt)}`;
}
