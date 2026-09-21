import { inject, Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DateTimeFormatService } from '../../core/date-time-format/date-time-format.service';
import { Log } from '../../core/log';
import { DEFAULT_LOCALE } from '../../core/locale.constants';
import { GlobalConfigService } from '../../features/config/global-config.service';
import { dateToJalali } from '../../core/date-time-format/jalali-date.util';

// Module-scoped: Angular creates one pure-pipe instance per binding per
// embedded view, so per-instance state would warn once per row, not once.
// DEFAULT_LOCALE ('en-gb') resolves to the 'en' data registered statically
// at bootstrap, so the fallback pipe never depends on lazy locale registration.
const FALLBACK_DATE_PIPE = new DatePipe(DEFAULT_LOCALE);
const WARNED_LOCALES = new Set<string>();

/**
 * Custom date pipe that respects the user's configured locale and calendar.
 */
@Pipe({
  name: 'localeDate',
  standalone: true,
})
export class LocaleDatePipe implements PipeTransform {
  private _dateTimeFormatService = inject(DateTimeFormatService);
  private _globalConfigService = inject(GlobalConfigService);
  private _datePipe: DatePipe | null = null;
  private _lastLocale: string | undefined;

  transform(
    value: Date | string | number | null | undefined,
    format?: string,
    timezone?: string,
    locale?: string,
  ): string | null {
    const effectiveLocale = locale || this._dateTimeFormatService.currentLocale();

    if (!this._datePipe || this._lastLocale !== effectiveLocale) {
      this._datePipe = new DatePipe(effectiveLocale);
      this._lastLocale = effectiveLocale;
    }

    if (value == null || (typeof value === 'number' && !Number.isFinite(value))) {
      return null;
    }

    try {
      if (this._globalConfigService.localization()?.calendar === 'jalali') {
        const date = value instanceof Date ? value : new Date(value);

        if (!Number.isNaN(date.getTime())) {
          const jalali = dateToJalali(date);

          if (format === 'yyyy/MM/dd') {
            return (
              `${jalali.year}/` +
              `${String(jalali.month).padStart(2, '0')}/` +
              `${String(jalali.day).padStart(2, '0')}`
            );
          }

          if (!format || format === 'shortDate') {
            return new Intl.DateTimeFormat(effectiveLocale, {
              calendar: 'persian',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              ...(timezone ? { timeZone: timezone } : {}),
            }).format(date);
          }

          if (format === 'mediumDate' || format === 'longDate') {
            return new Intl.DateTimeFormat(effectiveLocale, {
              calendar: 'persian',
              year: 'numeric',
              month: format === 'longDate' ? 'long' : 'short',
              day: 'numeric',
              ...(timezone ? { timeZone: timezone } : {}),
            }).format(date);
          }
        }
      }

      return this._datePipe.transform(value, format, timezone, effectiveLocale);
    } catch {
      let fallback: string | null;

      try {
        fallback = FALLBACK_DATE_PIPE.transform(value, format, timezone, DEFAULT_LOCALE);
      } catch {
        return null;
      }

      if (!WARNED_LOCALES.has(effectiveLocale)) {
        WARNED_LOCALES.add(effectiveLocale);
        Log.warn(
          `LocaleDatePipe: cannot format with locale "${effectiveLocale}", ` +
            `using "${DEFAULT_LOCALE}"`,
        );
      }

      return fallback;
    }
  }
}
