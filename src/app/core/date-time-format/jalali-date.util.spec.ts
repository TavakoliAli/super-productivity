import { dateToJalali, getJalaliMonthLength, jalaliToDate } from './jalali-date.util';

describe('jalali-date.util', () => {
  it('converts Gregorian date to Jalaali', () => {
    const date = new Date(2026, 2, 21);

    expect(dateToJalali(date)).toEqual({
      year: 1405,
      month: 1,
      day: 1,
    });
  });

  it('converts Jalaali date to Gregorian', () => {
    const date = jalaliToDate(1405, 1, 1);

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(2);
    expect(date.getDate()).toBe(21);
  });

  it('returns the correct number of days for Jalaali months', () => {
    expect(getJalaliMonthLength(1405, 1)).toBe(31);
    expect(getJalaliMonthLength(1405, 6)).toBe(31);
    expect(getJalaliMonthLength(1405, 7)).toBe(30);
  });

  it('rejects invalid Jalaali dates', () => {
    expect(() => jalaliToDate(1404, 12, 30)).toThrow();
  });
});
