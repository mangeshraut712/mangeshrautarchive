import { beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Apple-style Calendar and Smart Reminders Widget', () => {
  it('renders the month calendar, weekdays, and smart reminders list', async () => {
    const { CalendarWidget } = await import('../../src/js/modules/calendar.js');
    document.body.innerHTML = '<div id="calendar-widget"></div>';

    const widget = new CalendarWidget('calendar-widget');
    widget.init();

    expect(document.querySelector('.ios-calendar-section')).not.toBeNull();
    expect(document.querySelector('.ios-weekdays')).not.toBeNull();
    expect(document.querySelectorAll('.day-cell')).toBeDefined();
    expect(document.querySelector('.ios-reminders-section')).not.toBeNull();
    expect(document.querySelector('.reminders-title').textContent).toContain('Smart Reminders');
    expect(document.querySelectorAll('.reminder-card')).toHaveLength(4);
    expect(document.body.textContent).toContain("Mangesh's Birthday 🎂");
    expect(document.body.textContent).toContain('Review Portfolio Design');
    expect(document.body.textContent).toContain('Email Mangesh');
    expect(document.body.textContent).toContain('AI Model Training');
    expect(document.querySelector('.calendly-panel')).not.toBeNull();
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
    firstActiveDay.click();
    expect(firstActiveDay.classList.contains('selected')).toBe(true);
  });

  it('toggles reminder completed state when card is clicked', async () => {
    const { CalendarWidget } = await import('../../src/js/modules/calendar.js');
    document.body.innerHTML = '<div id="calendar-widget"></div>';

    const widget = new CalendarWidget('calendar-widget');
    widget.init();

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

    expect(document.querySelectorAll('.reminder-card')).toHaveLength(4);

    document.querySelector('.ios-btn-small').click();
    expect(document.querySelectorAll('.reminder-card')).toHaveLength(5);
    expect(document.body.textContent).toContain('New Reminder');
  });

  it('triggers Calendly popup when Calendly button is clicked', async () => {
    window.Calendly = { initPopupWidget: vi.fn() };
    const { CalendarWidget } = await import('../../src/js/modules/calendar.js');
    document.body.innerHTML = '<div id="calendar-widget"></div>';

    const widget = new CalendarWidget('calendar-widget');
    widget.init();

    document.querySelector('.calendly-panel-button').click();
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
