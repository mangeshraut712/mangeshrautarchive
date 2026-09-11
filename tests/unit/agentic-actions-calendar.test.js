import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AgenticActionHandler } from '../../src/js/modules/agentic-actions.js';

describe('agentic Calendar actions', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <section id="contact">
        <div id="calendar-widget">
          <button type="button" data-calendar-slot="0">Available slot</button>
        </div>
      </section>`;
    Element.prototype.scrollIntoView = vi.fn();
    window.Calendly = { initPopupWidget: vi.fn() };
  });

  it('opens the portfolio live Calendar instead of launching Calendly', async () => {
    const handler = new AgenticActionHandler();

    const result = await handler.scheduleMeeting();

    expect(result).toMatchObject({ success: true, action: 'schedule_meeting' });
    expect(result.message).toContain('live Google Calendar');
    expect(window.Calendly.initPopupWidget).not.toHaveBeenCalled();
    expect(document.querySelector('#contact').scrollIntoView).toHaveBeenCalled();
    expect(document.activeElement).toBe(document.querySelector('[data-calendar-slot]'));
  });

  it('adds a calendar reminder with natural language parsing via agentic action', async () => {
    const handler = new AgenticActionHandler();
    window.calendarWidget = {
      addNewReminder: vi.fn().mockReturnValue({
        text: 'Review PR',
        time: 'Tomorrow · 3:00 PM',
        tag: 'Urgent',
      }),
    };

    const result = await handler.addCalendarReminder([null, 'Review PR tomorrow at 3pm #urgent']);

    expect(result.success).toBe(true);
    expect(result.action).toBe('add_calendar_reminder');
    expect(result.message).toContain('Review PR');
    expect(window.calendarWidget.addNewReminder).toHaveBeenCalledWith(
      'Review PR tomorrow at 3pm #urgent'
    );
  });

  it('queries calendar events via agentic action', async () => {
    const handler = new AgenticActionHandler();
    window.calendarWidget = {
      reminders: [
        {
          text: 'GDG DevFest Pune',
          time: 'Sep 12 · 9:00 AM',
          tag: 'GDG Pune',
          isLuma: true,
          lumaStatus: 'going',
        },
      ],
    };

    const result = await handler.getCalendarEvents([null, 'luma']);

    expect(result.success).toBe(true);
    expect(result.action).toBe('get_calendar_events');
    expect(result.message).toContain('GDG DevFest Pune');
    expect(result.message).toContain('going');
  });

  it('filters calendar view tabs via agentic action', async () => {
    const handler = new AgenticActionHandler();
    window.calendarWidget = {
      activeFilter: 'day',
      render: vi.fn(),
    };

    const result = await handler.filterCalendarView([null, 'luma']);

    expect(result.success).toBe(true);
    expect(result.action).toBe('filter_calendar_view');
    expect(window.calendarWidget.activeFilter).toBe('luma');
    expect(window.calendarWidget.render).toHaveBeenCalled();
  });

  it('detects natural language intent regex for calendar reminder creation', async () => {
    const handler = new AgenticActionHandler();
    window.calendarWidget = {
      addNewReminder: vi.fn().mockReturnValue({
        text: 'Deploy production release',
        time: 'Sep 15 · 3:00 PM',
        tag: 'QA',
      }),
    };

    const detected = await handler.detectAndExecute(
      'remind me to Deploy production release on Sep 15 at 3pm #urgent'
    );
    expect(detected.actionDetected).toBe(true);
    expect(detected.actionName).toBe('add_calendar_reminder');
  });
});
