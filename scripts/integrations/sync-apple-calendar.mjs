import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const year = Number(
  process.argv.find(argument => /^--year=\d{4}$/.test(argument))?.slice(7) || 2026
);
const inputFile = process.argv.find(argument => argument.startsWith('--input='))?.slice(8);
const includeNotes = process.argv.includes('--include-notes');
if (process.platform !== 'darwin' && !inputFile) {
  throw new Error(
    'Live Apple Calendar export requires macOS. Pass --input=FILE to process an existing export.'
  );
}

const input = inputFile
  ? readFileSync(inputFile, 'utf8')
  : execFileSync(
      'swift',
      [path.join(root, 'scripts/integrations/export-apple-calendar.swift'), String(year)],
      {
        cwd: root,
        encoding: 'utf8',
        maxBuffer: 20 * 1024 * 1024,
        timeout: 120_000,
      }
    );
const occurrences = JSON.parse(input);
const timeZone = 'Asia/Kolkata';
const dateParts = new Intl.DateTimeFormat('en-GB', {
  timeZone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const displayDate = new Intl.DateTimeFormat('en-US', { timeZone, month: 'short', day: 'numeric' });
const displayTime = new Intl.DateTimeFormat('en-US', {
  timeZone,
  hour: 'numeric',
  minute: '2-digit',
});
const getDateKey = instant => {
  const parts = Object.fromEntries(
    dateParts.formatToParts(new Date(instant)).map(part => [part.type, part.value])
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
};
const normalizeTitle = title =>
  String(title || '')
    .normalize('NFKC')
    .toLocaleLowerCase('en')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
const categoryFor = entry => {
  if (/birthday/i.test(entry.calendarName)) return 'birthdays';
  if (/holiday/i.test(entry.calendarName)) return 'holidays';
  return 'events';
};
const cleanLocation = value =>
  String(value || '')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[contact detail removed]')
    .replace(/\+?\d[\d\s().-]{8,}\d/g, '[phone removed]')
    .trim();
const validEventUrl = value => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
};
const duplicateGroups = new Map();
for (const entry of occurrences) {
  if (!entry?.title || !entry.start || !entry.end) continue;
  if (entry.calendarName === 'Luma') continue;
  const startDay = getDateKey(entry.start);
  const endDay = getDateKey(entry.end);
  if (startDay.slice(0, 4) !== String(year) && endDay.slice(0, 4) !== String(year)) continue;
  const key = [normalizeTitle(entry.title), entry.start, entry.end, Boolean(entry.allDay)].join(
    '|'
  );
  if (!duplicateGroups.has(key)) duplicateGroups.set(key, []);
  duplicateGroups.get(key).push(entry);
}

const events = [...duplicateGroups].map(([key, group]) => {
  const entry = [...group].sort(
    (left, right) =>
      (right.location?.length || 0) +
      (right.notes?.length || 0) -
      ((left.location?.length || 0) + (left.notes?.length || 0))
  )[0];
  const category = categoryFor(entry);
  const startDay = getDateKey(entry.start);
  const endDay = getDateKey(entry.end);
  const title = entry.title.trim();
  const dateLabel = displayDate.format(new Date(entry.start));
  const timeLabel = entry.allDay
    ? `${dateLabel} · All day`
    : `${dateLabel} · ${displayTime.format(new Date(entry.start))} – ${displayTime.format(new Date(entry.end))}`;
  return {
    id: Number.parseInt(createHash('sha256').update(key).digest('hex').slice(0, 12), 16),
    text: title,
    time: timeLabel,
    dateKey: startDay,
    endDateKey: endDay,
    startAt: entry.start,
    endAt: entry.end,
    allDay: Boolean(entry.allDay),
    category,
    tag: category === 'birthdays' ? 'Birthday' : category === 'holidays' ? 'Holiday' : 'Event',
    color: category === 'birthdays' ? 'pink' : category === 'holidays' ? 'gold' : 'blue',
    icon: category === 'birthdays' ? 'cake-candles' : category === 'holidays' ? 'star' : 'calendar',
    location: includeNotes ? String(entry.location || '') : cleanLocation(entry.location),
    notes: includeNotes ? String(entry.notes || '') : '',
    url: includeNotes ? validEventUrl(entry.url) : '',
    sourceCalendars: [
      ...new Set(
        group.map(item => (item.calendarName.includes('@') ? 'Google Calendar' : item.calendarName))
      ),
    ],
    isSynced: true,
    completed: false,
  };
});
events.sort(
  (left, right) => left.startAt.localeCompare(right.startAt) || left.text.localeCompare(right.text)
);
const snapshot = {
  year,
  timeZone,
  syncedAt: new Date().toISOString(),
  sourceCount: occurrences.length,
  duplicateCount: [...duplicateGroups.values()].reduce((sum, group) => sum + group.length - 1, 0),
  events,
};
const outputFile = path.join(root, 'src/js/data/apple-calendar-snapshot.js');
writeFileSync(
  outputFile,
  `// Generated by npm run sync:apple-calendar. Public portfolio data.\nexport const appleCalendarSnapshot = ${JSON.stringify(snapshot, null, 2)};\n`
);
console.log(
  `Apple Calendar ${year}: ${occurrences.length} visible occurrences, ${snapshot.duplicateCount} duplicates collapsed, ${events.length} published entries.`
);
if (!includeNotes)
  console.log(
    'Invitation notes omitted. Use --include-notes only after reviewing public disclosure.'
  );
