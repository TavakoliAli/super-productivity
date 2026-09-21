import { DateTimeLocale } from '../core/locale.constants';
import { Log } from '../core/log';

export const formatMonthDay = (
  date: Date,
  locale: DateTimeLocale,
  calendar: 'gregorian' | 'jalali' = 'gregorian',
): string => {
  try {
    if (!date || Number.isNaN(date.getTime())) {
      return '';
    }

    const formatted = new Intl.DateTimeFormat(locale, {
      calendar: calendar === 'jalali' ? 'persian' : 'gregory',
      month: 'numeric',
      day: 'numeric',
    }).format(date);

    // Remove zero-padding for consistency across locales.
    return formatted.replace(/\b0+(\d)/g, '$1');
  } catch (error) {
    Log.err(`formatMonthDay failed for locale ${locale}:`, error);

    // Final fallback.
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${day}/${month}`;
  }
};
