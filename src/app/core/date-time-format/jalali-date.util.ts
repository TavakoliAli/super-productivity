import {
  jalaaliMonthLength,
  jalaaliToDateObject,
  toJalaali,
  isValidJalaaliDate,
} from 'jalaali-js';

export interface JalaliDate {
  year: number;
  month: number;
  day: number;
}

export const dateToJalali = (date: Date): JalaliDate => {
  const result = toJalaali(date);

  return {
    year: result.jy,
    month: result.jm,
    day: result.jd,
  };
};

export const jalaliToDate = (year: number, month: number, day: number): Date => {
  if (!isValidJalaaliDate(year, month, day)) {
    throw new Error(`Invalid Jalaali date: ${year}/${month}/${day}`);
  }

  return jalaaliToDateObject(year, month, day);
};

export const getJalaliMonthLength = (year: number, month: number): number => {
  return jalaaliMonthLength(year, month);
};
