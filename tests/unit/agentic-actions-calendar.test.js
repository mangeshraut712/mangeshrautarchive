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
});
