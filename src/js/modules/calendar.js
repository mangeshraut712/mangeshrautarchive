import { openCalendlyPopup } from '../utils/calendly.js';
import { escapeHtml } from '../utils/escape-html.js';
import { getFormsApiBase } from '../services/form-submission.js';

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
    this.date = new Date();
    this.selectedDate = new Date();
    this.selectedDayCell = null;
    this.selectedDayFilter = null;
    this.activeFilter = 'all';
    this.liveSlots = [];
    this.liveEvents = [];
    this.liveProviders = ['google'];
    this.aiAgentStatus = null;
    this.availabilityLoaded = false;

    // "Smart" Reminders & Live Calendar Data
    this.reminders = [
      {
        id: 999,
        text: "Mangesh's Birthday 🎂",
        time: 'Dec 7',
        dateKey: '12-07',
        category: 'birthdays',
        tag: 'Special',
        color: 'gold',
        icon: 'cake-candles',
        completed: false,
      },
      {
        id: 100,
        text: 'Google Calendar Sync',
        time: 'Live Auto-Sync',
        dateKey: '',
        category: 'reminders',
        tag: 'Google',
        color: 'blue',
        icon: 'calendar-check',
        completed: false,
      },
      {
        id: 1,
        text: 'Review Portfolio Design',
        time: '10:00 AM',
        dateKey: '',
        category: 'reminders',
        tag: 'Design',
        color: 'blue',
        icon: 'palette',
        completed: false,
      },
      {
        id: 2,
        text: 'Email Mangesh',
        time: '2:00 PM',
        dateKey: '',
        category: 'reminders',
        tag: 'Urgent',
        color: 'red',
        icon: 'envelope',
        completed: false,
      },
      {
        id: 3,
        text: 'AI Model Training',
        time: '4:30 PM',
        dateKey: '',
        category: 'reminders',
        tag: 'Dev',
        color: 'purple',
        icon: 'brain',
        completed: false,
      },
    ];
  }

  init() {
    if (!this.container) return;
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
            : ['google'];
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
              r => (r.eventTitle && r.eventTitle === ev.title) || r.text === ev.title
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
              let dKey = '';
              if (ev.start) {
                const d = new Date(ev.start);
                const mStr = d.toLocaleString('en-US', { month: 'short' });
                const dayNum = d.getDate();
                dKey = dateKey(d.getFullYear(), d.getMonth(), dayNum);
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
                description: ev.description || '',
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
    } else {
      // Default event days for visual polish when offline
      [5, 12, 18, 25, 29].forEach(d => eventDays.add(d));
    }
    return eventDays;
  }

  getEventDotColor(year, month, day) {
    const dKey = dateKey(year, month, day);
    const ev = this.liveEvents.find(e => e.start && e.start.startsWith(dKey));
    if (ev) {
      const lower = ev.title.toLowerCase();
      if (lower.includes('cursor')) return 'dot-blue';
      if (lower.includes('claude')) return 'dot-orange';
      if (lower.includes('birthday')) return 'dot-pink';
      if (lower.includes('flight') || lower.includes('stay')) return 'dot-cyan';
      return 'dot-purple';
    }
    return 'dot-blue';
  }

  getFilteredReminders() {
    let list = this.reminders;

    // Filter by category tab
    if (this.activeFilter === 'events') {
      list = list.filter(r => r.category === 'events' || r.isImportedEvent);
    } else if (this.activeFilter === 'reminders') {
      list = list.filter(r => r.category === 'reminders' && !r.isImportedEvent);
    } else if (this.activeFilter === 'birthdays') {
      list = list.filter(
        r => r.category === 'birthdays' || r.text.toLowerCase().includes('birthday')
      );
    }

    // Filter by clicked date inspector if active
    if (this.selectedDayFilter) {
      const dayMatches = list.filter(
        r =>
          (r.dateKey && r.dateKey === this.selectedDayFilter) ||
          (r.time && r.time.includes(this.selectedDayFilter.slice(5)))
      );
      if (dayMatches.length > 0) {
        return dayMatches;
      }
    }

    return list;
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

    const totalEventsCount = this.reminders.filter(
      r => r.category === 'events' || r.isImportedEvent
    ).length;
    const totalRemindersCount = this.reminders.filter(
      r => r.category === 'reminders' && !r.isImportedEvent
    ).length;
    const totalBirthdaysCount = this.reminders.filter(
      r => r.category === 'birthdays' || r.text.toLowerCase().includes('birthday')
    ).length;

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
      const isBirthday = month === 11 && i === 7; // Dec 7
      const hasEvent = liveEventDays.has(i);

      let classes = 'day-cell';
      if (isToday) classes += ' today';
      if (isBirthday) classes += ' mangesh-birthday';
      else if (hasEvent) classes += ' has-event';

      const thisKey = dateKey(year, month, i);
      const isSelected =
        this.selectedDate &&
        this.selectedDate.getFullYear() === year &&
        this.selectedDate.getMonth() === month &&
        this.selectedDate.getDate() === i;

      if (isSelected) classes += ' selected';
      const dotColorClass = this.getEventDotColor(year, month, i);

      html += `
        <span class="${classes}" data-day="${i}" data-date-key="${thisKey}" ${isBirthday ? 'title="Mangesh\'s Birthday 🎂"' : ''}>
          ${i}
          ${hasEvent && !isBirthday ? `<div class="event-dot ${dotColorClass}" title="Calendar Event / Available Slot"></div>` : ''}
          ${isBirthday ? '<div class="birthday-dot"></div>' : ''}
        </span>`;
    }

    html += `
          </div>
        </div>
        
        <!-- Smart Reminders Section -->
        <div class="ios-reminders-section">
          <div class="ios-header">
            <div class="reminders-title">
              <i class="fas fa-layer-group" aria-hidden="true"></i> Smart Reminders & Events
            </div>
            <div class="header-right-actions" style="display:flex;align-items:center;gap:6px;">
              <span class="ai-sync-pill" title="AI synchronization active across Google and Apple Calendar"><i class="fas fa-bolt" aria-hidden="true"></i> AI Sync</span>
              <button type="button" class="ios-btn-small" aria-label="Add new reminder"><i class="fas fa-plus" aria-hidden="true"></i> New</button>
            </div>
          </div>
          
          <!-- Category Filter Tabs -->
          <div class="calendar-filter-tabs" role="tablist" aria-label="Reminder categories">
            <button type="button" class="filter-tab ${this.activeFilter === 'all' ? 'active' : ''}" data-filter="all">All (${this.reminders.length})</button>
            <button type="button" class="filter-tab ${this.activeFilter === 'events' ? 'active' : ''}" data-filter="events">Events (${totalEventsCount})</button>
            <button type="button" class="filter-tab ${this.activeFilter === 'reminders' ? 'active' : ''}" data-filter="reminders">Reminders (${totalRemindersCount})</button>
            <button type="button" class="filter-tab ${this.activeFilter === 'birthdays' ? 'active' : ''}" data-filter="birthdays">Birthdays (${totalBirthdaysCount})</button>
          </div>

          ${
            this.selectedDayFilter
              ? `
            <div class="day-inspector-banner">
              <span><i class="fas fa-calendar-day" aria-hidden="true"></i> Day Filter: ${escapeHtml(this.selectedDayFilter)}</span>
              <button type="button" class="day-inspector-clear" aria-label="Clear day filter"><i class="fas fa-times" aria-hidden="true"></i> Show All</button>
            </div>
          `
              : ''
          }
          
          <div class="reminders-scroll-area">
            <div class="reminder-cards-grid">
              ${filteredReminders
                .map(
                  r => `
                <div class="reminder-card ${r.completed ? 'completed' : ''} accent-${escapeHtml(r.color)}" data-id="${r.id}" data-title="${escapeHtml(r.text)}">
                  <div class="card-accent-strip"></div>
                  <div class="card-content">
                    <div class="card-header-flex">
                       <span class="card-time"><i class="fas fa-${r.icon || (r.tag === 'Google' ? 'calendar-check' : r.tag === 'Special' || r.tag === 'Birthday' ? 'cake-candles' : 'clock')}" aria-hidden="true"></i> ${escapeHtml(r.time)}</span>
                       <span class="card-tag">${escapeHtml(r.tag)}</span>
                    </div>
                    <div class="card-title">${escapeHtml(r.text)}</div>
                  </div>
                  <div class="card-action-area" style="display:flex;align-items:center;gap:4px;">
                    <button type="button" class="card-action-btn ask-ai-btn" title="Ask AI assistant about this event" aria-label="Ask AI about ${escapeHtml(r.text)}">
                      <i class="fas fa-robot" aria-hidden="true"></i>
                    </button>
                    <button type="button" class="card-action-btn ical-btn" title="Download .ics event" aria-label="Download iCal event">
                      <i class="fas fa-calendar-plus" aria-hidden="true"></i>
                    </button>
                    <button type="button" class="edit-btn" aria-label="Edit Reminder">
                      <i class="fas fa-pencil-alt" aria-hidden="true"></i>
                    </button>
                    <button type="button" class="status-circle" aria-label="Toggle Complete">
                      <i class="fas fa-check" aria-hidden="true"></i>
                    </button>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        </div>
        <div class="calendly-panel">
          <div class="calendly-panel-icon">
            <i class="fas fa-calendar-check" aria-hidden="true"></i>
          </div>
          <div class="calendly-panel-copy">
            <span class="calendly-panel-kicker">${this.liveProviders.includes('apple') ? 'Google & Apple Calendar · Live Sync' : 'Google Calendar · Live Sync'}</span>
            <h4>Book a consultation</h4>
            <p>Schedule a focused architecture, full-stack, or AI systems review.</p>
          </div>
          <button type="button" class="calendly-panel-button">
            <span>Check times</span>
            <i class="fas fa-arrow-right" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.bindEvents();
  }

  downloadIcsForEvent(reminder) {
    const summary = reminder.text || 'Portfolio Event';
    const now = new Date();
    const dtstamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const dtstart =
      reminder.time && reminder.time.includes('Aug 29') ? '20260829T103000Z' : dtstamp;
    const dtend = reminder.time && reminder.time.includes('Aug 29') ? '20260829T133000Z' : dtstamp;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Mangesh Raut//Portfolio Calendar Widget//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:event-${reminder.id}@mangeshraut.pro`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:Event synchronized from Mangesh Raut Portfolio Calendar (https://mangeshraut.pro)`,
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

    // Clear Day Inspector
    const clearDayBtn = this.container.querySelector('.day-inspector-clear');
    if (clearDayBtn) {
      clearDayBtn.onclick = () => {
        this.selectedDayFilter = null;
        this.render();
      };
    }

    // Reminder Cards Actions & Toggles
    this.container.querySelectorAll('.reminder-card').forEach(item => {
      // Toggle Complete on Card Click
      item.onclick = e => {
        if (
          e.target.closest('.edit-btn') ||
          e.target.closest('.ask-ai-btn') ||
          e.target.closest('.ical-btn')
        )
          return;

        const id = parseInt(item.dataset.id, 10);
        const reminder = this.reminders.find(r => r.id === id);
        if (reminder) {
          reminder.completed = !reminder.completed;
          this.render();
        }
      };

      // Edit Button Logic
      const editBtn = item.querySelector('.edit-btn');
      if (editBtn) {
        editBtn.onclick = e => {
          e.stopPropagation();
          const id = parseInt(item.dataset.id, 10);
          const reminder = this.reminders.find(r => r.id === id);
          if (reminder) {
            const newText = prompt('Update Reminder:', reminder.text);
            if (newText !== null && newText.trim() !== '') {
              reminder.text = newText;
              this.render();
            }
          }
        };
      }

      // Ask AI Button Logic
      const askAiBtn = item.querySelector('.ask-ai-btn');
      if (askAiBtn) {
        askAiBtn.onclick = e => {
          e.stopPropagation();
          const id = parseInt(item.dataset.id, 10);
          const reminder = this.reminders.find(r => r.id === id);
          if (reminder) {
            this.askAiAboutEvent(reminder);
          }
        };
      }

      // iCal Download Button Logic
      const icalBtn = item.querySelector('.ical-btn');
      if (icalBtn) {
        icalBtn.onclick = e => {
          e.stopPropagation();
          const id = parseInt(item.dataset.id, 10);
          const reminder = this.reminders.find(r => r.id === id);
          if (reminder) {
            this.downloadIcsForEvent(reminder);
          }
        };
      }
    });

    // Add New Reminder
    const newBtn = this.container.querySelector('.ios-btn-small');
    if (newBtn) {
      newBtn.onclick = () => {
        const newReminder = {
          id: Date.now(),
          text: 'New Reminder',
          time: 'Now',
          dateKey: '',
          category: 'reminders',
          color: ['blue', 'red', 'orange', 'green', 'purple'][Math.floor(Math.random() * 5)],
          tag: 'Inbox',
          icon: 'bell',
          completed: false,
        };
        this.reminders.unshift(newReminder);
        this.render();
      };
    }

    const calendlyBtn = this.container.querySelector('.calendly-panel-button');
    if (calendlyBtn) {
      calendlyBtn.onclick = () => {
        openCalendlyPopup();
      };
    }

    // Day Selection & Day Filter
    this.container.querySelectorAll('.day-cell:not(.empty)').forEach(day => {
      day.addEventListener('click', () => {
        this.selectedDayCell?.classList.remove('selected');
        day.classList.add('selected');
        this.selectedDayCell = day;
        const dayNum = parseInt(day.dataset.day, 10);
        this.selectedDate = new Date(this.date.getFullYear(), this.date.getMonth(), dayNum);
        this.selectedDayFilter =
          day.dataset.dateKey || dateKey(this.date.getFullYear(), this.date.getMonth(), dayNum);
        this.render();
      });
    });
  }

  addConfirmedBooking({ title, time, tag = 'Confirmed' } = {}) {
    const bookingReminder = {
      id: Date.now(),
      text: title || 'Confirmed Consultation (Google Meet)',
      time: time || 'Confirmed',
      dateKey: '',
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
    this.selectedDayFilter = null;
    this.render();
  }

  goToToday() {
    this.date = new Date();
    this.selectedDate = new Date();
    this.selectedDayFilter = null;
    this.render();
  }
}

export { CalendarWidget as CalendarBookingWidget };

// Auto-init
export const initCalendarWidget = () => {
  ensureContactSolidStyles();
  const widget = new CalendarWidget('calendar-widget');
  widget.init();
  return widget;
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCalendarWidget);
} else {
  initCalendarWidget();
}
