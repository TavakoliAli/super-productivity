import { TestBed } from '@angular/core/testing';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { CustomDateAdapter } from './custom-date-adapter';
import { DateTimeFormatService } from './date-time-format.service';
import { GlobalConfigService } from '../../features/config/global-config.service';

describe('CustomDateAdapter (Jalali)', () => {
  let adapter: CustomDateAdapter;

  beforeEach(() => {
    const dateTimeFormatServiceMock: Partial<DateTimeFormatService> = {
      isoTextLocale: (() => null) as DateTimeFormatService['isoTextLocale'],
      dateFormat: (() => ({
        raw: 'yyyy/MM/dd',
        humanReadable: 'YYYY/MM/DD',
      })) as DateTimeFormatService['dateFormat'],
      formatDate: () => '',
    };

    TestBed.configureTestingModule({
      providers: [
        CustomDateAdapter,
        { provide: MAT_DATE_LOCALE, useValue: 'fa' },
        {
          provide: DateTimeFormatService,
          useValue: dateTimeFormatServiceMock,
        },
        {
          provide: GlobalConfigService,
          useValue: {
            localization: () => ({
              firstDayOfWeek: 6,
              calendar: 'jalali',
            }),
          },
        },
      ],
    });

    adapter = TestBed.inject(CustomDateAdapter);
    adapter.setLocale('fa');
  });

  it('returns Jalali year, month and day', () => {
    const date = new Date(2026, 2, 21);

    expect(adapter.getYear(date)).toBe(1405);
    expect(adapter.getMonth(date)).toBe(0);
    expect(adapter.getDate(date)).toBe(1);
  });

  it('creates a Gregorian Date from a Jalali date', () => {
    const date = adapter.createDate(1405, 0, 1);

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(2);
    expect(date.getDate()).toBe(21);
  });

  it('returns Jalali month length', () => {
    const farvardin = adapter.createDate(1405, 0, 1);
    const mehr = adapter.createDate(1405, 6, 1);

    expect(adapter.getNumDaysInMonth(farvardin)).toBe(31);
    expect(adapter.getNumDaysInMonth(mehr)).toBe(30);
  });

  it('adds calendar months using the Jalali calendar', () => {
    const date = adapter.createDate(1405, 0, 31);

    const nextMonth = adapter.addCalendarMonths(date, 1);

    expect(adapter.getYear(nextMonth)).toBe(1405);
    expect(adapter.getMonth(nextMonth)).toBe(1);
    expect(adapter.getDate(nextMonth)).toBe(31);
  });

  it('clamps the day when moving to a shorter Jalali month', () => {
    const date = adapter.createDate(1405, 5, 31);

    const nextMonth = adapter.addCalendarMonths(date, 1);

    expect(adapter.getYear(nextMonth)).toBe(1405);
    expect(adapter.getMonth(nextMonth)).toBe(6);
    expect(adapter.getDate(nextMonth)).toBe(30);
  });

  it('adds calendar years using the Jalali calendar', () => {
    const date = adapter.createDate(1404, 0, 1);

    const nextYear = adapter.addCalendarYears(date, 1);

    expect(adapter.getYear(nextYear)).toBe(1405);
    expect(adapter.getMonth(nextYear)).toBe(0);
    expect(adapter.getDate(nextYear)).toBe(1);
  });

  it('handles the Jalali leap year correctly', () => {
    const leapYear = adapter.createDate(1403, 11, 1);
    const nonLeapYear = adapter.createDate(1404, 11, 1);

    expect(adapter.getNumDaysInMonth(leapYear)).toBe(30);
    expect(adapter.getNumDaysInMonth(nonLeapYear)).toBe(29);
  });

  it('parses a valid Jalali date', () => {
    const date = adapter.parse('1405/01/01', 'yyyy/MM/dd');

    expect(date).not.toBeNull();
    expect(date!.getFullYear()).toBe(2026);
    expect(date!.getMonth()).toBe(2);
    expect(date!.getDate()).toBe(21);
  });

  it('rejects an invalid Jalali date', () => {
    expect(adapter.parse('1405/13/01', 'yyyy/MM/dd')).toBeNull();
  });

  it('formats a date using the Jalali calendar', () => {
    const date = new Date(2026, 2, 21);

    expect(adapter.format(date, 'yyyy/MM/dd')).toBe('1405/01/01');
  });

  it('returns Jalali month names', () => {
    expect(adapter.getMonthNames('long')).toEqual([
      'فروردین',
      'اردیبهشت',
      'خرداد',
      'تیر',
      'مرداد',
      'شهریور',
      'مهر',
      'آبان',
      'آذر',
      'دی',
      'بهمن',
      'اسفند',
    ]);
  });

  it('returns the Jalali year name', () => {
    const date = new Date(2026, 2, 21);

    expect(adapter.getYearName(date)).toBe('1405');
  });

  it('returns Jalali date names', () => {
    expect(adapter.getDateNames()).toEqual(
      Array.from({ length: 31 }, (_, index) => String(index + 1)),
    );
  });

  it('keeps the Gregorian day of week for Jalali dates', () => {
    const date = adapter.createDate(1405, 0, 1);

    expect(adapter.getDayOfWeek(date)).toBe(6);
  });

  it('adds calendar days correctly in Jalali calendar', () => {
    const date = adapter.createDate(1405, 0, 31);

    const nextDay = adapter.addCalendarDays(date, 1);

    expect(adapter.getYear(nextDay)).toBe(1405);
    expect(adapter.getMonth(nextDay)).toBe(1);
    expect(adapter.getDate(nextDay)).toBe(1);
  });

  it('adds calendar days across the Jalali year boundary', () => {
    const date = adapter.createDate(1404, 11, 29);

    const nextDay = adapter.addCalendarDays(date, 1);

    expect(adapter.getYear(nextDay)).toBe(1405);
    expect(adapter.getMonth(nextDay)).toBe(0);
    expect(adapter.getDate(nextDay)).toBe(1);
  });

  it('uses the configured first day of week', () => {
    expect(adapter.getFirstDayOfWeek()).toBe(6);
  });

  it('formats Jalali dates with different numeric separators', () => {
    const date = new Date(2026, 2, 21);

    expect(adapter.format(date, 'yyyy/MM/dd')).toBe('1405/01/01');
    expect(adapter.format(date, 'yyyy-MM-dd')).toBe('1405-01-01');
  });

  it('formats Jalali dates with Intl date format options', () => {
    const date = new Date(2026, 2, 21);

    expect(
      adapter.format(date, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    ).toContain('1405');
  });
});
