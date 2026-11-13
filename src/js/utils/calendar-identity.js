export function calendarOccurrenceKey(entry) {
  const title = String(entry.title || entry.text || '')
    .normalize('NFKC')
    .toLocaleLowerCase('en')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
  return [
    title,
    new Date(entry.start || entry.startAt).toISOString(),
    new Date(entry.end || entry.endAt).toISOString(),
    Boolean(entry.allDay),
  ].join('|');
}
