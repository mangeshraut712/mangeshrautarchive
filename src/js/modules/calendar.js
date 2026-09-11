import { openCalendlyPopup } from '../utils/calendly.js';
import { LUMA_CALENDARS_URL } from '../utils/luma.js';
import { escapeHtml } from '../utils/escape-html.js';
import { getFormsApiBase } from '../services/form-submission.js';
import { changelogEntries } from '../data/changelog-entries.js';

const CALENDAR_ENDPOINT = '/api/calendar/availability';

function ensureContactSolidStyles() {
  const id = 'contact-solid-css';
  const href = 'assets/css/contact-solid.css?v=20260824theme1';
  if (document.getElementById(id) || document.querySelector('link[href*="contact-solid.css"]')) {
    return;
  }
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

export function dateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Smart Natural Language Reminder & Event Parser
 * Automatically parses relative dates, times, categories, and tags from plain text.
 */
export function parseNaturalLanguageReminder(rawText, baseDate = new Date()) {
  const currentBase =
    baseDate instanceof Date && !isNaN(baseDate.getTime()) ? baseDate : new Date();
  if (!rawText || typeof rawText !== 'string') {
    return {
      title: 'New Reminder',
      dateKey: dateKey(currentBase.getFullYear(), currentBase.getMonth(), currentBase.getDate()),
      time: 'Scheduled',
      timeOnly: 'Scheduled',
      category: 'reminders',
      tag: 'Task',
      color: 'blue',
      icon: 'bell',
    };
  }

  let text = rawText.trim();
  let targetDate = new Date(
    currentBase.getFullYear(),
    currentBase.getMonth(),
    currentBase.getDate()
  );
  let timeStr = 'Scheduled';
  let category = 'reminders';
  let tag = 'Task';
  let color = 'blue';
  let icon = 'bell';

  const lower = text.toLowerCase();

  // 1. Detect Category / Tag / Color / Icon
  if (/#urgent\b/i.test(lower) || /\burgent\b|\basap\b|\bdeadline\b|\bpriority\b/i.test(lower)) {
    tag = 'Urgent';
    color = 'red';
    icon = 'bolt';
    text = text.replace(/#urgent\b/gi, '').trim();
  } else if (
    /#ai\b/i.test(lower) ||
    /\bai\b|\bllm\b|\bmodel\b|\bgpt\b|\bclaude\b|\bagent\b/i.test(lower)
  ) {
    tag = 'AI';
    color = 'purple';
    icon = 'brain';
    text = text.replace(/#ai\b/gi, '').trim();
  } else if (/#design\b/i.test(lower) || /\bdesign\b|\bui\b|\bux\b|\bfigma\b/i.test(lower)) {
    tag = 'Design';
    color = 'blue';
    icon = 'palette';
    text = text.replace(/#design\b/gi, '').trim();
  } else if (/#birthday\b/i.test(lower) || /\bbirthday\b|\bbday\b/i.test(lower)) {
    tag = 'Birthday';
    color = 'pink';
    icon = 'cake-candles';
    category = 'birthdays';
    text = text.replace(/#birthday\b/gi, '').trim();
  } else if (
    /#meetup\b/i.test(lower) ||
    /\bmeetup\b|\bhackathon\b|\bconference\b|\bworkshop\b/i.test(lower)
  ) {
    tag = 'Event';
    color = 'green';
    icon = 'ticket';
    category = 'events';
    text = text.replace(/#meetup\b/gi, '').trim();
  } else if (
    /#sync\b/i.test(lower) ||
    /\bsync\b|\b1:1\b|\bcall\b|\bmeeting\b|\bcatchup\b/i.test(lower)
  ) {
    tag = 'Sync';
    color = 'blue';
    icon = 'handshake';
    text = text.replace(/#sync\b/gi, '').trim();
  }

  // 2. Relative & Named Date Parsing
  const monthNames = [
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec',
  ];
  const fullMonthNames = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
  ];
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayShortNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  let matchedDate = false;

  // "tomorrow" / "tmrw"
  if (/\b(?:tomorrow|tmrw)\b/i.test(text)) {
    targetDate.setDate(targetDate.getDate() + 1);
    text = text.replace(/\b(?:tomorrow|tmrw)\b/gi, '').trim();
    matchedDate = true;
  }
  // "today" / "tonight"
  else if (/\b(?:today|tonight)\b/i.test(text)) {
    text = text.replace(/\b(?:today|tonight)\b/gi, '').trim();
    matchedDate = true;
  }
  // "in X days"
  else if (/\bin\s+(\d+)\s+days?\b/i.test(text)) {
    const m = text.match(/\bin\s+(\d+)\s+days?\b/i);
    if (m) {
      targetDate.setDate(targetDate.getDate() + parseInt(m[1], 10));
      text = text.replace(/\bin\s+\d+\s+days?\b/gi, '').trim();
      matchedDate = true;
    }
  }
  // "next Monday" / "this Friday" / "on Friday"
  else if (
    /\b(?:next|this|on)?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/i.test(
      text
    )
  ) {
    const m = text.match(
      /\b(?:next|this|on)?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/i
    );
    if (m) {
      const dayTargetStr = m[1].toLowerCase();
      let targetDayIdx = dayNames.indexOf(dayTargetStr);
      if (targetDayIdx === -1) targetDayIdx = dayShortNames.indexOf(dayTargetStr);
      if (targetDayIdx !== -1) {
        const currentDayIdx = targetDate.getDay();
        let daysUntil = (targetDayIdx - currentDayIdx + 7) % 7;
        if (daysUntil === 0) daysUntil = 7;
        targetDate.setDate(targetDate.getDate() + daysUntil);
        text = text.replace(m[0], '').trim();
        matchedDate = true;
      }
    }
  }

  // Explicit date: "Sep 15", "September 15", "15 Sep", "2026-09-15"
  if (!matchedDate) {
    const isoMatch = text.match(/\b(20\d\d)-(\d{1,2})-(\d{1,2})\b/);
    if (isoMatch) {
      targetDate = new Date(
        parseInt(isoMatch[1], 10),
        parseInt(isoMatch[2], 10) - 1,
        parseInt(isoMatch[3], 10)
      );
      text = text.replace(isoMatch[0], '').trim();
    } else {
      const monthRegex = new RegExp(
        `\\b(?:on\\s+)?(${fullMonthNames.join('|')}|${monthNames.join('|')})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(20\\d\\d))?\\b`,
        'i'
      );
      const mMatch = text.match(monthRegex);
      if (mMatch) {
        const mStr = mMatch[1].toLowerCase().slice(0, 3);
        const mIdx = monthNames.indexOf(mStr);
        const dayVal = parseInt(mMatch[2], 10);
        const yearVal = mMatch[3] ? parseInt(mMatch[3], 10) : targetDate.getFullYear();
        if (mIdx !== -1 && dayVal >= 1 && dayVal <= 31) {
          targetDate = new Date(yearVal, mIdx, dayVal);
          text = text.replace(mMatch[0], '').trim();
        }
      }
    }
  }

  // 3. Time Parsing: "at 3pm", "3:30pm", "10:00 AM", "14:00", "at noon"
  const timeRegex =
    /\b(?:at\s+)?(?:(\d{1,2})(?::(\d{2}))?\s*(am|pm)|(\d{1,2}):(\d{2})|noon|midnight)\b/i;
  const tMatch = text.match(timeRegex);
  if (tMatch) {
    const rawMatch = tMatch[0];
    const matchLower = rawMatch.toLowerCase();
    if (matchLower.includes('noon')) {
      timeStr = '12:00 PM';
    } else if (matchLower.includes('midnight')) {
      timeStr = '12:00 AM';
    } else if (tMatch[1] && tMatch[3]) {
      const hh = parseInt(tMatch[1], 10);
      const mm = tMatch[2] ? tMatch[2] : '00';
      const ampm = tMatch[3].toUpperCase();
      timeStr = `${hh}:${mm} ${ampm}`;
    } else if (tMatch[4] && tMatch[5]) {
      const hh = parseInt(tMatch[4], 10);
      const mm = tMatch[5];
      const ampm = hh >= 12 ? 'PM' : 'AM';
      const dispH = hh % 12 || 12;
      timeStr = `${dispH}:${mm} ${ampm}`;
    }
    text = text.replace(rawMatch, '').trim();
  }

  // Clean up residual prepositions / punctuation
  text = text.replace(/^(?:at|on|for|to|remind me to|reminder:?)\s+/i, '');
  text = text.replace(/\s+(?:at|on|for)\s*$/i, '');
  text = text.replace(/^[-,.:;\s]+|[-,.:;\s]+$/g, '').trim();

  const finalTitle = text || 'New Reminder';
  const finalKey = dateKey(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const monthAbbr = targetDate.toLocaleString('en-US', { month: 'short' });
  const displayTime =
    timeStr !== 'Scheduled'
      ? `${monthAbbr} ${targetDate.getDate()} · ${timeStr}`
      : `${monthAbbr} ${targetDate.getDate()} · Scheduled`;

  return {
    title: finalTitle,
    dateKey: finalKey,
    time: displayTime,
    timeOnly: timeStr,
    category,
    tag,
    color,
    icon,
  };
}

export class CalendarWidget {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    const now = new Date();
    this.date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    this.selectedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    this.selectedDayCell = null;
    this.selectedDayFilter = dateKey(now.getFullYear(), now.getMonth(), now.getDate());
    this.activeFilter = 'day';
    this.searchQuery = '';
    this.aiBriefData = null;
    this.liveSlots = [];
    this.liveEvents = [];
    this.liveProviders = ['google', 'apple'];
    this.aiAgentStatus = null;
    this.availabilityLoaded = false;

    // "Smart" Reminders, Verified Birthdays & Live Calendar Data
    this.reminders = [
      // ── Verified Birthdays (3) ──────────────────────────────────
      {
        id: 996,
        text: "Stephen's Birthday 🎂",
        time: 'Aug 6 · All Day',
        dateKey: '2026-08-06',
        category: 'birthdays',
        tag: 'Birthday',
        color: 'pink',
        icon: 'cake-candles',
        completed: false,
      },
      {
        id: 997,
        text: "Mom's Birthday ❤️🎂",
        time: 'Aug 15 · All Day',
        dateKey: '2026-08-15',
        category: 'birthdays',
        tag: 'Birthday',
        color: 'pink',
        icon: 'cake-candles',
        completed: false,
      },
      {
        id: 999,
        text: "Mangesh's Birthday 🎂",
        time: 'Dec 7 · All Day',
        dateKey: '2026-12-07',
        category: 'birthdays',
        tag: 'Special',
        color: 'gold',
        icon: 'cake-candles',
        completed: false,
      },
      // ── Live Luma Events & Community Schedule (Account: mbr63@drexel.edu) ───
      {
        id: 211,
        text: "Build with AI - Code for Communities - Pre DevFest Pune'26 Workshop Series 4.0 | Thoughtworks",
        time: 'Sep 12 · 9:00 AM',
        dateKey: '2026-09-12',
        category: 'events',
        tag: 'GDG Pune',
        color: 'green',
        icon: 'laptop-code',
        location: 'Thoughtworks Technologies India Private Limited',
        lumaHost: 'GDG Pune',
        lumaStatus: 'going',
        lumaUrl: 'https://luma.com/o0ls3yva',
        isLuma: true,
        completed: false,
      },
      {
        id: 212,
        text: 'The AI Engineering Stack (+290)',
        time: 'Sep 12 · 10:00 AM',
        dateKey: '2026-09-12',
        category: 'events',
        tag: 'AI Stack',
        color: 'green',
        icon: 'layer-group',
        location: 'DevX, Pune',
        lumaHost: 'Indian Data Club',
        lumaStatus: 'going',
        lumaUrl: 'https://luma.com/bkdq2d6r',
        isLuma: true,
        completed: false,
      },
      {
        id: 213,
        text: 'Morning Sessions w/ Builders (Pune Edition) (+49)',
        time: 'Sep 12 · 11:00 AM',
        dateKey: '2026-09-12',
        category: 'events',
        tag: 'Builders',
        color: 'green',
        icon: 'mug-hot',
        location: 'The Office Club, Alluring Sky',
        lumaHost: 'Nischay Joshi & Almas',
        lumaStatus: 'going',
        lumaUrl: 'https://luma.com/zk2sqibt',
        isLuma: true,
        completed: false,
      },
      {
        id: 214,
        text: 'Astra Commons: Pune',
        time: 'Sep 18 · 12:30 PM',
        dateKey: '2026-09-18',
        category: 'events',
        tag: 'Astra',
        color: 'green',
        icon: 'users',
        location: 'Pune',
        lumaHost: 'AMAN MOGAL, Rhiannon Payne, Pauline P. Narvas & Vaibhav Srivastav',
        lumaStatus: 'going',
        lumaUrl: 'https://luma.com/dhbisvze',
        isLuma: true,
        completed: false,
      },
      {
        id: 215,
        text: 'Dev Days | Pune, India (+336)',
        time: 'Sep 19 · 9:30 AM',
        dateKey: '2026-09-19',
        category: 'events',
        tag: 'Dev Days',
        color: 'orange',
        icon: 'clock',
        location: 'Data Axle Pune',
        lumaHost: 'Dev Days, Alok Kumar & Tauqeer Ahmad',
        lumaStatus: 'waitlisted',
        lumaUrl: 'https://luma.com/lh60mh4e',
        isLuma: true,
        completed: false,
      },
      {
        id: 216,
        text: 'Bhopal | Claude Code Build Day - Fable 5.1',
        time: 'Sep 20 · 11:00 AM',
        dateKey: '2026-09-20',
        category: 'events',
        tag: 'Claude',
        color: 'purple',
        icon: 'code',
        location: 'Location Shown Upon Approval',
        lumaHost: 'Aniket Sahu',
        lumaStatus: 'pending',
        lumaUrl: 'https://luma.com/claude-z01j',
        isLuma: true,
        completed: false,
      },
      {
        id: 217,
        text: 'Data meets AI (+110)',
        time: 'Sep 26 · 9:30 AM',
        dateKey: '2026-09-26',
        category: 'events',
        tag: 'Data AI',
        color: 'orange',
        icon: 'database',
        location: 'Nutanix Technologies India Pvt Ltd',
        lumaHost: 'Pranav Mehta & ClickHouse Team',
        lumaStatus: 'waitlisted',
        lumaUrl: 'https://luma.com/8fp3lum7',
        isLuma: true,
        completed: false,
      },
      {
        id: 218,
        text: 'NEO4J Graph Builder: BUILD SPRINT, Pune',
        time: 'Sep 26 · 10:00 AM',
        dateKey: '2026-09-26',
        category: 'events',
        tag: 'Neo4j',
        color: 'purple',
        icon: 'diagram-project',
        location: 'Pune',
        lumaHost: 'Rajat Gupta',
        lumaStatus: 'pending',
        lumaUrl: 'https://luma.com/nsm1hg6e',
        isLuma: true,
        completed: false,
      },
      // ── Past Done / Attended Luma Events ───────────────────────────
      {
        id: 201,
        text: 'Codex Build House - Pune (+63)',
        time: 'Sep 5 · 9:00 AM',
        dateKey: '2026-09-05',
        category: 'events',
        tag: 'Codex',
        color: 'blue',
        icon: 'terminal',
        location: 'Manogat villa, Pune',
        lumaHost: 'AMAN MOGAL, Pauline P. Narvas & Om Kute',
        lumaStatus: 'done',
        lumaUrl: 'https://luma.com/sq2mmwfm',
        isLuma: true,
        completed: true,
      },
      {
        id: 202,
        text: 'Cafe Cursor Pune',
        time: 'Aug 29 · 10:00 AM',
        dateKey: '2026-08-29',
        category: 'events',
        tag: 'Cursor',
        color: 'blue',
        icon: 'mug-hot',
        location: 'Mauji - The Time Cafe',
        lumaHost: 'Himanshu Sangshetti',
        lumaStatus: 'done',
        lumaUrl: 'https://luma.com/bbs0fetq',
        isLuma: true,
        completed: true,
      },
      {
        id: 205,
        text: 'Pune | Claude Code Meetup',
        time: 'Aug 29 · 3:00 PM',
        dateKey: '2026-08-29',
        category: 'events',
        tag: 'Claude',
        color: 'purple',
        icon: 'code',
        location: 'Anthropic Community & Livestream',
        lumaHost: 'Claude Community Network',
        lumaStatus: 'done',
        lumaUrl: 'https://luma.com/claude-z01j',
        isLuma: true,
        completed: true,
      },
      {
        id: 203,
        text: 'Cursor Meetup Philadelphia — One Year Anniversary 🎂 (+252)',
        time: 'Aug 25 · 6:00 PM EDT',
        dateKey: '2026-08-25',
        category: 'events',
        tag: 'Cursor',
        color: 'blue',
        icon: 'cake-candles',
        location: 'Indy Hall Clubhouse at 709 N 2nd St, Philadelphia',
        lumaHost: 'Luis Cielak & Malcolm Jones',
        lumaStatus: 'done',
        lumaUrl: 'https://luma.com/cursor-1z5g',
        isLuma: true,
        completed: true,
      },
      {
        id: 204,
        text: 'Cafe Cursor Philadelphia',
        time: 'Jul 16 · 7:30 PM (10:00 AM EDT)',
        dateKey: '2026-07-16',
        category: 'events',
        tag: 'Cursor',
        color: 'blue',
        icon: 'mug-hot',
        location: 'Percy Diner & Bar, Philadelphia',
        lumaHost: 'Luis Cielak & Malcolm Jones',
        lumaStatus: 'done',
        lumaUrl: 'https://luma.com/tkx269iu',
        isLuma: true,
        completed: true,
      },
      // ── Core Tasks & Smart Reminders ────────────────────────────
      {
        id: 100,
        text: 'Google & Apple Calendar Sync',
        time: 'Live Auto-Sync',
        dateKey: dateKey(now.getFullYear(), now.getMonth(), now.getDate()),
        category: 'reminders',
        tag: 'Live Sync',
        color: 'blue',
        icon: 'calendar-check',
        completed: false,
      },
      {
        id: 101,
        text: 'Review Multi-Channel Webhooks & Edge Telemetry',
        time: 'Sep 2 · 10:00 AM',
        dateKey: '2026-09-02',
        category: 'reminders',
        tag: 'Ops',
        color: 'blue',
        icon: 'shield-halved',
        completed: false,
      },
      {
        id: 102,
        text: 'Quarterly Architecture & System Optimization Review',
        time: 'Sep 3 · 2:00 PM',
        dateKey: '2026-09-03',
        category: 'reminders',
        tag: 'Architecture',
        color: 'purple',
        icon: 'sliders',
        completed: false,
      },
      {
        id: 103,
        text: 'AI Agentic Benchmark & Token Ledger Audit',
        time: 'Sep 4 · 4:30 PM',
        dateKey: '2026-09-04',
        category: 'reminders',
        tag: 'AI',
        color: 'gold',
        icon: 'brain',
        completed: false,
      },
      {
        id: 104,
        text: 'Sync with Engineering Collaborators',
        time: 'Sep 8 · 11:00 AM',
        dateKey: '2026-09-08',
        category: 'reminders',
        tag: 'Sync',
        color: 'blue',
        icon: 'handshake',
        completed: false,
      },
      {
        id: 106,
        text: 'Sitewide 100/100/100/100 QA Certification & Telemetry Sync',
        time: 'Sep 9 · 11:30 AM',
        dateKey: '2026-09-09',
        category: 'reminders',
        tag: 'Milestone',
        color: 'blue',
        icon: 'award',
        completed: false,
      },
      {
        id: 105,
        text: 'FastAPI & Cloudflare Edge Resilience Stress Test',
        time: 'Sep 15 · 3:00 PM',
        dateKey: '2026-09-15',
        category: 'reminders',
        tag: 'QA',
        color: 'red',
        icon: 'bolt',
        completed: false,
      },
      {
        id: 1,
        text: 'Review Portfolio Design',
        time: 'Aug 24 · 10:00 AM',
        dateKey: '2026-08-24',
        category: 'reminders',
        tag: 'Design',
        color: 'blue',
        icon: 'palette',
        completed: false,
      },
      {
        id: 2,
        text: 'Email Mangesh',
        time: 'Aug 25 · 2:00 PM',
        dateKey: '2026-08-25',
        category: 'reminders',
        tag: 'Urgent',
        color: 'red',
        icon: 'envelope',
        completed: false,
      },
      {
        id: 3,
        text: 'AI Model Training',
        time: 'Aug 25 · 4:30 PM',
        dateKey: '2026-08-25',
        category: 'reminders',
        tag: 'Dev',
        color: 'purple',
        icon: 'brain',
        completed: false,
      },
    ];

    // Inject recent Changelog Releases as Calendar milestone entries
    if (Array.isArray(changelogEntries)) {
      changelogEntries.slice(0, 10).forEach((entry, idx) => {
        if (!entry.date) return;
        this.reminders.push({
          id: 5000 + idx,
          text: entry.title,
          time: `${entry.date} · Shipped`,
          dateKey: entry.date,
          category: 'changelog',
          tag: 'Release',
          color: 'purple',
          icon: 'rocket',
          completed: false,
          isChangelog: true,
          changelogId: entry.id,
        });
      });
    }

    // Load local storage persisted reminders & completion states
    this.loadPersistedReminders();
  }

  loadPersistedReminders() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const stored = window.localStorage.getItem('mangesh_portfolio_reminders');
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && item.id && item.isCustomUserReminder) {
            const exists = this.reminders.some(r => r.id === item.id);
            if (!exists) {
              this.reminders.unshift(item);
            }
          }
        }
        const completionMap = new Map();
        for (const item of parsed) {
          if (item && item.id !== undefined && typeof item.completed === 'boolean') {
            completionMap.set(item.id, item.completed);
          }
        }
        for (const r of this.reminders) {
          if (completionMap.has(r.id)) {
            r.completed = completionMap.get(r.id);
          }
        }
      }
    } catch {
      // Ignore storage read errors
    }
  }

  persistReminders() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const toSave = this.reminders
        .filter(r => r.isCustomUserReminder || r.completed)
        .map(r => ({
          id: r.id,
          text: r.text,
          time: r.time,
          dateKey: r.dateKey,
          category: r.category,
          tag: r.tag,
          color: r.color,
          icon: r.icon,
          completed: Boolean(r.completed),
          isCustomUserReminder: Boolean(r.isCustomUserReminder),
        }));
      window.localStorage.setItem('mangesh_portfolio_reminders', JSON.stringify(toSave));
    } catch {
      // Ignore storage write errors
    }
  }

  checkScheduleConflict(targetDateKey, timeStr = '') {
    if (!targetDateKey) {
      return { hasConflict: false, conflictItem: null, countOnDay: 0, message: '' };
    }

    const itemsOnDay = this.reminders.filter(r => {
      if (r.isChangelog) return false;
      if (!r.dateKey) return false;
      return r.dateKey === targetDateKey || r.dateKey.endsWith(`-${targetDateKey.slice(5)}`);
    });

    if (itemsOnDay.length === 0) {
      return {
        hasConflict: false,
        conflictItem: null,
        countOnDay: 0,
        message: 'No conflicts. Day is completely open.',
      };
    }

    if (timeStr && timeStr !== 'Scheduled' && timeStr !== 'All Day') {
      const normalizedTime = timeStr.toLowerCase().replace(/\s+/g, '');
      const exactTimeConflict = itemsOnDay.find(r => {
        if (!r.time) return false;
        const rTime = r.time.toLowerCase().replace(/\s+/g, '');
        return rTime.includes(normalizedTime);
      });

      if (exactTimeConflict) {
        return {
          hasConflict: true,
          conflictItem: exactTimeConflict,
          countOnDay: itemsOnDay.length,
          message: `Time conflict: "${exactTimeConflict.text}" is already scheduled at ${exactTimeConflict.time}.`,
        };
      }
    }

    if (itemsOnDay.length >= 3) {
      return {
        hasConflict: false,
        isDense: true,
        conflictItem: itemsOnDay[0],
        countOnDay: itemsOnDay.length,
        message: `Notice: ${itemsOnDay.length} items already scheduled on this day.`,
      };
    }

    return {
      hasConflict: false,
      conflictItem: itemsOnDay[0],
      countOnDay: itemsOnDay.length,
      message: `${itemsOnDay.length} existing item(s) on this date.`,
    };
  }

  generateDailyBrief(targetDateKey) {
    const key =
      targetDateKey ||
      this.selectedDayFilter ||
      dateKey(this.date.getFullYear(), this.date.getMonth(), this.date.getDate());

    const items = this.reminders.filter(r => {
      if (r.isChangelog) return false;
      if (!r.dateKey) return false;
      return r.dateKey === key || r.dateKey.endsWith(`-${key.slice(5)}`);
    });

    const lumaItems = items.filter(r => r.isLuma || r.lumaUrl);
    const birthdays = items.filter(r => r.category === 'birthdays');
    const tasks = items.filter(r => r.category === 'reminders');
    const going = lumaItems.filter(r => r.lumaStatus === 'going');
    const waitlisted = lumaItems.filter(r => r.lumaStatus === 'waitlisted');
    const pending = lumaItems.filter(r => r.lumaStatus === 'pending');
    const done = lumaItems.filter(r => r.lumaStatus === 'done' || r.lumaStatus === 'attended');

    let density = 'Clear';
    if (items.length >= 3) density = 'High Density';
    else if (items.length > 0) density = 'Moderate';

    let summaryText;
    if (items.length === 0) {
      summaryText =
        'Schedule is completely open. Ideal for deep engineering focus or booking a 1:1 consultation.';
    } else {
      const parts = [];
      if (birthdays.length > 0) {
        parts.push(`Celebrate ${birthdays.map(b => b.text).join(', ')}`);
      }
      if (going.length > 0) {
        parts.push(
          `RSVP confirmed for ${going.length} event(s): ${going.map(e => e.text).join('; ')}`
        );
      }
      if (waitlisted.length > 0) {
        parts.push(
          `Waitlisted for ${waitlisted.length} event(s): ${waitlisted.map(e => e.text).join('; ')}`
        );
      }
      if (pending.length > 0) {
        parts.push(`Registration submitted for ${pending.length} event(s)`);
      }
      if (done.length > 0) {
        parts.push(`Attended ${done.length} past community event(s)`);
      }
      if (tasks.length > 0) {
        const completedTasks = tasks.filter(t => t.completed).length;
        parts.push(`${tasks.length} task(s) on schedule (${completedTasks} completed)`);
      }
      summaryText = parts.join('. ') + '.';
    }

    this.aiBriefData = {
      dateKey: key,
      density,
      totalCount: items.length,
      lumaCount: lumaItems.length,
      tasksCount: tasks.length,
      birthdaysCount: birthdays.length,
      summaryText,
      items,
    };

    this.render();
    return this.aiBriefData;
  }

  init() {
    if (!this.container) return;
    if (typeof window !== 'undefined') {
      window.calendarWidget = this;
    }
    ensureContactSolidStyles();
    if (this.selectedDate) {
      this.selectedDayFilter = dateKey(
        this.selectedDate.getFullYear(),
        this.selectedDate.getMonth(),
        this.selectedDate.getDate()
      );
    } else if (this.date) {
      this.selectedDate = new Date(
        this.date.getFullYear(),
        this.date.getMonth(),
        this.date.getDate()
      );
      this.selectedDayFilter = dateKey(
        this.selectedDate.getFullYear(),
        this.selectedDate.getMonth(),
        this.selectedDate.getDate()
      );
    }
    this.render();
    this.bindEvents();
    void this.fetchLiveAvailability();
  }

  async fetchLiveAvailability() {
    try {
      const apiBase = getFormsApiBase();
      const response = await fetch(`${apiBase}${CALENDAR_ENDPOINT}`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) return;
      const payload = await response.json();
      if (payload && (Array.isArray(payload.slots) || Array.isArray(payload.events))) {
        this.liveSlots = Array.isArray(payload.slots) ? payload.slots : [];
        this.liveEvents = Array.isArray(payload.events) ? payload.events : [];
        this.liveProviders =
          Array.isArray(payload.providers) && payload.providers.length
            ? payload.providers
            : ['google', 'apple'];
        this.aiAgentStatus = payload.aiAgent || null;
        this.availabilityLoaded = true;

        const isAppleConnected = this.liveProviders.includes('apple');
        const isGoogleConnected = this.liveProviders.includes('google');

        // Update Calendar Sync reminder card to show real live slots status
        const syncReminder = this.reminders.find(r => r.id === 100);
        if (syncReminder) {
          const activeDate = this.selectedDate || new Date();
          syncReminder.dateKey = dateKey(
            activeDate.getFullYear(),
            activeDate.getMonth(),
            activeDate.getDate()
          );
          const slotText =
            this.liveSlots.length > 0 ? `${this.liveSlots.length} Free Slots` : 'Live Booking Open';
          const defaultTag = this.liveSlots.length > 0 ? 'Live Sync' : 'Booking Open';

          if (isGoogleConnected && isAppleConnected) {
            syncReminder.text = 'Google & Apple Calendar Sync';
            syncReminder.time = slotText;
            syncReminder.tag = defaultTag;
          } else if (isAppleConnected) {
            syncReminder.text = 'Apple iCloud Calendar & CalDAV';
            syncReminder.time = slotText;
            syncReminder.tag = this.liveSlots.length > 0 ? 'Apple' : 'Booking Open';
          } else {
            syncReminder.text = 'Google Calendar & Meet Live';
            syncReminder.time = slotText;
            syncReminder.tag = this.liveSlots.length > 0 ? 'Live' : 'Booking Open';
          }
        }

        // Dynamically import real Apple & Google Calendar events into Smart Reminders
        if (this.liveEvents.length > 0) {
          for (const ev of this.liveEvents) {
            if (!ev.title) continue;
            const existing = this.reminders.find(
              r =>
                (r.eventTitle && r.eventTitle === ev.title) ||
                r.text === ev.title ||
                (r.dateKey && ev.date && r.dateKey === ev.date && r.text.includes(ev.title))
            );
            if (!existing) {
              const lowerTitle = ev.title.toLowerCase();
              const isBirthday = lowerTitle.includes('birthday') || lowerTitle.includes('bday');
              const isCursor = lowerTitle.includes('cursor');
              const isClaude = lowerTitle.includes('claude');
              const isTravel =
                lowerTitle.includes('flight') ||
                lowerTitle.includes('hertz') ||
                lowerTitle.includes('stay');

              let category = 'events';
              let tag = 'Event';
              let color = 'blue';
              let icon = 'calendar-day';

              if (isBirthday) {
                category = 'birthdays';
                tag = 'Birthday';
                color = 'pink';
                icon = 'cake-candles';
              } else if (isCursor) {
                category = 'events';
                tag = 'Cursor';
                color = 'blue';
                icon = 'terminal';
              } else if (isClaude) {
                category = 'events';
                tag = 'Claude';
                color = 'orange';
                icon = 'laptop-code';
              } else if (isTravel) {
                category = 'events';
                tag = 'Travel';
                color = 'cyan';
                icon = 'plane';
              } else if (ev.tag) {
                tag = ev.tag;
                color = ev.color || 'purple';
                category = ev.category === 'birthday' ? 'birthdays' : 'events';
                icon = ev.icon || 'calendar-day';
              }

              let timeLabel = 'Upcoming';
              let dKey = ev.date || '';
              if (ev.start) {
                const d = new Date(ev.start);
                const mStr = d.toLocaleString('en-US', { month: 'short' });
                const dayNum = d.getDate();
                if (!dKey) {
                  dKey = dateKey(d.getFullYear(), d.getMonth(), dayNum);
                }
                if (ev.start.includes('T00:00:00') && ev.end && ev.end.includes('T00:00:00')) {
                  timeLabel = `${mStr} ${dayNum} · All Day`;
                } else {
                  const timeStr = d.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  });
                  timeLabel = `${mStr} ${dayNum} · ${timeStr}`;
                }
              }

              this.reminders.push({
                id: Date.now() + Math.floor(Math.random() * 1000),
                eventTitle: ev.title,
                text: ev.title,
                time: timeLabel,
                dateKey: dKey,
                category,
                tag,
                color,
                icon,
                location: ev.location || '',
                completed: false,
                isImportedEvent: true,
              });
            }
          }
        }

        this.render();
      }
    } catch {
      // Offline fallback: retains existing smart reminders and default calendar dots
    }
  }

  getLiveEventDays(year, month) {
    const eventDays = new Set();

    // Check all reminders, birthdays, and changelog releases for this month
    for (const r of this.reminders) {
      if (r.dateKey && r.dateKey.length >= 10) {
        const parts = r.dateKey.split('-');
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        if (y === year && m === month) {
          eventDays.add(d);
        }
      }
    }

    if (this.liveSlots.length > 0 || this.liveEvents.length > 0) {
      for (const slot of this.liveSlots) {
        if (!slot.start) continue;
        const d = new Date(slot.start);
        if (d.getFullYear() === year && d.getMonth() === month) {
          eventDays.add(d.getDate());
        }
      }
      for (const ev of this.liveEvents) {
        if (!ev.start) continue;
        const d = new Date(ev.start);
        if (d.getFullYear() === year && d.getMonth() === month) {
          eventDays.add(d.getDate());
        }
      }
    }

    return eventDays;
  }

  getEventDotColor(year, month, day) {
    const dKey = dateKey(year, month, day);

    // 1. Birthdays (Pink)
    const birthdayMatch = this.reminders.find(
      r =>
        r.category === 'birthdays' &&
        !r.isChangelog &&
        r.dateKey &&
        (r.dateKey === dKey ||
          r.dateKey.endsWith(
            `-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          ))
    );
    if (birthdayMatch) return 'dot-pink';

    // 2. Live Events & Meetups
    const ev = this.liveEvents.find(
      e => (e.date && e.date === dKey) || (e.start && e.start.startsWith(dKey))
    );
    if (ev) {
      const lower = ev.title.toLowerCase();
      if (lower.includes('cursor')) return 'dot-blue';
      if (lower.includes('claude')) return 'dot-orange';
      if (lower.includes('birthday')) return 'dot-pink';
      if (lower.includes('flight') || lower.includes('stay') || lower.includes('travel'))
        return 'dot-cyan';
      return 'dot-purple';
    }

    // 3. Changelog Releases (Purple)
    const changelogMatch = this.reminders.find(
      r => (r.category === 'changelog' || r.isChangelog) && r.dateKey === dKey
    );
    if (changelogMatch) return 'dot-purple';

    // 4. Default Reminders / Slots (Blue)
    return 'dot-blue';
  }

  getFilteredReminders() {
    let list = this.reminders;

    // Apply text search query across title, host, location, tag, time, dateKey
    if (this.searchQuery && typeof this.searchQuery === 'string') {
      const q = this.searchQuery.trim().toLowerCase();
      if (q) {
        list = list.filter(r => {
          const textMatch = r.text && r.text.toLowerCase().includes(q);
          const hostMatch = r.lumaHost && r.lumaHost.toLowerCase().includes(q);
          const locMatch = r.location && r.location.toLowerCase().includes(q);
          const tagMatch = r.tag && r.tag.toLowerCase().includes(q);
          const timeMatch = r.time && r.time.toLowerCase().includes(q);
          const dateMatch = r.dateKey && r.dateKey.toLowerCase().includes(q);
          return textMatch || hostMatch || locMatch || tagMatch || timeMatch || dateMatch;
        });
      }
    }

    // Filter by specific day if activeFilter === 'day'
    if (this.activeFilter === 'day') {
      const targetDateKey =
        this.selectedDayFilter ||
        dateKey(this.date.getFullYear(), this.date.getMonth(), this.date.getDate());
      const mmDd = targetDateKey.slice(5); // e.g. "08-24"

      return list.filter(r => {
        if (r.isChangelog) return false;
        if (r.dateKey) {
          return (
            r.dateKey === targetDateKey || r.dateKey === mmDd || r.dateKey.endsWith(`-${mmDd}`)
          );
        }
        return false;
      });
    }

    // Filter by category tab
    if (this.activeFilter === 'luma') {
      return list.filter(r => (r.isLuma || r.lumaUrl) && !r.isChangelog);
    }
    if (this.activeFilter === 'events') {
      return list.filter(r => r.category === 'events');
    }
    if (this.activeFilter === 'reminders') {
      return list.filter(r => r.category === 'reminders');
    }
    if (this.activeFilter === 'birthdays') {
      return list.filter(r => r.category === 'birthdays');
    }
    if (this.activeFilter === 'changelog') {
      return list.filter(r => r.category === 'changelog' || r.isChangelog);
    }

    // "all" shows all tasks, events, and birthdays (excluding changelog entries)
    return list.filter(r => !r.isChangelog);
  }

  render() {
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    const year = this.date.getFullYear();
    const month = this.date.getMonth();
    const today = new Date().getDate();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const liveEventDays = this.getLiveEventDays(year, month);
    const filteredReminders = this.getFilteredReminders();

    const currentDayKey =
      this.selectedDayFilter ||
      dateKey(year, month, this.selectedDate ? this.selectedDate.getDate() : today);
    const dayMatchesCount = this.reminders.filter(r => {
      if (r.isChangelog) return false;
      if (r.dateKey) {
        return r.dateKey === currentDayKey || r.dateKey.endsWith(`-${currentDayKey.slice(5)}`);
      }
      return false;
    }).length;

    const totalEventsCount = this.reminders.filter(
      r => r.category === 'events' && !r.isChangelog
    ).length;
    const totalLumaCount = this.reminders.filter(
      r => (r.isLuma || r.lumaUrl) && !r.isChangelog
    ).length;
    const totalRemindersCount = this.reminders.filter(
      r => r.category === 'reminders' && !r.isChangelog
    ).length;
    const totalBirthdaysCount = this.reminders.filter(
      r => r.category === 'birthdays' && !r.isChangelog
    ).length;
    const totalChangelogCount = this.reminders.filter(
      r => r.category === 'changelog' || r.isChangelog
    ).length;
    const totalCount = this.reminders.filter(r => !r.isChangelog).length;

    // Year Progress Calculation (Apple HIG Progress HUD)
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const now = new Date();
    const diffMs = now - startOfYear;
    const dayOfYear = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
    const isLeapYear =
      (currentYear % 4 === 0 && currentYear % 100 !== 0) || currentYear % 400 === 0;
    const totalYearDays = isLeapYear ? 366 : 365;
    const daysLeft = Math.max(0, totalYearDays - dayOfYear);
    const percentPassed = Math.min(100, Math.max(0, Math.round((dayOfYear / totalYearDays) * 100)));

    let html = `
      <div class="ios-widget-wrapper">
        <!-- ═══════════════════════════════════════════════════════
             YEAR PROGRESS HUD WIDGET (Apple HIG Standard)
             ═══════════════════════════════════════════════════════ -->
        <div class="year-progress-widget" aria-label="Year ${currentYear} Progress: ${percentPassed}% passed, ${daysLeft} days left">
          <div class="year-progress-header">
            <span class="year-progress-year">${currentYear}</span>
            <span class="year-progress-percent">${percentPassed}%</span>
          </div>
          <div class="year-progress-track" role="progressbar" aria-valuenow="${percentPassed}" aria-valuemin="0" aria-valuemax="100">
            <div class="year-progress-fill" style="width: ${percentPassed}%;"></div>
          </div>
          <div class="year-progress-footer">
            <span class="year-progress-sub-left">${percentPassed}% of the year has passed</span>
            <span class="year-progress-sub-right">${daysLeft} days left</span>
          </div>
        </div>

        <!-- Calendar Section -->
        <div class="ios-calendar-section">
          <div class="ios-header">
            <div class="month-title">
              <span class="current-month">${monthNames[month]}</span>
              <span class="current-year">${year}</span>
            </div>
            <div class="ios-actions">
              <button type="button" class="ios-btn icon-only" title="Previous Month" aria-label="Previous month"><i class="fas fa-chevron-left" aria-hidden="true"></i></button>
              <button type="button" class="ios-btn today-btn" title="Go to Today" aria-label="Go to today"><i class="fas fa-calendar-day" aria-hidden="true"></i></button>
              <button type="button" class="ios-btn icon-only" title="Next Month" aria-label="Next month"><i class="fas fa-chevron-right" aria-hidden="true"></i></button>
            </div>
          </div>
          
          <div class="ios-weekdays">
            ${days.map(d => `<span>${d}</span>`).join('')}
          </div>
          
          <div class="ios-grid">
    `;

    // Empty slots
    for (let i = 0; i < firstDay; i++) {
      html += `<span class="day-cell empty"></span>`;
    }

    // Days
    for (let i = 1; i <= daysInMonth; i++) {
      const isToday =
        i === today && month === new Date().getMonth() && year === new Date().getFullYear();
      const hasEvent = liveEventDays.has(i);

      let classes = 'day-cell';
      if (isToday) classes += ' today';
      if (hasEvent) classes += ' has-event';

      const thisKey = dateKey(year, month, i);
      const isSelected =
        this.selectedDate &&
        this.selectedDate.getFullYear() === year &&
        this.selectedDate.getMonth() === month &&
        this.selectedDate.getDate() === i;

      if (isSelected) classes += ' selected';
      const dotColorClass = this.getEventDotColor(year, month, i);

      html += `
        <span class="${classes}" data-day="${i}" data-date-key="${thisKey}">
          ${i}
          ${hasEvent ? `<div class="event-dot ${dotColorClass}" title="Calendar Event / Available Slot"></div>` : ''}
        </span>`;
    }

    html += `
          </div>
        </div>

        <!-- Reminders Section -->
        <div class="ios-reminders-section">
          <div class="reminders-header">
            <div class="reminders-title">
              <i class="fas fa-list-check" aria-hidden="true"></i>
              <span>Smart Reminders & Events</span>
            </div>
            <div class="reminders-header-actions">
              <button type="button" class="ios-btn-smart smart-reminder-trigger-btn" title="Add Smart AI Reminder with Natural Language" aria-label="Smart AI Reminder"><i class="fas fa-wand-magic-sparkles" aria-hidden="true"></i> Smart Add</button>
              <a href="${LUMA_CALENDARS_URL}" target="_blank" rel="noopener noreferrer" class="ios-btn-small luma-header-btn" title="View & Follow Events on Luma Calendar (mbr63@drexel.edu)" aria-label="View on Luma Calendar"><i class="fas fa-calendar-star" aria-hidden="true"></i> Luma</a>
              <button type="button" class="ios-btn-small" title="Add Reminder" aria-label="Add new reminder"><i class="fas fa-plus" aria-hidden="true"></i> New</button>
            </div>
          </div>

          <!-- Calendar Search Bar -->
          <div class="calendar-search-wrap">
            <div class="calendar-search-box">
              <i class="fas fa-search search-icon" aria-hidden="true"></i>
              <input type="search" class="reminders-search-input" placeholder="Search events, meetups, reminders, tags..." value="${escapeHtml(this.searchQuery)}" aria-label="Search calendar and reminders">
              ${this.searchQuery ? `<button type="button" class="calendar-search-clear" aria-label="Clear search"><i class="fas fa-times" aria-hidden="true"></i></button>` : ''}
            </div>
          </div>

          <!-- Category Filter Tabs -->
          <div class="calendar-filter-tabs" role="tablist" aria-label="Filter events by category">
            <button type="button" class="filter-tab ${this.activeFilter === 'day' ? 'active' : ''}" data-filter="day">
              <i class="fas fa-calendar-day" aria-hidden="true"></i> Day (${dayMatchesCount})
            </button>
            <button type="button" class="filter-tab ${this.activeFilter === 'all' ? 'active' : ''}" data-filter="all">
              <i class="fas fa-layer-group" aria-hidden="true"></i> All (${totalCount})
            </button>
            <button type="button" class="filter-tab ${this.activeFilter === 'events' ? 'active' : ''}" data-filter="events">
              <i class="fas fa-calendar-check" aria-hidden="true"></i> Events (${totalEventsCount})
            </button>
            <button type="button" class="filter-tab ${this.activeFilter === 'luma' ? 'active' : ''}" data-filter="luma">
              <i class="fas fa-ticket" aria-hidden="true"></i> Luma (${totalLumaCount})
            </button>
            <button type="button" class="filter-tab ${this.activeFilter === 'birthdays' ? 'active' : ''}" data-filter="birthdays">
              <i class="fas fa-cake-candles" aria-hidden="true"></i> Birthdays (${totalBirthdaysCount})
            </button>
            <button type="button" class="filter-tab ${this.activeFilter === 'changelog' ? 'active' : ''}" data-filter="changelog">
              <i class="fas fa-rocket" aria-hidden="true"></i> Changelog (${totalChangelogCount})
            </button>
            <button type="button" class="filter-tab ${this.activeFilter === 'reminders' ? 'active' : ''}" data-filter="reminders">
              <i class="fas fa-list-check" aria-hidden="true"></i> Tasks (${totalRemindersCount})
            </button>
          </div>

          ${
            this.activeFilter === 'day' && this.selectedDate
              ? `
            <div class="day-inspector-banner">
              <div class="day-inspector-info">
                <i class="fas fa-filter" aria-hidden="true"></i>
                <span>Showing items for <strong>${monthNames[this.selectedDate.getMonth()]} ${this.selectedDate.getDate()}, ${this.selectedDate.getFullYear()}</strong></span>
              </div>
              <div class="day-inspector-actions">
                <button type="button" class="day-inspector-ai-brief" title="Generate AI Daily Briefing" aria-label="AI Daily Briefing">
                  <i class="fas fa-wand-magic-sparkles" aria-hidden="true"></i> AI Brief
                </button>
                <button type="button" class="day-inspector-clear" title="Show All Items">
                  <i class="fas fa-times" aria-hidden="true"></i> View All
                </button>
              </div>
            </div>
          `
              : ''
          }

          ${
            this.aiBriefData && this.aiBriefData.dateKey === currentDayKey
              ? `
            <div class="ai-daily-brief-hud" role="region" aria-label="AI Daily Briefing">
              <div class="ai-brief-header">
                <div class="ai-brief-title">
                  <i class="fas fa-wand-magic-sparkles" aria-hidden="true"></i>
                  <span>AI Daily Brief · ${escapeHtml(this.aiBriefData.density)}</span>
                </div>
                <div class="ai-brief-actions">
                  <button type="button" class="ai-brief-discuss-btn" title="Discuss in AssistMe" aria-label="Discuss in AssistMe">
                    <i class="fas fa-comments" aria-hidden="true"></i> Discuss in AssistMe
                  </button>
                  <button type="button" class="ai-brief-dismiss-btn" title="Dismiss Brief" aria-label="Dismiss Brief">
                    <i class="fas fa-times" aria-hidden="true"></i>
                  </button>
                </div>
              </div>
              <div class="ai-brief-body">
                <p class="ai-brief-summary">${escapeHtml(this.aiBriefData.summaryText)}</p>
                <div class="ai-brief-stats">
                  <span class="brief-stat-chip"><i class="fas fa-calendar-day" aria-hidden="true"></i> ${this.aiBriefData.totalCount} item(s)</span>
                  ${this.aiBriefData.lumaCount > 0 ? `<span class="brief-stat-chip tag-luma"><i class="fas fa-ticket" aria-hidden="true"></i> ${this.aiBriefData.lumaCount} Luma</span>` : ''}
                  ${this.aiBriefData.tasksCount > 0 ? `<span class="brief-stat-chip tag-blue"><i class="fas fa-list-check" aria-hidden="true"></i> ${this.aiBriefData.tasksCount} task(s)</span>` : ''}
                  ${this.aiBriefData.birthdaysCount > 0 ? `<span class="brief-stat-chip tag-pink"><i class="fas fa-cake-candles" aria-hidden="true"></i> ${this.aiBriefData.birthdaysCount} Birthday</span>` : ''}
                </div>
              </div>
            </div>
          `
              : ''
          }
          
          <div class="reminders-list" id="reminders-list-container">
            ${
              filteredReminders.length === 0
                ? `
              <div class="day-empty-state">
                <div class="empty-state-icon">
                  <i class="fas fa-calendar-plus" aria-hidden="true"></i>
                </div>
                <div class="empty-state-title">No Reminders or Events</div>
                <div class="empty-state-subtitle">${
                  this.selectedDate
                    ? `${monthNames[this.selectedDate.getMonth()]} ${this.selectedDate.getDate()}`
                    : 'This day'
                } is completely open. Add a reminder or book a consultation.</div>
                <div class="empty-state-actions">
                  <button type="button" class="empty-action-btn smart-add-btn">
                    <i class="fas fa-wand-magic-sparkles" aria-hidden="true"></i> Smart AI Add
                  </button>
                  <button type="button" class="empty-action-btn add-reminder-btn">
                    <i class="fas fa-plus" aria-hidden="true"></i> Add Reminder
                  </button>
                  <button type="button" class="empty-action-btn book-consult-btn">
                    <i class="fas fa-calendar-check" aria-hidden="true"></i> Book Consultation
                  </button>
                  <button type="button" class="empty-action-btn show-all-btn">
                    <i class="fas fa-layer-group" aria-hidden="true"></i> View All Items
                  </button>
                </div>
              </div>
            `
                : filteredReminders
                    .map(
                      r => `
              <div class="reminder-card ${r.completed ? 'completed' : ''} accent-${escapeHtml(r.color || 'blue')}" data-id="${r.id}">
                <div class="card-accent-strip"></div>
                <div class="card-content">
                  <div class="card-header-flex">
                    <span class="card-time"><i class="fas fa-${escapeHtml(r.icon || 'clock')}" aria-hidden="true"></i> ${escapeHtml(r.time)}</span>
                    <div class="card-tags-group">
                      ${r.tag ? `<span class="card-tag tag-${escapeHtml(r.color || 'blue')}">${escapeHtml(r.tag)}</span>` : ''}
                      ${r.isLuma || r.lumaUrl ? `<span class="card-tag tag-luma"><i class="fas fa-ticket" aria-hidden="true"></i> Luma</span>` : ''}
                      ${
                        r.lumaStatus
                          ? `
                        <span class="card-tag tag-luma-status tag-luma-status--${escapeHtml(r.lumaStatus)}">
                          ${r.lumaStatus === 'going' ? '<i class="fas fa-circle-check" aria-hidden="true"></i> Going' : ''}
                          ${r.lumaStatus === 'waitlisted' ? '<i class="fas fa-clock" aria-hidden="true"></i> Waitlisted' : ''}
                          ${r.lumaStatus === 'pending' ? '<i class="fas fa-hourglass-half" aria-hidden="true"></i> Submitted' : ''}
                          ${r.lumaStatus === 'done' || r.lumaStatus === 'attended' ? '<i class="fas fa-check-double" aria-hidden="true"></i> Attended' : ''}
                        </span>
                      `
                          : ''
                      }
                    </div>
                  </div>
                  <div class="card-title">${escapeHtml(r.text)}</div>
                  ${r.lumaHost ? `<div class="card-host"><i class="fas fa-user-circle" aria-hidden="true"></i> By ${escapeHtml(r.lumaHost)}</div>` : ''}
                  ${r.location ? `<div class="card-location"><i class="fas fa-map-pin"></i> ${escapeHtml(r.location)}</div>` : ''}
                </div>
                <div class="card-action-area">
                  ${
                    r.isLuma || r.lumaUrl
                      ? `
                    <a href="${escapeHtml(r.lumaUrl || LUMA_CALENDARS_URL)}" target="_blank" rel="noopener noreferrer" class="card-action-btn luma-btn" title="View Ticket & RSVP on Luma" aria-label="View Ticket on Luma">
                      <i class="fas fa-ticket" aria-hidden="true"></i>
                    </a>
                  `
                      : ''
                  }
                  <button type="button" class="card-action-btn ask-ai-btn" data-id="${r.id}" title="Ask AI Assistant about this item" aria-label="Ask AI about ${escapeHtml(r.text)}">
                    <i class="fas fa-wand-magic-sparkles" aria-hidden="true"></i>
                  </button>
                  ${
                    r.isImportedEvent || r.category === 'birthdays'
                      ? `
                    <button type="button" class="card-action-btn ical-btn" data-id="${r.id}" title="Download .ics Calendar Event" aria-label="Download iCal event">
                      <i class="fas fa-download" aria-hidden="true"></i>
                    </button>
                  `
                      : ''
                  }
                  ${
                    !r.isChangelog && !r.isImportedEvent && r.id !== 100
                      ? `
                    <button type="button" class="card-action-btn edit-btn" data-id="${r.id}" title="Edit text" aria-label="Edit reminder">
                      <i class="fas fa-pen" aria-hidden="true"></i>
                    </button>
                    <button type="button" class="status-circle ${r.completed ? 'checked' : ''}" data-id="${r.id}" title="Toggle Complete" aria-label="Toggle Complete">
                      <i class="fas fa-check" aria-hidden="true"></i>
                    </button>
                  `
                      : ''
                  }
                  ${
                    r.id === 100
                      ? `
                    <button type="button" class="card-action-btn sync-book-btn" title="Book Consultation" aria-label="Book Consultation">
                      <i class="fas fa-arrow-right" aria-hidden="true"></i>
                    </button>
                  `
                      : ''
                  }
                </div>
              </div>
            `
                    )
                    .join('')
            }
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.bindEvents();
  }

  bindEvents() {
    // Month Navigation
    const prevBtn = this.container.querySelector('.ios-actions button:first-child');
    const todayBtn = this.container.querySelector('.today-btn');
    const nextBtn = this.container.querySelector('.ios-actions button:last-child');

    if (prevBtn) prevBtn.onclick = () => this.changeMonth(-1);
    if (todayBtn) todayBtn.onclick = () => this.goToToday();
    if (nextBtn) nextBtn.onclick = () => this.changeMonth(1);

    // Search input
    const searchInput = this.container.querySelector('.reminders-search-input');
    if (searchInput) {
      searchInput.oninput = e => {
        this.searchQuery = e.target.value;
        this.render();
        const nextInput = this.container.querySelector('.reminders-search-input');
        if (nextInput) {
          nextInput.focus();
          const len = nextInput.value.length;
          nextInput.setSelectionRange(len, len);
        }
      };
    }
    const searchClear = this.container.querySelector('.calendar-search-clear');
    if (searchClear) {
      searchClear.onclick = () => {
        this.searchQuery = '';
        this.render();
      };
    }

    // AI Daily Brief Button
    const aiBriefBtn = this.container.querySelector('.day-inspector-ai-brief');
    if (aiBriefBtn) {
      aiBriefBtn.onclick = () => {
        const curKey =
          this.selectedDayFilter ||
          dateKey(
            this.date.getFullYear(),
            this.date.getMonth(),
            this.selectedDate ? this.selectedDate.getDate() : new Date().getDate()
          );
        this.generateDailyBrief(curKey);
      };
    }

    // Dismiss AI Brief
    const dismissBriefBtn = this.container.querySelector('.ai-brief-dismiss-btn');
    if (dismissBriefBtn) {
      dismissBriefBtn.onclick = () => {
        this.aiBriefData = null;
        this.render();
      };
    }

    // Discuss AI Brief in AssistMe
    const discussBriefBtn = this.container.querySelector('.ai-brief-discuss-btn');
    if (discussBriefBtn) {
      discussBriefBtn.onclick = () => {
        const chatbotToggle = document.getElementById('chatbot-toggle');
        if (chatbotToggle) {
          chatbotToggle.click();
          setTimeout(() => {
            const input = document.getElementById('chatbot-input');
            if (input) {
              input.value = `Discuss my schedule for ${this.selectedDayFilter || 'today'}: ${this.aiBriefData?.summaryText || ''}`;
              input.focus();
            }
          }, 300);
        }
      };
    }

    // Smart Reminder Modal Trigger (Header)
    const smartAddBtn = this.container.querySelector('.smart-reminder-trigger-btn');
    if (smartAddBtn) {
      smartAddBtn.onclick = () => this.openSmartReminderModal();
    }

    // Empty State Smart Add
    const emptySmartAddBtn = this.container.querySelector('.empty-action-btn.smart-add-btn');
    if (emptySmartAddBtn) {
      emptySmartAddBtn.onclick = () => this.openSmartReminderModal();
    }

    // Filter Tabs
    this.container.querySelectorAll('.filter-tab').forEach(tab => {
      tab.onclick = () => {
        this.activeFilter = tab.dataset.filter || 'all';
        this.render();
      };
    });

    // Clear Day Inspector / View All
    const clearDayBtn = this.container.querySelector('.day-inspector-clear');
    if (clearDayBtn) {
      clearDayBtn.onclick = () => {
        this.activeFilter = 'all';
        this.render();
      };
    }
    const showAllBtn = this.container.querySelector('.show-all-btn');
    if (showAllBtn) {
      showAllBtn.onclick = () => {
        this.activeFilter = 'all';
        this.render();
      };
    }

    // Empty State: Add Reminder
    const emptyAddBtn = this.container.querySelector('.empty-action-btn.add-reminder-btn');
    if (emptyAddBtn) {
      emptyAddBtn.onclick = () => this.addNewReminder();
    }

    // Empty State: Book Consultation
    const emptyBookBtn = this.container.querySelector('.empty-action-btn.book-consult-btn');
    if (emptyBookBtn) {
      emptyBookBtn.onclick = () => openCalendlyPopup();
    }

    // Header Add New Reminder
    const newBtn = this.container.querySelector('.ios-btn-small');
    if (newBtn) {
      newBtn.onclick = () => this.addNewReminder();
    }

    // Calendly Panel Button
    const calendlyBtn = this.container.querySelector('.calendly-panel-button');
    if (calendlyBtn) {
      calendlyBtn.onclick = () => openCalendlyPopup();
    }

    // Day Selection & Day Filter Click
    this.container.querySelectorAll('.day-cell:not(.empty)').forEach(day => {
      day.onclick = () => {
        const dayNum = parseInt(day.dataset.day, 10);
        this.selectedDate = new Date(this.date.getFullYear(), this.date.getMonth(), dayNum);
        this.selectedDayFilter =
          day.dataset.dateKey || dateKey(this.date.getFullYear(), this.date.getMonth(), dayNum);
        this.activeFilter = 'day';
        this.render();
      };
    });

    // Card Action Buttons & Status Toggle
    this.container.querySelectorAll('.reminder-card').forEach(item => {
      const id = parseInt(item.dataset.id, 10);
      const reminder = this.reminders.find(r => r.id === id);
      if (!reminder) return;

      // Click card to toggle
      item.onclick = e => {
        if (e.target.closest('.card-action-btn') || e.target.closest('.status-circle')) return;
        reminder.completed = !reminder.completed;
        this.persistReminders();
        this.render();
      };

      // Toggle Circle
      const statusCircle = item.querySelector('.status-circle');
      if (statusCircle) {
        statusCircle.onclick = e => {
          e.stopPropagation();
          reminder.completed = !reminder.completed;
          this.persistReminders();
          this.render();
        };
      }

      // Edit Button
      const editBtn = item.querySelector('.edit-btn');
      if (editBtn) {
        editBtn.onclick = e => {
          e.stopPropagation();
          const newText = prompt('Update Reminder:', reminder.text);
          if (newText !== null && newText.trim() !== '') {
            reminder.text = newText.trim();
            this.persistReminders();
            this.render();
          }
        };
      }

      // Ask AI Button
      const askAiBtn = item.querySelector('.ask-ai-btn');
      if (askAiBtn) {
        askAiBtn.onclick = e => {
          e.stopPropagation();
          this.askAiAboutEvent(reminder);
        };
      }

      // iCal Download Button
      const icalBtn = item.querySelector('.ical-btn');
      if (icalBtn) {
        icalBtn.onclick = e => {
          e.stopPropagation();
          this.downloadIcsForEvent(reminder);
        };
      }

      // Sync Card Book Button
      const syncBookBtn = item.querySelector('.sync-book-btn');
      if (syncBookBtn) {
        syncBookBtn.onclick = e => {
          e.stopPropagation();
          openCalendlyPopup();
        };
      }
    });
  }

  addNewReminder(titleOverride) {
    const selDay = this.selectedDate ? this.selectedDate.getDate() : new Date().getDate();
    const selMonth = this.selectedDate ? this.selectedDate.getMonth() : new Date().getMonth();
    const selYear = this.selectedDate ? this.selectedDate.getFullYear() : new Date().getFullYear();
    const dKey = dateKey(selYear, selMonth, selDay);
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    let reminderData;
    if (typeof titleOverride === 'string' && titleOverride.trim()) {
      reminderData = parseNaturalLanguageReminder(
        titleOverride,
        this.selectedDate || new Date(selYear, selMonth, selDay)
      );
    } else {
      let title = null;
      if (typeof window !== 'undefined' && typeof window.prompt === 'function') {
        try {
          const inputTitle = window.prompt(
            `Add New Reminder / Event for ${monthNames[selMonth]} ${selDay}, ${selYear}:`,
            'New Reminder'
          );
          if (inputTitle === null) return null;
          if (typeof inputTitle === 'string') {
            title = inputTitle.trim() || 'New Reminder';
          }
        } catch {
          title = 'New Reminder';
        }
      }
      if (!title) {
        title = 'New Reminder';
      }
      reminderData = {
        title,
        dateKey: dKey,
        time: `${monthNames[selMonth]} ${selDay} · Scheduled`,
        timeOnly: 'Scheduled',
        category: 'reminders',
        color: ['blue', 'red', 'orange', 'green', 'purple'][Math.floor(Math.random() * 5)],
        tag: 'Custom',
        icon: 'bell',
      };
    }

    const newReminder = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      text: reminderData.title,
      time: reminderData.time,
      dateKey: reminderData.dateKey,
      category: reminderData.category || 'reminders',
      color: reminderData.color || 'blue',
      tag: reminderData.tag || 'Custom',
      icon: reminderData.icon || 'bell',
      completed: false,
      isCustomUserReminder: true,
    };

    this.reminders.unshift(newReminder);
    this.persistReminders();
    this.activeFilter = 'day';
    this.selectedDayFilter = newReminder.dateKey;
    if (newReminder.dateKey && newReminder.dateKey.length >= 10) {
      const parts = newReminder.dateKey.split('-');
      this.selectedDate = new Date(
        parseInt(parts[0], 10),
        parseInt(parts[1], 10) - 1,
        parseInt(parts[2], 10)
      );
    }
    this.render();
    return newReminder;
  }

  openSmartReminderModal(initialText = '') {
    if (typeof document === 'undefined') return;

    // Remove any existing modal
    const existing = document.querySelector('.smart-reminder-modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'smart-reminder-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Smart AI Reminder Creation');

    const selDay = this.selectedDate ? this.selectedDate.getDate() : new Date().getDate();
    const selMonth = this.selectedDate ? this.selectedDate.getMonth() : new Date().getMonth();
    const selYear = this.selectedDate ? this.selectedDate.getFullYear() : new Date().getFullYear();
    const baseDate = this.selectedDate || new Date(selYear, selMonth, selDay);

    overlay.innerHTML = `
      <div class="smart-reminder-modal-card">
        <div class="smart-modal-header">
          <div class="smart-modal-title">
            <i class="fas fa-wand-magic-sparkles" aria-hidden="true"></i>
            <span>Smart AI Reminder</span>
          </div>
          <button type="button" class="smart-modal-close" aria-label="Close modal">
            <i class="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>

        <p class="smart-modal-description">
          Type naturally. Antigravity AI extracts relative dates, times, categories, and tags automatically.
        </p>

        <div class="smart-modal-input-wrap">
          <textarea
            class="smart-modal-textarea"
            placeholder="e.g. Sync with team tomorrow at 3pm #sync, or DevFest workshop on Friday 10am #meetup"
            rows="3"
            aria-label="Reminder details in natural language"
          >${escapeHtml(initialText)}</textarea>
        </div>

        <!-- Quick Tag Presets -->
        <div class="smart-modal-presets" aria-label="Quick preset chips">
          <button type="button" class="preset-chip" data-preset="Sync with engineering team tomorrow at 3pm #sync">
            <i class="fas fa-handshake" aria-hidden="true"></i> Team Sync
          </button>
          <button type="button" class="preset-chip" data-preset="AI Agent sprint review on Friday at 11am #ai">
            <i class="fas fa-brain" aria-hidden="true"></i> AI Sprint
          </button>
          <button type="button" class="preset-chip" data-preset="Critical architecture deadline next Monday 2pm #urgent">
            <i class="fas fa-bolt" aria-hidden="true"></i> Urgent Deadline
          </button>
          <button type="button" class="preset-chip" data-preset="DevFest workshop on Saturday 9:30am #meetup">
            <i class="fas fa-ticket" aria-hidden="true"></i> Workshop
          </button>
        </div>

        <!-- Live Parsed Preview & Conflict Detection -->
        <div class="smart-modal-preview-box">
          <div class="smart-preview-label">
            <i class="fas fa-eye" aria-hidden="true"></i> Live AI Parsing
          </div>
          <div class="smart-preview-content">
            <div class="smart-preview-title" id="smart-preview-title">New Reminder</div>
            <div class="smart-preview-meta">
              <span class="preview-badge badge-time" id="smart-preview-time">Scheduled</span>
              <span class="preview-badge badge-tag" id="smart-preview-tag">Task</span>
              <span class="preview-badge badge-cat" id="smart-preview-category">reminders</span>
            </div>
          </div>
          <div class="smart-conflict-alert" id="smart-conflict-alert" style="display: none;"></div>
        </div>

        <div class="smart-modal-actions">
          <button type="button" class="smart-modal-btn btn-cancel">Cancel</button>
          <button type="button" class="smart-modal-btn btn-save">
            <i class="fas fa-plus" aria-hidden="true"></i> Add to Calendar
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const textarea = overlay.querySelector('.smart-modal-textarea');
    const previewTitle = overlay.querySelector('#smart-preview-title');
    const previewTime = overlay.querySelector('#smart-preview-time');
    const previewTag = overlay.querySelector('#smart-preview-tag');
    const previewCat = overlay.querySelector('#smart-preview-category');
    const conflictAlert = overlay.querySelector('#smart-conflict-alert');
    const closeBtn = overlay.querySelector('.smart-modal-close');
    const cancelBtn = overlay.querySelector('.btn-cancel');
    const saveBtn = overlay.querySelector('.btn-save');

    const updatePreview = () => {
      const text = textarea ? textarea.value.trim() : '';
      const parsed = parseNaturalLanguageReminder(text || 'New Reminder', baseDate);
      if (previewTitle) previewTitle.textContent = parsed.title;
      if (previewTime) previewTime.textContent = parsed.time;
      if (previewTag) {
        previewTag.textContent = parsed.tag;
        previewTag.className = `preview-badge badge-tag tag-${parsed.color || 'blue'}`;
      }
      if (previewCat) previewCat.textContent = parsed.category;

      // Conflict Check
      const conflict = this.checkScheduleConflict(parsed.dateKey, parsed.timeOnly);
      if (conflictAlert) {
        if (conflict.hasConflict) {
          conflictAlert.style.display = 'flex';
          conflictAlert.className = 'smart-conflict-alert conflict-warning';
          conflictAlert.innerHTML = `<i class="fas fa-triangle-exclamation" aria-hidden="true"></i> <span>${escapeHtml(conflict.message)}</span>`;
        } else if (conflict.isDense) {
          conflictAlert.style.display = 'flex';
          conflictAlert.className = 'smart-conflict-alert conflict-notice';
          conflictAlert.innerHTML = `<i class="fas fa-info-circle" aria-hidden="true"></i> <span>${escapeHtml(conflict.message)}</span>`;
        } else {
          conflictAlert.style.display = 'none';
        }
      }
    };

    if (textarea) {
      textarea.addEventListener('input', updatePreview);
    }
    updatePreview();

    // Preset chip clicks
    overlay.querySelectorAll('.preset-chip').forEach(btn => {
      btn.onclick = () => {
        if (textarea) {
          textarea.value = btn.dataset.preset || '';
          updatePreview();
          textarea.focus();
        }
      };
    });

    const closeModal = () => {
      overlay.classList.add('closing');
      setTimeout(() => overlay.remove(), 200);
    };

    const handleSave = () => {
      const val = textarea ? textarea.value.trim() : '';
      this.addNewReminder(val || 'New Reminder');
      closeModal();
    };

    if (closeBtn) closeBtn.onclick = closeModal;
    if (cancelBtn) cancelBtn.onclick = closeModal;
    if (saveBtn) saveBtn.onclick = handleSave;

    overlay.onclick = e => {
      if (e.target === overlay) closeModal();
    };

    // Keyboard support
    const handleKeydown = e => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
        window.removeEventListener('keydown', handleKeydown);
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSave();
        window.removeEventListener('keydown', handleKeydown);
      }
    };
    window.addEventListener('keydown', handleKeydown);

    if (textarea) {
      setTimeout(() => textarea.focus(), 50);
    }
  }

  addConfirmedBooking({ title, time, tag = 'Confirmed' } = {}) {
    const targetDate = this.selectedDate || this.date || new Date();
    const bookingDateKey =
      this.selectedDayFilter ||
      dateKey(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const bookingReminder = {
      id: Date.now(),
      text: title || 'Confirmed Consultation (Google Meet)',
      time: time || 'Confirmed',
      dateKey: bookingDateKey,
      category: 'events',
      color: 'green',
      tag,
      icon: 'calendar-check',
      completed: false,
    };
    this.reminders.unshift(bookingReminder);
    this.render();
  }

  changeMonth(offset) {
    this.date.setMonth(this.date.getMonth() + offset);
    this.render();
  }

  goToToday() {
    const today = new Date();
    this.date = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    this.selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    this.selectedDayFilter = dateKey(today.getFullYear(), today.getMonth(), today.getDate());
    this.activeFilter = 'day';
    this.render();
  }

  askAiAboutEvent(reminder) {
    const chatbotToggle = document.getElementById('chatbot-toggle');
    if (chatbotToggle) {
      chatbotToggle.click();
      setTimeout(() => {
        const input = document.getElementById('chatbot-input');
        if (input) {
          input.value = `Tell me more about "${reminder.text}" on ${reminder.time} from your calendar.`;
          input.focus();
        }
      }, 300);
    }
  }

  downloadIcsForEvent(reminder) {
    const summary = reminder.text || 'Portfolio Event';
    const now = new Date();
    const dtstamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    let dtstart = dtstamp;
    let dtend = dtstamp;

    if (reminder.dateKey && reminder.dateKey.length >= 10) {
      const cleanKey = reminder.dateKey.replace(/-/g, '');
      dtstart = `${cleanKey}T100000Z`;
      dtend = `${cleanKey}T110000Z`;
    }

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Mangesh Raut//Portfolio Calendar Widget//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:event-${reminder.id || Date.now()}@mangeshraut.pro`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${summary.replace(/,/g, '\\,')}`,
      `DESCRIPTION:${(reminder.description || reminder.time || 'Event from Mangesh Raut Calendar').replace(/,/g, '\\,')}`,
      `LOCATION:${(reminder.location || 'Online / Remote').replace(/,/g, '\\,')}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${summary.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export { CalendarWidget as CalendarBookingWidget };

// Auto-init
export const initCalendarWidget = () => {
  ensureContactSolidStyles();
  const container = document.getElementById('calendar-widget');
  if (!container) return null;
  const widget = new CalendarWidget('calendar-widget');
  widget.init();
  return widget;
};

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCalendarWidget);
  } else {
    initCalendarWidget();
  }
}
