import { escapeHtml } from '../utils/escape-html.js';
import { getFormsApiBase, getSubmissionContext } from '../services/form-submission.js';
import { openCalendlyPopup } from '../utils/calendly.js';

const CALENDAR_ENDPOINT = '/api/calendar/availability';
const BOOKING_ENDPOINT = '/api/calendar/book';
const ET_ZONE = 'America/New_York';

function ensureContactSolidStyles() {
  const id = 'contact-solid-css';
  const href = 'assets/css/contact-solid.css?v=20260823calendar1';
  if (document.getElementById(id) || document.querySelector('link[href*="contact-solid.css"]')) {
    return;
  }
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

function calendarApiUrl(path) {
  return `${getFormsApiBase()}${path}`;
}

function formatSlotParts(slot) {
  const start = new Date(slot.start);
  const localDate = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(start);
  const localTime = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(start);
  const etTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: ET_ZONE,
    timeZoneName: 'short',
  }).format(start);
  return { localDate, localTime, etTime };
}

function dateKeyInZone(value, timeZone = ET_ZONE) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(
    parts.filter(part => part.type !== 'literal').map(part => [part.type, part.value])
  );
  return `${values.year}-${values.month}-${values.day}`;
}

function localDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function statusMessage(status) {
  if (status === 'needs_auth') {
    return 'Calendar connection is being refreshed. Email Mangesh to schedule in the meantime.';
  }
  if (status === 'not_configured') {
    return 'Live Calendar booking is being configured. Email Mangesh to schedule.';
  }
  return 'Live availability is temporarily unavailable. Email Mangesh to schedule.';
}

function escapeIcsText(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

function formatIcsUtc(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error('Invalid calendar date');
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
}

export function buildCalendarInviteIcs({
  uid,
  start,
  end,
  summary,
  description = '',
  meetingUrl = '',
  now = new Date(),
}) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mangesh Raut Portfolio//Calendar Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${escapeIcsText(uid)}`,
    `DTSTAMP:${formatIcsUtc(now)}`,
    `DTSTART:${formatIcsUtc(start)}`,
    `DTEND:${formatIcsUtc(end)}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
  ];
  if (meetingUrl) {
    lines.push(`LOCATION:${escapeIcsText(`Google Meet: ${meetingUrl}`)}`);
    lines.push(`URL:${meetingUrl}`);
  }
  lines.push(
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Portfolio consultation starts in 30 minutes',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
    ''
  );
  return lines.join('\r\n');
}

function downloadCalendarInvite(ics, platform) {
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `mangesh-raut-consultation-${platform}.ics`;
  link.hidden = true;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export class CalendarBookingWidget {
  constructor(containerId, { now = new Date() } = {}) {
    this.container = document.getElementById(containerId);
    this.now = new Date(now);
    this.displayDate = new Date(this.now.getFullYear(), this.now.getMonth(), 1);
    this.slots = [];
    this.providers = [];
    this.selectedSlot = null;
    this.selectedDateKey = '';
    this.sessionEvents = [];
    this.bookingConfirmed = false;
  }

  async init() {
    if (!this.container) return;
    this.renderLoading();
    try {
      const response = await fetch(calendarApiUrl(CALENDAR_ENDPOINT), {
        headers: { Accept: 'application/json' },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.status !== 'live' || !Array.isArray(payload.slots)) {
        this.renderUnavailable(payload.status || 'degraded');
        return;
      }
      this.slots = payload.slots;
      this.providers =
        Array.isArray(payload.providers) && payload.providers.length
          ? payload.providers
          : ['google'];
      this.renderAvailability();
    } catch {
      this.renderUnavailable('degraded');
    }
  }

  renderLoading() {
    this.container.innerHTML = `
      <div class="calendar-booking calendar-booking--loading" aria-busy="true">
        <div class="loading-spinner" aria-hidden="true"></div>
        <p>Checking multi-calendar availability (Google, Outlook, Apple)…</p>
      </div>`;
  }

  renderUnavailable(status) {
    this.container.innerHTML = `
      <div class="ios-widget-wrapper">
      <div class="calendar-booking" data-calendar-state="${escapeHtml(status)}">
        <header class="calendar-booking__header">
          <div class="calendar-booking__icon" aria-hidden="true"><i class="fas fa-calendar-alt"></i></div>
          <div>
            <div class="calendar-booking__eyebrow-row">
              <span class="calendar-booking__eyebrow"><span class="calendar-booking__live-dot" aria-hidden="true"></span> Scheduling</span>
              <div class="calendar-booking__providers">${this.renderProviderBadges()}</div>
            </div>
            <h4>Consultation Scheduling</h4>
            <p>Direct slot booking is in fallback mode. You can email Mangesh or schedule instantly via Calendly below.</p>
          </div>
        </header>
        ${this.renderMonthCalendar()}
        ${this.renderEventsSection()}
        ${this.renderRemindersSection()}
        <section class="calendar-live-slots" style="margin-bottom: 1rem;">
          <div class="calendar-booking calendar-booking--unavailable" style="margin: 0; width: 100%; box-sizing: border-box;" data-calendar-state="${escapeHtml(status)}">
            <div class="calendar-booking__status-icon" aria-hidden="true"><i class="fas fa-calendar-xmark"></i></div>
            <div>
              <h4>Direct slot booking unavailable</h4>
              <p>${escapeHtml(statusMessage(status))}</p>
              <a class="calendar-booking__email" href="mailto:mbr63drexel@gmail.com?subject=Consultation%20request">
                Email Mangesh <i class="fas fa-arrow-right" aria-hidden="true"></i>
              </a>
            </div>
          </div>
        </section>
        <div class="calendly-panel">
          <div class="calendly-panel-icon"><i class="fas fa-calendar-check" aria-hidden="true"></i></div>
          <div class="calendly-panel-copy">
            <span class="calendly-panel-kicker">Calendly Scheduler</span>
            <h4>Book a consultation</h4>
            <p>Prefer the original scheduling experience? Open the integrated Calendly calendar.</p>
          </div>
          <button type="button" class="calendly-panel-button"><span>Check Calendly</span><i class="fas fa-arrow-right" aria-hidden="true"></i></button>
        </div>
        <p class="calendar-booking__privacy"><i class="fas fa-lock" aria-hidden="true"></i> Only free slots across all connected calendars are shown. Event details stay private.</p>
      </div></div>`;
    this.bindCalendarControls();
  }

  renderProviderBadges() {
    const icons = {
      google:
        '<span class="calendar-provider-badge" title="Google Calendar"><i class="fab fa-google" aria-hidden="true"></i> Google</span>',
      microsoft:
        '<span class="calendar-provider-badge" title="Microsoft Outlook"><i class="fab fa-microsoft" aria-hidden="true"></i> Outlook</span>',
      apple:
        '<span class="calendar-provider-badge" title="Apple Calendar"><i class="fab fa-apple" aria-hidden="true"></i> Apple</span>',
    };
    return (this.providers.length ? this.providers : ['google'])
      .map(p => icons[p] || `<span class="calendar-provider-badge">${escapeHtml(p)}</span>`)
      .join(' ');
  }

  renderAvailability() {
    if (!this.slots.length) {
      this.renderUnavailable('no_slots');
      return;
    }
    this.container.innerHTML = `
      <div class="ios-widget-wrapper">
      <div class="calendar-booking" data-calendar-state="live">
        <header class="calendar-booking__header">
          <div class="calendar-booking__icon" aria-hidden="true"><i class="fas fa-calendar-alt"></i></div>
          <div>
            <div class="calendar-booking__eyebrow-row">
              <span class="calendar-booking__eyebrow"><span class="calendar-booking__live-dot" aria-hidden="true"></span> Live Sync</span>
              <div class="calendar-booking__providers">${this.renderProviderBadges()}</div>
            </div>
            <h4>Live Multi-Calendar Availability</h4>
            <p>Synced with Google Calendar, Microsoft Outlook, and Apple Calendar. Times display in your local zone.</p>
          </div>
        </header>
        ${this.renderMonthCalendar()}
        ${this.renderEventsSection()}
        ${this.renderRemindersSection()}
        <section class="calendar-live-slots" aria-labelledby="calendar-live-slots-title">
          <div class="calendar-section-heading">
            <div><span class="calendar-section-kicker">Multi-Calendar Slots</span><h5 id="calendar-live-slots-title">${this.selectedDateKey ? 'Available on selected day' : 'Next available times'}</h5></div>
            ${this.selectedDateKey ? '<button type="button" class="calendar-clear-date" data-calendar-clear-date>Show all</button>' : ''}
          </div>
          <div class="calendar-slot-grid" role="list" aria-label="Available consultation times">
            ${this.renderSlots()}
          </div>
        </section>
        <div data-calendar-booking-panel></div>
        <div class="calendly-panel">
          <div class="calendly-panel-icon"><i class="fas fa-calendar-check" aria-hidden="true"></i></div>
          <div class="calendly-panel-copy">
            <span class="calendly-panel-kicker">Calendly fallback</span>
            <h4>Book a consultation</h4>
            <p>Prefer the original scheduling experience? Open the integrated Calendly calendar.</p>
          </div>
          <button type="button" class="calendly-panel-button"><span>Check Calendly</span><i class="fas fa-arrow-right" aria-hidden="true"></i></button>
        </div>
        <p class="calendar-booking__privacy"><i class="fas fa-lock" aria-hidden="true"></i> Only free slots across all connected calendars are shown. Event details stay private.</p>
      </div></div>`;
    this.bindCalendarControls();
    this.bindSlots();
  }

  renderMonthCalendar() {
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
    const year = this.displayDate.getFullYear();
    const month = this.displayDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const availabilityDates = new Set(this.slots.map(slot => dateKeyInZone(slot.start)));
    const bookedDates = new Set(this.sessionEvents.map(event => dateKeyInZone(event.start)));
    const todayKey = localDateKey(this.now.getFullYear(), this.now.getMonth(), this.now.getDate());
    const cells = [];
    for (let index = 0; index < firstDay; index += 1) {
      cells.push('<span class="day-cell empty" aria-hidden="true"></span>');
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const key = localDateKey(year, month, day);
      const available = availabilityDates.has(key);
      const booked = bookedDates.has(key);
      const selected = key === this.selectedDateKey;
      const classes = [
        'day-cell',
        key === todayKey ? 'today' : '',
        available ? 'has-availability' : '',
        booked ? 'has-booked-event' : '',
        selected ? 'selected' : '',
      ]
        .filter(Boolean)
        .join(' ');
      cells.push(
        `<button type="button" class="${classes}" data-calendar-date="${key}" aria-pressed="${selected ? 'true' : 'false'}" aria-label="${monthNames[month]} ${day}${available ? ', availability' : ''}${booked ? ', booked event' : ''}">${day}${available ? '<span class="availability-dot" aria-hidden="true"></span>' : ''}${booked ? '<span class="booked-dot" aria-hidden="true"></span>' : ''}</button>`
      );
    }
    return `<section class="ios-calendar-section" aria-label="Availability calendar">
      <div class="ios-header">
        <div class="month-title"><span class="current-month">${monthNames[month]}</span><span class="current-year">${year}</span></div>
        <div class="ios-actions">
          <button type="button" class="ios-btn icon-only" data-calendar-month="previous" aria-label="Previous month"><i class="fas fa-chevron-left" aria-hidden="true"></i></button>
          <button type="button" class="ios-btn today-btn" data-calendar-today aria-label="Go to today"><i class="fas fa-calendar-day" aria-hidden="true"></i></button>
          <button type="button" class="ios-btn icon-only" data-calendar-month="next" aria-label="Next month"><i class="fas fa-chevron-right" aria-hidden="true"></i></button>
        </div>
      </div>
      <div class="ios-weekdays" aria-hidden="true">${['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => `<span>${day}</span>`).join('')}</div>
      <div class="ios-grid">${cells.join('')}</div>
      <div class="calendar-legend"><span><i class="availability-dot" aria-hidden="true"></i> Available</span><span><i class="booked-dot" aria-hidden="true"></i> Your booking</span></div>
    </section>`;
  }

  renderEventsSection() {
    const events = this.sessionEvents.length
      ? this.sessionEvents
          .map(event => {
            const parts = formatSlotParts(event);
            return `<article class="calendar-event-card"><div class="calendar-event-card__icon"><i class="fas fa-video" aria-hidden="true"></i></div><div><span class="calendar-event-card__time">${escapeHtml(`${parts.localDate} · ${parts.localTime}`)}</span><h6>${escapeHtml(event.topic)}</h6><p>Google Calendar invitation sent${event.meetingUrl ? ' · Meet link included' : ''}</p></div></article>`;
          })
          .join('')
      : '<p class="calendar-section-empty">Your confirmed meetings will appear here after booking.</p>';
    return `<section class="calendar-events-section" aria-labelledby="calendar-events-title"><div class="calendar-section-heading"><div><span class="calendar-section-kicker">Events</span><h5 id="calendar-events-title">Your booked meetings</h5></div></div><div class="calendar-events-list">${events}</div></section>`;
  }

  renderRemindersSection() {
    const status = this.bookingConfirmed ? 'Active' : 'Ready after booking';
    const reminders = [
      [
        'fa-envelope',
        'Google Calendar Invitation',
        'Sent with Google Meet video link to attendee email',
      ],
      [
        'fa-microsoft',
        'Outlook & To-Do Sync',
        'Automatic synchronized task and calendar alarm in Outlook',
      ],
      [
        'fa-apple',
        'Apple Calendar & Reminders',
        'One-click iCloud Calendar and Apple Reminders sync with alarm',
      ],
      ['fa-bell', '30-minute popup reminder', 'Included in Google, Outlook, and Apple .ics alarms'],
    ];
    return `<section class="ios-reminders-section" aria-labelledby="calendar-reminders-title"><div class="ios-header"><div class="reminders-title" id="calendar-reminders-title"><i class="fas fa-bell" aria-hidden="true"></i> Multi-Calendar + Reminders</div></div><div class="reminders-scroll-area"><div class="reminder-cards-grid">${reminders
      .map(
        ([icon, title, detail]) =>
          `<article class="reminder-card ${this.bookingConfirmed ? 'is-active' : ''}"><div class="card-accent-strip"></div><div class="card-content"><div class="card-header-flex"><span class="card-time"><i class="${icon.startsWith('fa-') && (icon.includes('apple') || icon.includes('microsoft')) ? 'fab' : 'fas'} ${icon}" aria-hidden="true"></i> ${status}</span><span class="card-tag">Real</span></div><div class="card-title">${title}</div><p class="card-detail">${detail}</p></div></article>`
      )
      .join('')}</div></div></section>`;
  }

  visibleSlotEntries() {
    return this.slots
      .map((slot, index) => ({ slot, index }))
      .filter(
        ({ slot }) => !this.selectedDateKey || dateKeyInZone(slot.start) === this.selectedDateKey
      );
  }

  renderSlots() {
    const entries = this.visibleSlotEntries();
    if (!entries.length) {
      return '<p class="calendar-section-empty calendar-section-empty--slots">No free times on this date. Choose another day or use Calendly.</p>';
    }
    return entries
      .map(({ slot, index }) => {
        const parts = formatSlotParts(slot);
        return `<button type="button" class="calendar-slot" data-calendar-slot="${index}" role="listitem" aria-label="${escapeHtml(`${parts.localDate}, ${parts.localTime}; ${parts.etTime}`)}"><span class="calendar-slot__date">${escapeHtml(parts.localDate)}</span><span class="calendar-slot__time">${escapeHtml(parts.localTime)}</span><span class="calendar-slot__et">${escapeHtml(parts.etTime)}</span></button>`;
      })
      .join('');
  }

  bindCalendarControls() {
    this.bindMonthControls();
    this.container.querySelector('.calendly-panel-button')?.addEventListener('click', () => {
      void openCalendlyPopup();
    });
  }

  bindMonthControls() {
    this.container.querySelectorAll('[data-calendar-month]').forEach(button => {
      button.addEventListener('click', () => {
        const offset = button.dataset.calendarMonth === 'next' ? 1 : -1;
        this.displayDate = new Date(
          this.displayDate.getFullYear(),
          this.displayDate.getMonth() + offset,
          1
        );
        this.selectedDateKey = '';
        this.renderAvailability();
      });
    });
    this.container.querySelector('[data-calendar-today]')?.addEventListener('click', () => {
      this.displayDate = new Date(this.now.getFullYear(), this.now.getMonth(), 1);
      this.selectedDateKey = '';
      this.renderAvailability();
    });
    this.container.querySelectorAll('[data-calendar-date]').forEach(button => {
      button.addEventListener('click', () => {
        this.selectedDateKey = button.dataset.calendarDate || '';
        this.renderAvailability();
      });
    });
    this.container.querySelector('[data-calendar-clear-date]')?.addEventListener('click', () => {
      this.selectedDateKey = '';
      this.renderAvailability();
    });
  }

  bindSlots() {
    this.container.querySelectorAll('[data-calendar-slot]').forEach(button => {
      button.addEventListener('click', () => {
        const index = Number(button.dataset.calendarSlot);
        this.selectedSlot = this.slots[index] || null;
        this.container.querySelectorAll('[data-calendar-slot]').forEach(item => {
          const selected = item === button;
          item.classList.toggle('is-selected', selected);
          item.setAttribute('aria-pressed', selected ? 'true' : 'false');
        });
        this.renderBookingForm();
      });
    });
  }

  renderBookingForm() {
    const panel = this.container.querySelector('[data-calendar-booking-panel]');
    if (!panel || !this.selectedSlot) return;
    const parts = formatSlotParts(this.selectedSlot);
    panel.innerHTML = `
      <form class="calendar-booking-form" data-calendar-booking-form novalidate>
        <div class="calendar-booking-form__summary">
          <i class="fas fa-calendar-check" aria-hidden="true"></i>
          <span><strong>${escapeHtml(parts.localDate)}</strong> · ${escapeHtml(parts.localTime)}</span>
        </div>
        <div class="calendar-booking-form__grid">
          <label>Name<input class="apple-input" name="name" type="text" maxlength="100" autocomplete="name" required /></label>
          <label>Email<input class="apple-input" name="email" type="email" maxlength="200" autocomplete="email" required /></label>
          <label class="calendar-booking-form__topic">What should we discuss?<textarea class="apple-input apple-textarea" name="topic" maxlength="500" rows="3" required></textarea></label>
        </div>
        <label class="form-honeypot" aria-hidden="true">Website<input name="website" type="text" tabindex="-1" autocomplete="off" /></label>
        <button class="btn-primary calendar-booking-form__submit" type="submit">
          <span>Book and email invitation</span><i class="fas fa-arrow-right" aria-hidden="true"></i>
        </button>
        <p class="calendar-booking-form__status" data-calendar-status role="status" aria-live="polite"></p>
      </form>`;
    panel.querySelector('form').addEventListener('submit', event => this.submitBooking(event));
    panel.querySelector('[name="name"]')?.focus();
  }

  async submitBooking(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const status = form.querySelector('[data-calendar-status]');
    const submit = form.querySelector('button[type="submit"]');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    submit.disabled = true;
    submit.setAttribute('aria-busy', 'true');
    status.textContent = 'Creating your Google Calendar invitation…';
    status.className = 'calendar-booking-form__status';

    try {
      const response = await fetch(calendarApiUrl(BOOKING_ENDPOINT), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.elements.name.value.trim(),
          email: form.elements.email.value.trim(),
          topic: form.elements.topic.value.trim(),
          website: form.elements.website.value,
          slotToken: this.selectedSlot.token,
          ...getSubmissionContext({ source: 'github_pages_calendar' }),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success || !payload.eventCreated || !payload.invitationSent) {
        throw new Error(payload.error || 'Booking could not be completed.');
      }
      const invite = buildCalendarInviteIcs({
        uid: `${payload.bookingId || crypto.randomUUID()}@mangeshraut.pro`,
        start: payload.start || this.selectedSlot.start,
        end: payload.end || this.selectedSlot.end,
        summary: 'Portfolio consultation with Mangesh Raut',
        description: form.elements.topic.value.trim(),
        meetingUrl: payload.meetingUrl || '',
      });
      this.bookingConfirmed = true;
      this.sessionEvents.push({
        start: payload.start || this.selectedSlot.start,
        end: payload.end || this.selectedSlot.end,
        topic: form.elements.topic.value.trim(),
        meetingUrl: payload.meetingUrl || '',
      });
      const monthSection = this.container.querySelector('.ios-calendar-section');
      if (monthSection) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = this.renderMonthCalendar();
        monthSection.replaceWith(wrapper.firstElementChild);
        this.bindMonthControls();
      }
      const eventsList = this.container.querySelector('.calendar-events-list');
      if (eventsList) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = this.renderEventsSection();
        eventsList.replaceWith(wrapper.querySelector('.calendar-events-list'));
      }
      const reminders = this.container.querySelector('.ios-reminders-section');
      if (reminders) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = this.renderRemindersSection();
        reminders.replaceWith(wrapper.firstElementChild);
      }
      const panel = this.container.querySelector('[data-calendar-booking-panel]');
      panel.innerHTML = `
        <div class="calendar-booking-confirmation" role="status" data-calendar-status>
          <div class="calendar-booking-confirmation__icon" aria-hidden="true"><i class="fas fa-check"></i></div>
          <div>
            <h5>Meeting booked</h5>
            <p>${escapeHtml(payload.message || 'Google Calendar emailed your invitation.')}</p>
            <p class="calendar-booking-confirmation__hint">Use the standard event file if you prefer Apple Calendar or Outlook.</p>
            <div class="calendar-booking-confirmation__actions" aria-label="Add meeting to another calendar">
              <button type="button" class="calendar-download" data-calendar-download="apple"><i class="fab fa-apple" aria-hidden="true"></i> Apple Calendar</button>
              <button type="button" class="calendar-download" data-calendar-download="outlook"><i class="fab fa-microsoft" aria-hidden="true"></i> Outlook</button>
            </div>
          </div>
        </div>`;
      panel.querySelectorAll('[data-calendar-download]').forEach(button => {
        button.addEventListener('click', () => {
          downloadCalendarInvite(invite, button.dataset.calendarDownload || 'calendar');
        });
      });
      this.container.querySelectorAll('[data-calendar-slot]').forEach(button => {
        button.disabled = true;
      });
    } catch (error) {
      status.textContent = error.message || 'Booking could not be completed.';
      status.classList.add('is-error');
      submit.disabled = false;
      submit.setAttribute('aria-busy', 'false');
    }
  }
}

export async function initCalendarWidget() {
  ensureContactSolidStyles();
  const widget = new CalendarBookingWidget('calendar-widget');
  await widget.init();
  return widget;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => void initCalendarWidget(), { once: true });
} else {
  void initCalendarWidget();
}
