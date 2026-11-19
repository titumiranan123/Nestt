import { describe, expect, it } from 'vitest';
import { dashboardWindow } from './dashboard-period.js';

describe('dashboard reporting periods', () => {
  it('starts today at midnight in Dhaka and compares the same elapsed hours', () => {
    const now = new Date('2026-10-31T18:20:30.125Z');
    const window = dashboardWindow('today', now);

    expect(window.current).toEqual({
      gte: new Date('2026-10-31T18:00:00Z'),
      lt: now,
    });
    expect(window.previous.lt).toEqual(new Date('2026-10-30T18:20:30.125Z'));
    expect(window.buckets).toEqual([
      { key: '2026-11-01T00:00:00', start: new Date('2026-10-31T18:00:00Z') },
    ]);
  });

  it('fills every daily bucket across calendar boundaries', () => {
    const window = dashboardWindow('7d', new Date('2026-11-02T18:20:00Z'));

    expect(window.current.gte).toEqual(new Date('2026-10-27T18:00:00Z'));
    expect(window.previous.gte).toEqual(new Date('2026-10-20T18:00:00Z'));
    expect(window.previous.lt).toEqual(new Date('2026-10-26T18:20:00Z'));
    expect(window.buckets).toHaveLength(7);
    expect(window.buckets.at(-1)?.key).toBe('2026-11-03T00:00:00');
  });

  it('clamps the previous year comparison to February in a leap year', () => {
    const window = dashboardWindow('year', new Date('2028-02-29T00:15:00Z'));

    expect(window.previous.lt).toEqual(new Date('2027-02-28T00:15:00Z'));
    expect(window.buckets.map(({ key }) => key)).toEqual([
      '2028-01-01T00:00:00',
      '2028-02-01T00:00:00',
    ]);
  });
});
