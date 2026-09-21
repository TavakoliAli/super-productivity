import { inject, Pipe, PipeTransform } from '@angular/core';
import { isDBDateStr } from '../../util/get-db-date-str';
import { dateStrToUtcDate } from '../../util/date-str-to-utc-date';
import { formatMonthDay } from '../../util/format-month-day.util';
import { DateTimeFormatService } from '../../core/date-time-format/date-time-format.service';
import { GlobalConfigService } from '../../features/config/global-config.service';

@Pipe({ name: 'shortDate2' })
export class ShortDate2Pipe implements PipeTransform {
  private _dateTimeFormatService = inject(DateTimeFormatService);
  private _globalConfigService = inject(GlobalConfigService);

  transform(value?: number | string | null, ...args: unknown[]): string | null {
    if (typeof value !== 'number' && typeof value !== 'string') {
      return null;
    }

    const date =
      typeof value === 'string' && isDBDateStr(value)
        ? dateStrToUtcDate(value)
        : new Date(value);

    // Use the configured locale if available, otherwise fall back to default
    const locale = this._dateTimeFormatService.currentLocale();
    return formatMonthDay(
      date,
      locale,
      this._globalConfigService.localization()?.calendar ?? 'gregorian',
    );
  }
}
