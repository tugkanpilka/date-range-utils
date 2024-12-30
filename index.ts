import {
  startOfDay,
  differenceInCalendarDays,
  addDays,
  getMonth,
} from "date-fns";
import { getISOWeek } from "date-fns";

export interface IDateGenerationStrategy<T> {
  generate(startDate: Date, endDate: Date): T[];
}

export interface IDateGroupingStrategy<T, S> {
  group(dates: T[]): S[];
}

export interface IDateDecorator<T, S> {
  decorate(dates: T[]): S[];
}

export interface DateInfo {
  date: Date;
  weekNumber: number;
  isDummy?: boolean;
}

export interface MonthInfo<T> {
  title: string;
  number: number;
  data: T[];
}

export class StandardDateGenerationStrategy<T extends { date: Date }>
  implements IDateGenerationStrategy<T>
{
  constructor(private readonly dateFactory: (date: Date) => T) {}

  generate(startDate: Date, endDate: Date): T[] {
    const dates: T[] = [];
    const totalDays = differenceInCalendarDays(endDate, startDate) + 1;

    for (let i = 0; i < totalDays; i++) {
      const currentDate = addDays(startDate, i);
      dates.push(this.dateFactory(currentDate));
    }

    return dates;
  }
}

export class MonthGroupingStrategy<T extends { date: Date }>
  implements IDateGroupingStrategy<T, MonthInfo<T>>
{
  group(dates: T[]): MonthInfo<T>[] {
    const monthsMap = new Map<number, MonthInfo<T>>();

    dates.forEach((dateInfo) => {
      const date = dateInfo.date;
      const month = getMonth(date);
      if (!monthsMap.has(month)) {
        monthsMap.set(month, {
          title: date.toLocaleString("default", { month: "long" }),
          number: month + 1,
          data: [],
        });
      }
      monthsMap.get(month)!.data.push(dateInfo);
    });

    return Array.from(monthsMap.values()).sort((a, b) => a.number - b.number);
  }
}

export type WeekNumberDecoration<T> =
  | T
  | { date: Date; isWeekNumberDecoration: true; weekNumber: number };

export class WeekNumberDecorator {
  /**
   * Decorates the date array by adding a `weekNumber` marker
   * at the end of the last date for each distinct week in the array.
   * @param dates Array of objects with a `date` property.
   * @returns Array with week markers inserted at the end of each ISO week.
   */
  decorate<T>(dates: (T & { date: Date })[]): WeekNumberDecoration<T>[] {
    if (dates.length === 0) return [];

    const result: WeekNumberDecoration<T>[] = [];
    let currentWeek = getISOWeek(dates[0].date);

    dates.forEach((dateInfo, index) => {
      const dateWeek = getISOWeek(dateInfo.date);

      // Add week marker if transitioning weeks
      if (dateWeek !== currentWeek) {
        result.push({
          isWeekNumberDecoration: true,
          weekNumber: currentWeek,
          date: dateInfo.date,
        });
        currentWeek = dateWeek; // Update to the new week
      }

      // Push the current date into the result
      result.push(dateInfo);

      // Ensure the last week's marker is always added (last iteration)
      if (index === dates.length - 1) {
        result.push({
          isWeekNumberDecoration: true,
          weekNumber: dateWeek,
          date: dateInfo.date,
        });
      }
    });

    return result;
  }
}

export class DateRange<T extends { date: Date }, S = MonthInfo<T>> {
  private dates: (T | S)[] = [];

  constructor(
    private readonly startDate: Date,
    private readonly endDate: Date,
  ) {
    const start = startOfDay(this.startDate);
    const end = startOfDay(this.endDate);

    if (start > end) {
      throw new Error(
        `ERROR! location: DateRange.ts. \n
        Message: ${start.toLocaleString()} is greater than ${end.toLocaleString()}.`,
      );
    }

    this.startDate = start;
    this.endDate = end;
  }

  create(strategy: IDateGenerationStrategy<T>): this {
    this.dates = strategy.generate(this.startDate, this.endDate);
    return this;
  }

  apply<U extends { date: Date }>(
    decorator: IDateDecorator<T, U>,
  ): DateRange<U, S> {
    const decoratedDates: U[] = decorator.decorate(this.dates as T[]);

    // Explicitly change the type of 'this' to ensure assignment works:
    const updatedDateRange = this as unknown as DateRange<U, S>;
    updatedDateRange.dates = decoratedDates as unknown as (U | S)[];

    return updatedDateRange;
  }

  group(strategy: IDateGroupingStrategy<T, S>): this {
    this.dates = strategy.group(this.dates as T[]);
    return this;
  }

  getDates(): (T | S)[] {
    return this.dates;
  }
}
