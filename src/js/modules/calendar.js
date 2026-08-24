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
    this.liveSlots = [];
    this.liveEvents = [];
    this.liveProviders = ['google'];
    this.availabilityLoaded = false;

    // "Smart" Reminders & Live Calendar Data
    this.reminders = [
      {
        id: 999,
        text: "Mangesh's Birthday 🎂",
        time: 'Dec 7',
        tag: 'Special',
        color: 'gold',
        completed: false,
      },
      {
        id: 100,
        text: 'Google Calendar Sync',
        time: 'Live Auto-Sync',
        tag: 'Google',
        color: 'blue',
        completed: false,
      },
      {
        id: 1,
        text: 'Review Portfolio Design',
        time: '10:00 AM',
        tag: 'Design',
        color: 'blue',
        completed: false,
      },
      {
        id: 2,
        text: 'Email Mangesh',
        time: '2:00 PM',
        tag: 'Urgent',
        color: 'red',
        completed: false,
      },
      {
        id: 3,
        text: 'AI Model Training',
        time: '4:30 PM',
        tag: 'Dev',
        color: 'purple',
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
              const isCursor = lowerTitle.includes('cursor');
              const isClaude = lowerTitle.includes('claude');
              const tag = isCursor ? 'Cursor' : isClaude ? 'Claude' : 'Apple';
              const color = isCursor ? 'blue' : isClaude ? 'orange' : 'purple';

              let timeLabel = 'Aug 29';
              if (ev.start) {
                const d = new Date(ev.start);
                const mStr = d.toLocaleString('en-US', { month: 'short' });
                const dayNum = d.getDate();
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
                tag,
                color,
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

      html += `
        <span class="${classes}" data-day="${i}" data-date-key="${thisKey}" ${isBirthday ? 'title="Mangesh\'s Birthday 🎂"' : ''}>
          ${i}
          ${hasEvent && !isBirthday ? '<div class="event-dot" title="Available consultation slot"></div>' : ''}
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
            <button type="button" class="ios-btn-small" aria-label="Add new reminder"><i class="fas fa-plus" aria-hidden="true"></i> New</button>
          </div>
          
          <div class="reminders-scroll-area">
            <div class="reminder-cards-grid">
              ${this.reminders
                .map(
                  r => `
                <div class="reminder-card ${r.completed ? 'completed' : ''} accent-${escapeHtml(r.color)}" data-id="${r.id}">
                  <div class="card-accent-strip"></div>
                  <div class="card-content">
                    <div class="card-header-flex">
                       <span class="card-time"><i class="fas fa-${r.tag === 'Google' ? 'calendar-check' : r.tag === 'Special' ? 'cake-candles' : 'clock'}" aria-hidden="true"></i> ${escapeHtml(r.time)}</span>
                       <span class="card-tag">${escapeHtml(r.tag)}</span>
                    </div>
                    <div class="card-title">${escapeHtml(r.text)}</div>
                  </div>
                  <div class="card-action-area">
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

  bindEvents() {
    // Month Navigation
    const prevBtn = this.container.querySelector('.ios-actions button:first-child');
    const todayBtn = this.container.querySelector('.today-btn');
    const nextBtn = this.container.querySelector('.ios-actions button:last-child');

    if (prevBtn) prevBtn.onclick = () => this.changeMonth(-1);
    if (todayBtn) todayBtn.onclick = () => this.goToToday();
    if (nextBtn) nextBtn.onclick = () => this.changeMonth(1);

    // Reminder Toggle (Target new Card class)
    this.container.querySelectorAll('.reminder-card').forEach(item => {
      // Toggle Complete on Card Click
      item.onclick = e => {
        // Ignore if clicking buttons inside
        if (e.target.closest('.edit-btn')) return;

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
          e.stopPropagation(); // Stop card click
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
    });

    // Add New Reminder
    const newBtn = this.container.querySelector('.ios-btn-small');
    if (newBtn) {
      newBtn.onclick = () => {
        const newReminder = {
          id: Date.now(),
          text: 'New Reminder',
          time: 'Now',
          color: ['blue', 'red', 'orange', 'green', 'purple'][Math.floor(Math.random() * 5)],
          tag: 'Inbox',
          completed: false,
        };
        this.reminders.unshift(newReminder); // Add to top
        this.render();
      };
    }

    const calendlyBtn = this.container.querySelector('.calendly-panel-button');
    if (calendlyBtn) {
      calendlyBtn.onclick = () => {
        openCalendlyPopup();
      };
    }

    // Day Selection
    this.container.querySelectorAll('.day-cell:not(.empty)').forEach(day => {
      day.addEventListener('click', () => {
        this.selectedDayCell?.classList.remove('selected');
        day.classList.add('selected');
        this.selectedDayCell = day;
        this.selectedDate = new Date(
          this.date.getFullYear(),
          this.date.getMonth(),
          parseInt(day.dataset.day, 10)
        );
      });
    });
  }

  addConfirmedBooking({ title, time, tag = 'Confirmed' } = {}) {
    const bookingReminder = {
      id: Date.now(),
      text: title || 'Confirmed Consultation (Google Meet)',
      time: time || 'Confirmed',
      color: 'green',
      tag,
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
    this.date = new Date();
    this.selectedDate = new Date();
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
