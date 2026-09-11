import { describe, expect, it, vi } from 'vitest';
import { LUMA_CALENDARS_URL, LUMA_BASE_URL, openLumaCalendar } from '../../src/js/utils/luma.js';

describe('Luma Calendar Utility', () => {
  it('exports canonical Luma URLs', () => {
    expect(LUMA_CALENDARS_URL).toBe('https://luma.com/home/calendars');
    expect(LUMA_BASE_URL).toBe('https://lu.ma');
  });

  it('safely opens Luma Calendar in a new tab with noopener', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    openLumaCalendar();
    expect(openSpy).toHaveBeenCalledWith(
      'https://luma.com/home/calendars',
      '_blank',
      'noopener,noreferrer'
    );

    openLumaCalendar('https://lu.ma/mangeshraut');
    expect(openSpy).toHaveBeenCalledWith(
      'https://lu.ma/mangeshraut',
      '_blank',
      'noopener,noreferrer'
    );

    openSpy.mockRestore();
  });
});
