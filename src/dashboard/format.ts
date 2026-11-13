const timeFormat = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });
const dayAndTimeFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function formatTimestamp(isoTimestamp: string) {
  const date = new Date(isoTimestamp);
  const isToday = date.toDateString() === new Date().toDateString();
  return (isToday ? timeFormat : dayAndTimeFormat).format(date);
}

const SECONDS_PER_MINUTE = 60;

export function formatDuration(milliseconds: number) {
  const totalSeconds = Math.round(milliseconds / 1000);
  if (totalSeconds < SECONDS_PER_MINUTE) return `${totalSeconds} s`;
  return `${Math.floor(totalSeconds / SECONDS_PER_MINUTE)} min ${totalSeconds % SECONDS_PER_MINUTE} s`;
}
