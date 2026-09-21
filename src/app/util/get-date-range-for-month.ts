import { jalaliToDate } from '../core/date-time-format/jalali-date.util';

export const getDateRangeForMonth = (
  year: number,
  monthIN: number,
): { rangeStart: Date; rangeEnd: Date } => {
  // This utility receives Gregorian calendar values.
  // Jalali month ranges are handled by getDateRangeForJalaliMonth().
  const month = +monthIN;

  const rangeStart = new Date(year, month - 1, 1);
  const rangeEnd = new Date(year, month, 0);

  rangeEnd.setHours(23, 59, 59);

  return {
    rangeStart,
    rangeEnd,
  };
};

export const getDateRangeForJalaliMonth = (
  year: number,
  month: number,
): { rangeStart: Date; rangeEnd: Date } => {
  const rangeStart = jalaliToDate(year, month, 1);
  const nextMonth =
    month === 12 ? jalaliToDate(year + 1, 1, 1) : jalaliToDate(year, month + 1, 1);

  const rangeEnd = new Date(nextMonth);
  rangeEnd.setMilliseconds(-1);

  return {
    rangeStart,
    rangeEnd,
  };
};
