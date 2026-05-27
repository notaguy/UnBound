export function getWeekRange(reference = new Date()): { start: Date; end: Date } {
  const start = new Date(reference);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + diff);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export function isDateInWeek(dateStr: string, reference = new Date()): boolean {
  const date = new Date(dateStr + "T12:00:00");
  const { start, end } = getWeekRange(reference);
  return date >= start && date <= end;
}

export function formatWeekLabel(reference = new Date()): string {
  const { start, end } = getWeekRange(reference);
  const fmt = new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "short" });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

export function formatEventDate(dateStr: string): string {
  return new Intl.DateTimeFormat("ro-RO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(dateStr + "T12:00:00"));
}
