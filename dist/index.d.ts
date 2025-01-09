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
export declare class StandardDateGenerationStrategy<T extends {
    date: Date;
}> implements IDateGenerationStrategy<T> {
    private readonly dateFactory;
    constructor(dateFactory: (date: Date) => T);
    generate(startDate: Date, endDate: Date): T[];
}
export declare class MonthGroupingStrategy<T extends {
    date: Date;
}> implements IDateGroupingStrategy<T, MonthInfo<T>> {
    group(dates: T[]): MonthInfo<T>[];
}
export type WeekNumberDecoration<T> = T | {
    date: Date;
    isWeekNumberDecoration: true;
    weekNumber: number;
    isMultiMonth: boolean;
};
export declare class WeekNumberDecorator {
    /**
     * Decorates the date array by adding a `weekNumber` marker
     * at the end of each week. The marker is always added in the month
     * of the last day of the week.
     * @param dates Array of objects with a `date` property.
     * @returns Array with week markers inserted at the end of each ISO week.
     */
    decorate<T>(dates: (T & {
        date: Date;
    })[]): WeekNumberDecoration<T>[];
}
export declare function isWeekNumberDecoration<T extends object>(date: T | WeekNumberDecoration<T>): date is Extract<WeekNumberDecoration<T>, {
    isWeekNumberDecoration: true;
    isMultiMonth: boolean;
}>;
export declare class DateRange<T extends {
    date: Date;
}, S = MonthInfo<T>> {
    private readonly startDate;
    private readonly endDate;
    private dates;
    constructor(startDate: Date, endDate: Date);
    create(strategy: IDateGenerationStrategy<T>): this;
    apply<U extends {
        date: Date;
    }>(decorator: IDateDecorator<T, U>): DateRange<U, S>;
    group(strategy: IDateGroupingStrategy<T, S>): this;
    getDates(): (T | S)[];
}
