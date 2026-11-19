export const DASHBOARD_TIME_ZONE = 'Asia/Dhaka';
export const dashboardPeriods = ['today', '7d', '30d', 'year'] as const;
export type DashboardPeriod = (typeof dashboardPeriods)[number];

const storeClock = new Intl.DateTimeFormat('en-CA', {
  timeZone: DASHBOARD_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

function storeCalendar(instant: Date) {
  const parts = Object.fromEntries(
    storeClock
      .formatToParts(instant)
      .map(({ type, value }) => [type, Number(value)]),
  );
  return new Date(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
      instant.getUTCMilliseconds(),
    ),
  );
}

function storeInstant(calendar: Date) {
  const wallTime = calendar.getTime();
  return new Date(wallTime - (storeCalendar(calendar).getTime() - wallTime));
}

function shiftDays(date: Date, days: number) {
  const shifted = new Date(date);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted;
}

export function dashboardWindow(period: DashboardPeriod, now = new Date()) {
  const localNow = storeCalendar(now);
  const year = localNow.getUTCFullYear();
  const month = localNow.getUTCMonth();
  const day = localNow.getUTCDate();
  const today = new Date(Date.UTC(year, month, day));
  const days = period === 'today' ? 1 : period === '7d' ? 7 : 30;
  const start =
    period === 'year'
      ? new Date(Date.UTC(year, 0, 1))
      : shiftDays(today, 1 - days);
  const previousStart =
    period === 'year'
      ? new Date(Date.UTC(year - 1, 0, 1))
      : shiftDays(start, -days);
  const previousEnd =
    period === 'year' ? new Date(localNow) : shiftDays(localNow, -days);
  if (period === 'year') {
    const previousMonthEnd = new Date(
      Date.UTC(year - 1, month + 1, 0),
    ).getUTCDate();
    previousEnd.setUTCFullYear(
      year - 1,
      month,
      Math.min(day, previousMonthEnd),
    );
  }

  const granularity =
    period === 'today' ? 'hour' : period === 'year' ? 'month' : 'day';
  return {
    current: { gte: storeInstant(start), lt: now },
    previous: {
      gte: storeInstant(previousStart),
      lt: storeInstant(previousEnd),
    },
    granularity,
    buckets: Array.from(
      {
        length:
          period === 'today'
            ? localNow.getUTCHours() + 1
            : period === 'year'
              ? month + 1
              : days,
      },
      (_, index) => {
        const calendar = new Date(start);
        if (granularity === 'hour') calendar.setUTCHours(index);
        else if (granularity === 'month') calendar.setUTCMonth(index);
        else calendar.setUTCDate(calendar.getUTCDate() + index);
        return {
          key: calendar.toISOString().slice(0, 19),
          start: storeInstant(calendar),
        };
      },
    ),
  };
}
