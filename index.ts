import {
	startOfDay,
	differenceInCalendarDays,
	addDays,
	getMonth,
} from "date-fns";

export interface IDateGenerationStrategy<T> {
	generate(startDate: Date, endDate: Date): T[];
}

export interface IDateGroupingStrategy<T, S> {
	group(dates: T[]): S[];
}

export interface IDateDecorator<T> {
	decorate(dates: T[]): T[];
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
	
	apply(decorator: IDateDecorator<T>): this {
		this.dates = decorator.decorate(this.dates as T[]);
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
