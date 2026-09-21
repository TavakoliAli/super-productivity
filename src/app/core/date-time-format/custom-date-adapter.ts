import { Injectable, inject, Injector } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';
import { DateTimeFormatService } from './date-time-format.service';
import { DEFAULT_FIRST_DAY_OF_WEEK } from 'src/app/core/locale.constants';
import { GlobalConfigService } from '../../features/config/global-config.service';
import { dateToJalali, jalaliToDate, getJalaliMonthLength } from './jalali-date.util';

/** Custom DateAdapter that handles locale-aware date parsing and formatting */
@Injectable({ providedIn: 'root' })
export class CustomDateAdapter extends NativeDateAdapter {
  private readonly _globalConfigService = inject(GlobalConfigService);

  private get _calendar(): 'gregorian' | 'jalali' {
    return this._globalConfigService.localization()?.calendar ?? 'gregorian';
  }

  override getYear(date: Date): number {
    if (this._calendar === 'jalali') {
      return dateToJalali(date).year;
    }

    return super.getYear(date);
  }

  override getMonth(date: Date): number {
    if (this._calendar === 'jalali') {
      return dateToJalali(date).month - 1;
    }

    return super.getMonth(date);
  }

  override getDate(date: Date): number {
    if (this._calendar === 'jalali') {
      return dateToJalali(date).day;
    }

    return super.getDate(date);
  }

  override createDate(year: number, month: number, date: number): Date {
    if (this._calendar === 'jalali') {
      return jalaliToDate(year, month + 1, date);
    }

    return super.createDate(year, month, date);
  }

  override getNumDaysInMonth(date: Date): number {
    if (this._calendar === 'jalali') {
      const jalaliDate = dateToJalali(date);

      return getJalaliMonthLength(jalaliDate.year, jalaliDate.month);
    }

    return super.getNumDaysInMonth(date);
  }

  override addCalendarMonths(date: Date, months: number): Date {
    if (this._calendar === 'jalali') {
      const jalaliDate = dateToJalali(date);
      const yearMonths = jalaliDate.year * 12;
      const monthIndex = jalaliDate.month - 1;
      const monthOffset = monthIndex + months;
      const totalMonths = yearMonths + monthOffset;
      const year = Math.floor(totalMonths / 12);
      const month = (totalMonths % 12) + 1;
      const day = Math.min(jalaliDate.day, getJalaliMonthLength(year, month));
      return jalaliToDate(year, month, day);
    }

    return super.addCalendarMonths(date, months);
  }

  override addCalendarYears(date: Date, years: number): Date {
    if (this._calendar === 'jalali') {
      const jalaliDate = dateToJalali(date);

      const year = jalaliDate.year + years;
      const day = Math.min(jalaliDate.day, getJalaliMonthLength(year, jalaliDate.month));

      return jalaliToDate(year, jalaliDate.month, day);
    }

    return super.addCalendarYears(date, years);
  }

  override addCalendarDays(date: Date, days: number): Date {
    if (this._calendar === 'jalali') {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    }

    return super.addCalendarDays(date, days);
  }

  // Use a getter to avoid circular dependency issues with DateTimeFormatService
  private readonly _injector = inject(Injector);
  private get _dateTimeFormatService(): DateTimeFormatService {
    return this._injector.get(DateTimeFormatService);
  }

  override getFirstDayOfWeek(): number {
    const cfgValue = this._globalConfigService.localization()?.firstDayOfWeek;

    // If not set or reset - use Monday as default (ISO 8601 standard)
    // Note: Must use explicit null/undefined check since 0 (Sunday) is a valid value
    if (cfgValue === null || cfgValue === undefined) return DEFAULT_FIRST_DAY_OF_WEEK;

    // Default should be monday, if we have an invalid value for some reason
    return cfgValue >= 0 ? cfgValue : DEFAULT_FIRST_DAY_OF_WEEK;
  }

  override parse(value: any, format: string): Date | null {
    if (!value) return null;
    if (value instanceof Date) return this.isValid(value) ? value : null;
    if (typeof value !== 'string') return super.parse(value, format);

    if (this._calendar === 'jalali') {
      return this._parseJalaliDate(value);
    }

    // Parse using locale-aware Gregorian format
    const parsed = this._dateTimeFormatService.parseStringToDate(
      value,
      this._dateTimeFormatService.dateFormat().raw,
    );

    return parsed !== null ? parsed : super.parse(value, format);
  }

  private _parseJalaliDate(value: string): Date | null {
    const format = this._dateTimeFormatService.dateFormat().raw;

    const separator = format.includes('/') ? '/' : format.includes('-') ? '-' : '.';

    const formatParts = format.split(separator);
    const dateParts = value
      .trim()
      .split(separator)
      .filter((part) => part.trim() !== '');

    if (formatParts.length !== 3 || dateParts.length !== 3) {
      return null;
    }

    const values: Record<string, number> = {};

    formatParts.forEach((formatPart, index) => {
      const key = formatPart
        .trim()
        .toLowerCase()
        .replace(/[^\w]+/g, '');

      const parsedValue = Number.parseInt(dateParts[index].trim(), 10);

      if (!Number.isNaN(parsedValue)) {
        values[key] = parsedValue;
      }
    });

    const year = values['yyyy'];
    const month = values['mm'];
    const day = values['dd'];

    if (year === undefined || month === undefined || day === undefined) {
      return null;
    }

    try {
      const date = jalaliToDate(year, month, day);
      return this.isValid(date) ? date : null;
    } catch {
      return null;
    }
  }

  override format(
    date: Date,
    displayFormat: Intl.DateTimeFormatOptions | string,
  ): string {
    if (!this.isValid(date)) {
      throw Error('DateAdapter: Cannot format invalid date.');
    }

    if (this._calendar === 'jalali') {
      return this._formatJalaliDate(date, displayFormat);
    }

    // locale-specific format
    const localeSpecificFormat = this._dateTimeFormatService.dateFormat().raw;
    if (displayFormat === localeSpecificFormat) {
      return this._dateTimeFormatService.formatDate(date);
    }

    // Spelled-out month/weekday labels (e.g. the calendar's "July 2026" header)
    // follow the UI language when the ISO 8601 option is active. Numeric and
    // time-only formats keep the configured locale, so ISO stays YYYY-MM-DD and
    // the 24h clock is preserved (#8987 follow-up).
    if (this._hasSpelledOutName(displayFormat)) {
      return this._withTextLocale(() => super.format(date, displayFormat));
    }

    // For other formats, use default
    return super.format(date, displayFormat);
  }

  // Calendar weekday header row ('M T W ...'). Localized to the UI language for
  // the ISO 8601 option; unchanged for every other locale.
  override getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): string[] {
    return this._withTextLocale(() => super.getDayOfWeekNames(style));
  }

  // Month names shown in the calendar's year view.
  override getMonthNames(style: 'long' | 'short' | 'narrow'): string[] {
    if (this._calendar === 'jalali') {
      return this._getJalaliMonthNames(style);
    }

    return this._withTextLocale(() => super.getMonthNames(style));
  }

  private _getJalaliMonthNames(style: 'long' | 'short' | 'narrow'): string[] {
    const monthNames = [
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
    ];

    if (style === 'long') {
      return monthNames;
    }

    return monthNames.map((name) => name.slice(0, 3));
  }

  override getYearName(date: Date): string {
    if (this._calendar === 'jalali') {
      return String(dateToJalali(date).year);
    }

    return super.getYearName(date);
  }

  override getDateNames(): string[] {
    if (this._calendar === 'jalali') {
      return Array.from({ length: 31 }, (_, index) => String(index + 1));
    }

    return super.getDateNames();
  }

  /**
   * Run `fn` with the adapter locale temporarily swapped to the ISO text locale
   * (the UI language, exposed only when the ISO 8601 option is selected). When
   * no ISO text locale is set the callback runs unchanged. Direct field
   * assignment is used instead of `setLocale()` so no `localeChanges` event
   * fires during the swap.
   */
  private _withTextLocale<T>(fn: () => T): T {
    const textLocale = this._dateTimeFormatService.isoTextLocale();
    if (!textLocale) return fn();

    const prevLocale = this.locale;
    this.locale = textLocale;
    try {
      return fn();
    } finally {
      this.locale = prevLocale;
    }
  }

  private _hasSpelledOutName(
    displayFormat: Intl.DateTimeFormatOptions | string,
  ): boolean {
    if (typeof displayFormat === 'string') return false;
    const spelledOut = ['long', 'short', 'narrow'];
    return (
      spelledOut.includes(displayFormat.weekday as string) ||
      spelledOut.includes(displayFormat.month as string)
    );
  }

  private _formatJalaliDate(
    date: Date,
    displayFormat: Intl.DateTimeFormatOptions | string,
  ): string {
    const jalaliDate = dateToJalali(date);

    if (typeof displayFormat === 'string') {
      const separator = displayFormat.includes('-')
        ? '-'
        : displayFormat.includes('.')
          ? '.'
          : '/';

      if (
        displayFormat === 'yyyy/MM/dd' ||
        displayFormat === 'yyyy-MM-dd' ||
        displayFormat === 'yyyy.MM.dd'
      ) {
        return (
          `${jalaliDate.year}${separator}` +
          `${String(jalaliDate.month).padStart(2, '0')}${separator}` +
          `${String(jalaliDate.day).padStart(2, '0')}`
        );
      }
    }

    if (typeof displayFormat === 'object') {
      return new Intl.DateTimeFormat(this.locale, {
        ...displayFormat,
        calendar: 'persian',
        numberingSystem: 'latn',
      }).format(date);
    }

    return new Intl.DateTimeFormat(this.locale, {
      calendar: 'persian',
      numberingSystem: 'latn',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }
}
