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

type WeekNumberDecoration =
  | DateInfo
  | { isWeekNumberDecoration: true; weekNumber: number };

export class WeekNumberDecorator {
  /**
   * Decorates the date array by adding a `weekNumber` marker
   * at the end of the last date for each distinct week in the array.
   * @param dates Array of objects with a `date` property.
   * @returns Array with week markers inserted at the end of each ISO week.
   */
  decorate(dates: DateInfo[]): WeekNumberDecoration[] {
    const result: WeekNumberDecoration[] = [];
    let currentWeek = getISOWeek(dates[0].date); // Initialize with the first week's number

    dates.forEach((dateInfo, index) => {
      const dateWeek = getISOWeek(dateInfo.date);
      const isNewWeek = currentWeek !== dateWeek;

      // Push the current date into the result (always keep original dates)
      result.push(dateInfo);

      // End of the current week OR last date in the array => Add week marker
      if (dateWeek !== currentWeek || isNewWeek || index === dates.length - 1) {
        result.push({
          isWeekNumberDecoration: true,
          weekNumber: currentWeek, // Add current week's marker
        });

        // Update to the next week
        currentWeek = dateWeek;
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

  apply(decorator: IDateDecorator<T, S>): this {
    this.dates = decorator.decorate(this.dates as T[]) as (T | S)[];
    return this;
  }

  group(strategy: IDateGroupingStrategy<T, S>): this {
    this.dates = strategy.group(this.dates as T[]);
    return this;
  }

  getDates(): (T | S)[] {
    return this.dates;
  }
}
