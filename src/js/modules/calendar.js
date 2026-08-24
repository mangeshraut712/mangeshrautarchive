import { openCalendlyPopup } from '../utils/calendly.js';
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

function dateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export class CalendarWidget {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.date = new Date(2026, 7, 24); // Default to August 24, 2026
    this.selectedDate = new Date(2026, 7, 24);
    this.selectedDayCell = null;
    this.selectedDayFilter = dateKey(2026, 7, 24);
    this.activeFilter = 'day';
    this.liveSlots = [];
    this.liveEvents = [];
    this.liveProviders = ['google', 'apple'];
    this.aiAgentStatus = null;
    this.availabilityLoaded = false;

    // "Smart" Reminders, Verified Birthdays & Live Calendar Data
    this.reminders = [
      // ── Verified Birthdays ──────────────────────────────────────
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
      // ── Core Reminders & Sync Status ─────────────────────────────
      {
        id: 100,
        text: 'Google & Apple Calendar Sync',
        time: 'Live Auto-Sync',
        dateKey: '2026-08-24',
        category: 'reminders',
        tag: 'Live Sync',
        color: 'blue',
        icon: 'calendar-check',
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
  }

  init() {
    if (!this.container) return;
    ensureContactSolidStyles();
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
          if (isGoogleConnected && isAppleConnected) {
            syncReminder.text = 'Google & Apple Calendar Sync';
            syncReminder.time = `${this.liveSlots.length} Free Slots`;
            syncReminder.tag = 'Live Sync';
          } else if (isAppleConnected) {
            syncReminder.text = 'Apple iCloud Calendar & CalDAV';
            syncReminder.time = `${this.liveSlots.length} Free Slots`;
            syncReminder.tag = 'Apple';
          } else {
            syncReminder.text = 'Google Calendar & Meet Live';
            syncReminder.time = `${this.liveSlots.length} Free Slots`;
            syncReminder.tag = 'Live';
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
        (r.category === 'birthdays' || r.text.toLowerCase().includes('birthday')) &&
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
    const list = this.reminders;

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
    if (this.activeFilter === 'events') {
      return list.filter(r => r.category === 'events' || r.isImportedEvent);
    }
    if (this.activeFilter === 'reminders') {
      return list.filter(r => r.category === 'reminders' && !r.isImportedEvent && !r.isChangelog);
    }
    if (this.activeFilter === 'birthdays') {
      return list.filter(
        r => r.category === 'birthdays' || r.text.toLowerCase().includes('birthday')
      );
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
      r => r.category === 'events' || r.isImportedEvent
    ).length;
    const totalRemindersCount = this.reminders.filter(
      r => r.category === 'reminders' && !r.isImportedEvent && !r.isChangelog
    ).length;
    const totalBirthdaysCount = this.reminders.filter(
      r => r.category === 'birthdays' || r.text.toLowerCase().includes('birthday')
    ).length;
    const totalChangelogCount = this.reminders.filter(
      r => r.category === 'changelog' || r.isChangelog
    ).length;
    const totalCount = this.reminders.filter(r => !r.isChangelog).length;

    let html = `
      <div class="ios-widget-wrapper">
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
          
          <div class="ai-sync-pill">
            <i class="fas fa-shield-halved"></i>
            <span>Autonomous sync active with Apple & Google Calendar</span>
          </div>

          <div class="calendly-panel">
            <button type="button" class="calendly-panel-button">
              <i class="fas fa-calendar-check" aria-hidden="true"></i>
              <span>Book Instant 30-Min Consultation</span>
            </button>
          </div>
        </div>

        <!-- Reminders Section -->
        <div class="ios-reminders-section">
          <div class="reminders-header">
            <div class="reminders-title">
              <i class="fas fa-list-check" aria-hidden="true"></i>
              <span>Smart Reminders & Events</span>
            </div>
            <button type="button" class="ios-btn-small" title="Add Reminder" aria-label="Add new reminder"><i class="fas fa-plus" aria-hidden="true"></i> New</button>
          </div>

          <!-- Category Filter Tabs -->
          <div class="calendar-filter-tabs" role="tablist" aria-label="Filter events by category">
            <button type="button" class="filter-tab ${this.activeFilter === 'day' ? 'active' : ''}" data-filter="day">
              <i class="fas fa-calendar-day"></i> Day (${dayMatchesCount})
            </button>
            <button type="button" class="filter-tab ${this.activeFilter === 'all' ? 'active' : ''}" data-filter="all">
              All (${totalCount})
            </button>
            <button type="button" class="filter-tab ${this.activeFilter === 'events' ? 'active' : ''}" data-filter="events">
              Events (${totalEventsCount})
            </button>
            <button type="button" class="filter-tab ${this.activeFilter === 'birthdays' ? 'active' : ''}" data-filter="birthdays">
              Birthdays (${totalBirthdaysCount})
            </button>
            <button type="button" class="filter-tab ${this.activeFilter === 'changelog' ? 'active' : ''}" data-filter="changelog">
              Changelog (${totalChangelogCount})
            </button>
            <button type="button" class="filter-tab ${this.activeFilter === 'reminders' ? 'active' : ''}" data-filter="reminders">
              Tasks (${totalRemindersCount})
            </button>
          </div>

          ${
            this.activeFilter === 'day' && this.selectedDate
              ? `
            <div class="day-inspector-banner">
              <div class="day-inspector-info">
                <i class="fas fa-filter"></i>
                <span>Showing items for <strong>${monthNames[this.selectedDate.getMonth()]} ${this.selectedDate.getDate()}, ${this.selectedDate.getFullYear()}</strong></span>
              </div>
              <button type="button" class="day-inspector-clear" title="Show All Items">
                <i class="fas fa-times"></i> View All
              </button>
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
                  <i class="fas fa-calendar-plus"></i>
                </div>
                <div class="empty-state-title">No Reminders or Events</div>
                <div class="empty-state-subtitle">${
                  this.selectedDate
                    ? `${monthNames[this.selectedDate.getMonth()]} ${this.selectedDate.getDate()}`
                    : 'This day'
                } is completely open. Add a reminder or book a consultation.</div>
                <div class="empty-state-actions">
                  <button type="button" class="empty-action-btn add-reminder-btn">
                    <i class="fas fa-plus"></i> Add Reminder
                  </button>
                  <button type="button" class="empty-action-btn book-consult-btn">
                    <i class="fas fa-calendar-check"></i> Book Consultation
                  </button>
                  <button type="button" class="empty-action-btn show-all-btn">
                    <i class="fas fa-layer-group"></i> View All Items
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
                    ${r.tag ? `<span class="card-tag tag-${escapeHtml(r.color || 'blue')}">${escapeHtml(r.tag)}</span>` : ''}
                  </div>
                  <div class="card-title">${escapeHtml(r.text)}</div>
                  ${r.location ? `<div class="card-location"><i class="fas fa-map-pin"></i> ${escapeHtml(r.location)}</div>` : ''}
                </div>
                <div class="card-action-area">
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
        this.render();
      };

      // Toggle Circle
      const statusCircle = item.querySelector('.status-circle');
      if (statusCircle) {
        statusCircle.onclick = e => {
          e.stopPropagation();
          reminder.completed = !reminder.completed;
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

    let title = typeof titleOverride === 'string' && titleOverride ? titleOverride : null;
    if (!title && typeof window !== 'undefined' && typeof window.prompt === 'function') {
      try {
        const inputTitle = window.prompt(
          `Add New Reminder / Event for ${monthNames[selMonth]} ${selDay}, ${selYear}:`,
          'New Reminder'
        );
        if (inputTitle === null) return;
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

    const newReminder = {
      id: Date.now(),
      text: title,
      time: `${monthNames[selMonth]} ${selDay} · Scheduled`,
      dateKey: dKey,
      category: 'reminders',
      color: ['blue', 'red', 'orange', 'green', 'purple'][Math.floor(Math.random() * 5)],
      tag: 'Custom',
      icon: 'bell',
      completed: false,
    };
    this.reminders.unshift(newReminder);
    this.activeFilter = 'day';
    this.render();
  }

  addConfirmedBooking({ title, time, tag = 'Confirmed' } = {}) {
    const today = new Date();
    const bookingReminder = {
      id: Date.now(),
      text: title || 'Confirmed Consultation (Google Meet)',
      time: time || 'Confirmed',
      dateKey: dateKey(today.getFullYear(), today.getMonth(), today.getDate()),
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
    const today = new Date(2026, 7, 24);
    this.date = new Date(today);
    this.selectedDate = new Date(today);
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
