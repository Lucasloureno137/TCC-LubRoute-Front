import { MatDateFormats, NativeDateAdapter } from '@angular/material/core';
import { Injectable } from '@angular/core';

@Injectable()
export class CustomDateAdapter extends NativeDateAdapter {
  override parse(value: any): Date | null {
    if ((typeof value === 'string') && (value.indexOf('/') > -1)) {
      const str = value.split('/');
      const year = Number(str[2]);
      const month = Number(str[1]) - 1;
      const date = Number(str[0]);
      return new Date(year, month, date);
    }
    const timestamp = typeof value === 'number' ? value : Date.parse(value);
    return isNaN(timestamp) ? null : new Date(timestamp);
  }

  override format(date: Date, displayFormat: Object): string {
    // use the adapter locale when available, fallback to pt-BR
    const locale = (this.locale as string) || 'pt-BR';

    // input (dd/MM/yyyy)
    if (displayFormat === 'input') {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }

    // month + year label (e.g. "out 2025" / "out. 2025")
    if (displayFormat === 'monthYearLabel') {
      return new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }).format(date);
    }

    // accessibility long date (e.g. "quinta-feira, 23 de outubro de 2025")
    if (displayFormat === 'dateA11yLabel') {
      return new Intl.DateTimeFormat(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(date);
    }

    // accessibility month year label (e.g. "outubro 2025")
    if (displayFormat === 'monthYearA11yLabel') {
      return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date);
    }

    // default fallback: localized short weekday + date
    return new Intl.DateTimeFormat(locale, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }).format(date);
  }
}

export const CUSTOM_DATE_FORMATS: MatDateFormats = {
  parse: {
    dateInput: ['DD/MM/YYYY'],
  },
  display: {
    dateInput: 'input',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};
