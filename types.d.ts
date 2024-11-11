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