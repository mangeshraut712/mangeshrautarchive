import { escapeHtml } from '../utils/escape-html.js';
import { getFormsApiBase, getSubmissionContext } from '../services/form-submission.js';

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

function statusMessage(status) {
  if (status === 'needs_auth') {
    return 'Calendar connection is being refreshed. Email Mangesh to schedule in the meantime.';
  }
  if (status === 'not_configured') {
    return 'Live Calendar booking is being configured. Email Mangesh to schedule.';
  }
  return 'Live availability is temporarily unavailable. Email Mangesh to schedule.';
}

export class CalendarBookingWidget {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.slots = [];
    this.selectedSlot = null;
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
      this.renderAvailability();
    } catch {
      this.renderUnavailable('degraded');
    }
  }

  renderLoading() {
    this.container.innerHTML = `
      <div class="calendar-booking calendar-booking--loading" aria-busy="true">
        <div class="loading-spinner" aria-hidden="true"></div>
        <p>Checking Google Calendar availability…</p>
      </div>`;
  }

  renderUnavailable(status) {
    this.container.innerHTML = `
      <div class="calendar-booking calendar-booking--unavailable" data-calendar-state="${escapeHtml(status)}">
        <div class="calendar-booking__status-icon" aria-hidden="true"><i class="fas fa-calendar-xmark"></i></div>
        <div>
          <h4>Scheduling temporarily unavailable</h4>
          <p>${escapeHtml(statusMessage(status))}</p>
          <a class="calendar-booking__email" href="mailto:mbr63drexel@gmail.com?subject=Consultation%20request">
            Email Mangesh <i class="fas fa-arrow-right" aria-hidden="true"></i>
          </a>
        </div>
      </div>`;
  }

  renderAvailability() {
    if (!this.slots.length) {
      this.renderUnavailable('no_slots');
      return;
    }
    this.container.innerHTML = `
      <div class="calendar-booking" data-calendar-state="live">
        <header class="calendar-booking__header">
          <div class="calendar-booking__icon" aria-hidden="true"><i class="fab fa-google"></i></div>
          <div>
            <span class="calendar-booking__eyebrow"><span class="calendar-booking__live-dot" aria-hidden="true"></span> Connected</span>
            <h4>Live Google Calendar availability</h4>
            <p>Choose a 30-minute consultation. Times display in your local zone; availability is managed in ET.</p>
          </div>
        </header>
        <div class="calendar-slot-grid" role="list" aria-label="Available consultation times">
          ${this.slots
            .map((slot, index) => {
              const parts = formatSlotParts(slot);
              return `<button type="button" class="calendar-slot" data-calendar-slot="${index}" role="listitem" aria-label="${escapeHtml(`${parts.localDate}, ${parts.localTime}; ${parts.etTime}`)}">
                <span class="calendar-slot__date">${escapeHtml(parts.localDate)}</span>
                <span class="calendar-slot__time">${escapeHtml(parts.localTime)}</span>
                <span class="calendar-slot__et">${escapeHtml(parts.etTime)}</span>
              </button>`;
            })
            .join('')}
        </div>
        <div data-calendar-booking-panel></div>
        <p class="calendar-booking__privacy"><i class="fas fa-lock" aria-hidden="true"></i> Only free slots are shown. Event details stay private.</p>
      </div>`;
    this.bindSlots();
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
      const panel = this.container.querySelector('[data-calendar-booking-panel]');
      panel.innerHTML = `
        <div class="calendar-booking-confirmation" role="status" data-calendar-status>
          <div class="calendar-booking-confirmation__icon" aria-hidden="true"><i class="fas fa-check"></i></div>
          <div><h5>Meeting booked</h5><p>${escapeHtml(payload.message || 'Google Calendar emailed your invitation.')}</p></div>
        </div>`;
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
