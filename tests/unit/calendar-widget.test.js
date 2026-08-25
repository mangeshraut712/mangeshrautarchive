import { beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Apple-style Calendar and Smart Reminders Widget', () => {
  it('renders the month calendar, weekdays, and smart reminders list for active day', async () => {
    const { CalendarWidget } = await import('../../src/js/modules/calendar.js');
    document.body.innerHTML = '<div id="calendar-widget"></div>';

    const widget = new CalendarWidget('calendar-widget');
    widget.date = new Date(2026, 7, 24);
    widget.selectedDate = new Date(2026, 7, 24);
    widget.init();

    expect(document.querySelector('.ios-calendar-section')).not.toBeNull();
    expect(document.querySelector('.ios-weekdays')).not.toBeNull();
    expect(document.querySelectorAll('.day-cell')).toBeDefined();
    expect(document.querySelector('.ios-reminders-section')).not.toBeNull();
    expect(document.querySelector('.reminders-title').textContent).toContain('Smart Reminders');

    // On Aug 24, displays items for Aug 24 (Review Portfolio Design, releases)
    expect(document.body.textContent).toContain('Review Portfolio Design');
    expect(document.querySelector('.ios-calendar-section')).not.toBeNull();
  });

  it('contains verified recurring birthdays for Stephen (Aug 6), Mom (Aug 15), and Mangesh (Dec 7)', async () => {
    const { CalendarWidget } = await import('../../src/js/modules/calendar.js');
    document.body.innerHTML = '<div id="calendar-widget"></div>';

    const widget = new CalendarWidget('calendar-widget');
    widget.init();

    const birthdays = widget.reminders.filter(r => r.category === 'birthdays');
    expect(birthdays.length).toBe(3);
    expect(birthdays.some(b => b.text.includes('Stephen'))).toBe(true);
    expect(birthdays.some(b => b.text.includes('Mom'))).toBe(true);
    expect(birthdays.some(b => b.text.includes('Mangesh'))).toBe(true);
    expect(birthdays.some(b => b.text.includes('Dad'))).toBe(false);
    expect(birthdays.some(b => b.text.includes('Sister'))).toBe(false);

    // Switch to Birthdays tab
    const bdayTab = document.querySelector('[data-filter="birthdays"]');
    expect(bdayTab).not.toBeNull();
    bdayTab.click();

    expect(document.body.textContent).toContain("Stephen's Birthday 🎂");
    expect(document.body.textContent).toContain("Mom's Birthday ❤️🎂");
    expect(document.body.textContent).toContain("Mangesh's Birthday 🎂");
  });

  it('integrates changelog entries into calendar with Release tags', async () => {
    const { CalendarWidget } = await import('../../src/js/modules/calendar.js');
    document.body.innerHTML = '<div id="calendar-widget"></div>';

    const widget = new CalendarWidget('calendar-widget');
    widget.init();

    const changelogItems = widget.reminders.filter(
      r => r.category === 'changelog' || r.isChangelog
    );
    expect(changelogItems.length).toBeGreaterThan(0);

    // Click on Changelog tab
    const changelogTab = document.querySelector('[data-filter="changelog"]');
    expect(changelogTab).not.toBeNull();
    changelogTab.click();

    expect(document.querySelectorAll('.reminder-card').length).toBeGreaterThan(0);
    expect(document.body.textContent).toContain('Release');
  });

  it('renders Day Empty State when an open date with no events is selected', async () => {
    const { CalendarWidget } = await import('../../src/js/modules/calendar.js');
    document.body.innerHTML = '<div id="calendar-widget"></div>';

    const widget = new CalendarWidget('calendar-widget');
    widget.date = new Date(2026, 7, 24);
    widget.init();

    // Select Aug 27 (an open date)
    const day27 = document.querySelector('[data-day="27"]');
    expect(day27).not.toBeNull();
    day27.click();

    expect(document.querySelector('.day-empty-state')).not.toBeNull();
    expect(document.body.textContent).toContain('No Reminders or Events');
    expect(document.querySelector('.empty-action-btn.add-reminder-btn')).not.toBeNull();
    expect(document.querySelector('.empty-action-btn.book-consult-btn')).not.toBeNull();
    expect(document.querySelector('.empty-action-btn.show-all-btn')).not.toBeNull();
  });

  it('fetches live Google Calendar availability and updates event dots and reminder state', async () => {
    const slots = [
      {
        start: '2026-08-26T14:00:00.000Z',
        end: '2026-08-26T14:30:00.000Z',
        timeZone: 'America/New_York',
      },
      {
        start: '2026-08-27T16:00:00.000Z',
        end: '2026-08-27T16:30:00.000Z',
        timeZone: 'America/New_York',
      },
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              success: true,
              status: 'live',
              slots,
              providers: ['google', 'apple'],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
      )
    );

    const { CalendarWidget } = await import('../../src/js/modules/calendar.js');
    document.body.innerHTML = '<div id="calendar-widget"></div>';

    const widget = new CalendarWidget('calendar-widget');
    widget.date = new Date(2026, 7, 24);
    widget.init();

    await vi.waitFor(() => {
      expect(document.body.textContent).toContain('2 Free Slots');
    });

    const day26 = document.querySelector('[data-date-key="2026-08-26"]');
    expect(day26).not.toBeNull();
    expect(day26.classList.contains('has-event')).toBe(true);
  });

  it('navigates months with previous, next, and today buttons', async () => {
    const { CalendarWidget } = await import('../../src/js/modules/calendar.js');
    document.body.innerHTML = '<div id="calendar-widget"></div>';

    const widget = new CalendarWidget('calendar-widget');
    widget.init();

    const initialMonth = document.querySelector('.current-month').textContent;
    const initialYear = document.querySelector('.current-year').textContent;

    // Click next month
    document.querySelector('.ios-actions button:last-child').click();
    const nextMonth = document.querySelector('.current-month').textContent;
    expect(nextMonth).not.toBe('');

    // Click previous month
    document.querySelector('.ios-actions button:first-child').click();
    expect(document.querySelector('.current-month').textContent).toBe(initialMonth);
    expect(document.querySelector('.current-year').textContent).toBe(initialYear);

    // Click today button
    document.querySelector('.today-btn').click();
    expect(document.querySelector('.current-month').textContent).toBe(initialMonth);
  });

  it('selects a day cell on click', async () => {
    const { CalendarWidget } = await import('../../src/js/modules/calendar.js');
    document.body.innerHTML = '<div id="calendar-widget"></div>';

    const widget = new CalendarWidget('calendar-widget');
    widget.init();

    const dayCells = document.querySelectorAll('.day-cell:not(.empty)');
    expect(dayCells.length).toBeGreaterThan(0);

    const firstActiveDay = dayCells[0];
    const dayNum = firstActiveDay.dataset.day;
    firstActiveDay.click();
    const selectedDay = document.querySelector(`[data-day="${dayNum}"]`);
    expect(selectedDay.classList.contains('selected')).toBe(true);
  });

  it('toggles reminder completed state when card or circle is clicked', async () => {
    const { CalendarWidget } = await import('../../src/js/modules/calendar.js');
    document.body.innerHTML = '<div id="calendar-widget"></div>';

    const widget = new CalendarWidget('calendar-widget');
    widget.init();

    // View All to get reminders
    document.querySelector('[data-filter="all"]').click();

    const firstCard = document.querySelector('.reminder-card');
    expect(firstCard.classList.contains('completed')).toBe(false);

    firstCard.click();
    expect(document.querySelector('.reminder-card').classList.contains('completed')).toBe(true);

    document.querySelector('.reminder-card').click();
    expect(document.querySelector('.reminder-card').classList.contains('completed')).toBe(false);
  });

  it('edits a reminder text via prompt', async () => {
    const { CalendarWidget } = await import('../../src/js/modules/calendar.js');
    document.body.innerHTML = '<div id="calendar-widget"></div>';

    vi.spyOn(window, 'prompt').mockReturnValue('Updated Meeting Title');

    const widget = new CalendarWidget('calendar-widget');
    widget.init();

    // View All
    document.querySelector('[data-filter="all"]').click();

    const editBtn = document.querySelector('.edit-btn');
    editBtn.click();

    expect(window.prompt).toHaveBeenCalled();
    expect(document.body.textContent).toContain('Updated Meeting Title');
  });

  it('adds a new reminder when New button is clicked', async () => {
    const { CalendarWidget } = await import('../../src/js/modules/calendar.js');
    document.body.innerHTML = '<div id="calendar-widget"></div>';

    const widget = new CalendarWidget('calendar-widget');
    widget.init();

    const initialLength = widget.reminders.length;
    document.querySelector('.ios-btn-small').click();
    expect(widget.reminders.length).toBe(initialLength + 1);
    expect(document.body.textContent).toContain('New Reminder');
  });

  it('adds confirmed booking dynamically to top of reminders stack', async () => {
    const { CalendarWidget } = await import('../../src/js/modules/calendar.js');
    document.body.innerHTML = '<div id="calendar-widget"></div>';

    const widget = new CalendarWidget('calendar-widget');
    widget.init();

    const initialLength = widget.reminders.length;
    widget.addConfirmedBooking({
      title: 'Consultation: AI Systems Review',
      time: 'Wednesday 2:00 PM',
      tag: 'Google Meet',
    });

    expect(widget.reminders.length).toBe(initialLength + 1);
    expect(document.body.textContent).toContain('Consultation: AI Systems Review');
    expect(document.body.textContent).toContain('Google Meet');
  });

  it('imports live Apple Calendar events and marks event days', async () => {
    const { CalendarWidget } = await import('../../src/js/modules/calendar.js');
    document.body.innerHTML = '<div id="calendar-widget"></div>';

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        status: 'live',
        providers: ['google', 'apple'],
        slots: [{ start: '2026-08-25T14:00:00Z', end: '2026-08-25T14:30:00Z' }],
        events: [
          {
            title: 'Ticket: Cafe Cursor Pune',
            start: '2026-08-29T00:00:00Z',
            end: '2026-08-30T00:00:00Z',
            date: '2026-08-29',
            provider: 'apple',
          },
          {
            title: 'Pune | Claude Code Meetup',
            start: '2026-08-29T10:30:00Z',
            end: '2026-08-29T13:30:00Z',
            date: '2026-08-29',
            provider: 'apple',
          },
        ],
      }),
    });

    const widget = new CalendarWidget('calendar-widget');
    widget.date = new Date(2026, 7, 24); // August 2026
    widget.init();

    // Select Aug 29
    await vi.waitFor(() => {
      const day29 = document.querySelector('[data-day="29"]');
      expect(day29).not.toBeNull();
      expect(day29.classList.contains('has-event')).toBe(true);
    });

    const day29 = document.querySelector('[data-day="29"]');
    day29.click();

    expect(document.body.textContent).toContain('Ticket: Cafe Cursor Pune');
    expect(document.body.textContent).toContain('Pune | Claude Code Meetup');
  });

  it('filters reminders by category tabs and day inspector', async () => {
    const { CalendarWidget } = await import('../../src/js/modules/calendar.js');
    document.body.innerHTML = '<div id="calendar-widget"></div>';

    const widget = new CalendarWidget('calendar-widget');
    widget.date = new Date(2026, 7, 24); // August 2026
    widget.init();

    // Click on Birthdays tab
    const birthdayTab = document.querySelector('[data-filter="birthdays"]');
    expect(birthdayTab).not.toBeNull();
    birthdayTab.click();

    expect(document.body.textContent).toContain("Mangesh's Birthday 🎂");

    // Click on All tab
    const allTab = document.querySelector('[data-filter="all"]');
    allTab.click();
    expect(document.querySelectorAll('.reminder-card').length).toBeGreaterThan(5);

    // Click on a day cell to inspect
    const dayCell = document.querySelector('[data-day="24"]');
    dayCell.click();
    expect(document.querySelector('.day-inspector-banner')).not.toBeNull();

    // Clear day inspector
    const clearBtn = document.querySelector('.day-inspector-clear');
    expect(clearBtn).not.toBeNull();
    clearBtn.click();
    expect(document.querySelector('.day-inspector-banner')).toBeNull();
  });

  it('triggers ask AI and iCal export buttons on reminder cards', async () => {
    const { CalendarWidget } = await import('../../src/js/modules/calendar.js');
    document.body.innerHTML = `
      <div id="chatbot-toggle"></div>
      <input id="chatbot-input" />
      <div id="calendar-widget"></div>
    `;

    const widget = new CalendarWidget('calendar-widget');
    widget.init();

    // View All
    document.querySelector('[data-filter="all"]').click();

    const askAiBtn = document.querySelector('.ask-ai-btn');
    expect(askAiBtn).not.toBeNull();
    askAiBtn.click();

    const icalBtn = document.querySelector('.ical-btn');
    expect(icalBtn).not.toBeNull();
    const spy = vi.spyOn(widget, 'downloadIcsForEvent');
    icalBtn.click();
    expect(spy).toHaveBeenCalled();
  });

  it('triggers Calendly popup when Book Consultation button is clicked', async () => {
    window.Calendly = { initPopupWidget: vi.fn() };
    const { CalendarWidget } = await import('../../src/js/modules/calendar.js');
    document.body.innerHTML = '<div id="calendar-widget"></div>';

    const widget = new CalendarWidget('calendar-widget');
    widget.date = new Date(2026, 7, 24);
    widget.init();

    // Select Aug 27 (an open date to show empty state actions)
    document.querySelector('[data-day="27"]').click();
    const bookBtn = document.querySelector('.empty-action-btn.book-consult-btn');
    expect(bookBtn).not.toBeNull();
    bookBtn.click();
    await vi.waitFor(() => expect(window.Calendly.initPopupWidget).toHaveBeenCalledOnce());
  });

  it('auto initializes on DOMContentLoaded or directly via initCalendarWidget', async () => {
    const { initCalendarWidget } = await import('../../src/js/modules/calendar.js');
    document.body.innerHTML = '<div id="calendar-widget"></div>';

    const instance = initCalendarWidget();
    expect(instance).toBeDefined();
    expect(document.querySelector('.ios-widget-wrapper')).not.toBeNull();
  });
});
