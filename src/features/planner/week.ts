export const DAY_LABELS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

// Dates are handled in UTC throughout: week_start is a Postgres `date`, and
// local-time arithmetic would shift the week across a timezone boundary.
function toDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function parseWeekStart(value: string | null | undefined): Date | null {
  if (!value || !DATE_ONLY.test(value)) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function mondayOf(date: Date): string {
  const day = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const isoWeekday = day.getUTCDay() === 0 ? 7 : day.getUTCDay();

  day.setUTCDate(day.getUTCDate() - (isoWeekday - 1));

  return toDateString(day);
}

export function currentWeekStart(now: Date = new Date()): string {
  // Read the viewer's calendar day, then reason about it as UTC.
  const local = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
  );

  return mondayOf(local);
}

export function resolveWeekStart(value: string | null | undefined): string {
  const parsed = parseWeekStart(value);

  return parsed ? mondayOf(parsed) : currentWeekStart();
}

export function addWeeks(weekStart: string, delta: number): string {
  const parsed = parseWeekStart(weekStart);

  if (!parsed) {
    return currentWeekStart();
  }

  parsed.setUTCDate(parsed.getUTCDate() + delta * 7);

  return toDateString(parsed);
}

export function weekDays(weekStart: string) {
  const parsed = parseWeekStart(weekStart) ?? new Date();
  const dayLabel = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

  return DAY_LABELS.map((label, index) => {
    const date = new Date(parsed);
    date.setUTCDate(parsed.getUTCDate() + index);

    return {
      index,
      label,
      shortLabel: label.slice(0, 3),
      date: toDateString(date),
      dateLabel: dayLabel.format(date),
      dayOfMonth: date.getUTCDate(),
    };
  });
}

export function formatWeekLabel(weekStart: string) {
  const days = weekDays(weekStart);
  const first = new Date(`${days[0].date}T00:00:00.000Z`);
  const last = new Date(`${days[6].date}T00:00:00.000Z`);
  const month = new Intl.DateTimeFormat("en", {
    month: "short",
    timeZone: "UTC",
  });
  const dayNumber = new Intl.DateTimeFormat("en", {
    day: "numeric",
    timeZone: "UTC",
  });

  const start = `${month.format(first)} ${dayNumber.format(first)}`;
  const end =
    first.getUTCMonth() === last.getUTCMonth()
      ? dayNumber.format(last)
      : `${month.format(last)} ${dayNumber.format(last)}`;

  return `${start} – ${end}`;
}
