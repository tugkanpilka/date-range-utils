import { getISOWeek } from "date-fns";
import {
  DateRange,
  StandardDateGenerationStrategy,
  MonthGroupingStrategy,
  WeekNumberDecorator,
  DateInfo,
  MonthInfo,
  WeekNumberDecoration,
} from "./index";

describe("StandardDateGenerationStrategy Tests", () => {
  it("should generate dates inclusively between two dates", () => {
    const startDate = new Date(2023, 0, 1); // January 1, 2023
    const endDate = new Date(2023, 0, 5); // January 5, 2023
    const strategy = new StandardDateGenerationStrategy((date) => ({ date }));

    const dates = strategy.generate(startDate, endDate);

    expect(dates.length).toBe(5); // Includes both start and end dates
    expect(dates[0].date).toStrictEqual(startDate);
    expect(dates[4].date).toStrictEqual(endDate);
  });

  it("should handle single-day ranges", () => {
    const singleDate = new Date(2023, 0, 1);
    const strategy = new StandardDateGenerationStrategy((date) => ({ date }));

    const dates = strategy.generate(singleDate, singleDate);

    expect(dates.length).toBe(1);
    expect(dates[0].date).toStrictEqual(singleDate);
  });

  it("should correctly use a custom factory function", () => {
    const startDate = new Date(2023, 0, 1);
    const endDate = new Date(2023, 0, 3);
    const strategy = new StandardDateGenerationStrategy((date) => ({
      date,
      custom: true,
    }));

    const dates = strategy.generate(startDate, endDate);

    dates.forEach((dateInfo) => {
      expect(dateInfo.custom).toBe(true);
    });
  });
});

describe("MonthGroupingStrategy Tests", () => {
  it("should group dates correctly by month", () => {
    const dates = [
      { date: new Date(2023, 0, 1) }, // Jan
      { date: new Date(2023, 0, 15) }, // Jan
      { date: new Date(2023, 1, 1) }, // Feb
      { date: new Date(2023, 2, 1) }, // Mar
    ];
    const strategy = new MonthGroupingStrategy();

    const grouped = strategy.group(dates);

    expect(grouped.length).toBe(3); // Jan, Feb, Mar
    expect(grouped[0].title).toBe("January");
    expect(grouped[0].data.length).toBe(2); // Two entries in January
    expect(grouped[2].number).toBe(3); // March is the third group
  });

  it("should handle an empty list of dates", () => {
    const strategy = new MonthGroupingStrategy();
    const grouped = strategy.group([]);

    expect(grouped).toHaveLength(0); // No groups should be created
  });

  it("should handle dates within a single month", () => {
    const dates = [
      { date: new Date(2023, 0, 1) },
      { date: new Date(2023, 0, 31) },
    ];
    const strategy = new MonthGroupingStrategy();

    const grouped = strategy.group(dates);

    expect(grouped.length).toBe(1); // Only January
    expect(grouped[0].data.length).toBe(2); // Two dates in January
  });
});

describe("WeekNumberDecorator Tests", () => {
  let decorator: WeekNumberDecorator;

  beforeEach(() => {
    decorator = new WeekNumberDecorator();
  });

  it("should add week markers for each ISO week", () => {
    const dates: DateInfo[] = [
      { date: new Date(2024, 0, 1), weekNumber: 1 }, // Week 1
      { date: new Date(2024, 0, 7), weekNumber: 1 }, // Week 1
      { date: new Date(2024, 0, 8), weekNumber: 2 }, // Week 2
    ];

    const result = decorator.decorate(dates);

    expect(result).toHaveLength(5); // 3 dates + 2 markers
    expect(result[2]).toMatchObject({
      weekNumber: 1,
      isWeekNumberDecoration: true,
    });
    expect(result[4]).toMatchObject({
      weekNumber: 2,
      isWeekNumberDecoration: true,
    });
  });

  it("should handle sparse weekly entries", () => {
    const dates: DateInfo[] = [
      { date: new Date(2023, 11, 25), weekNumber: 52 }, // Week 52
      { date: new Date(2024, 0, 1), weekNumber: 1 }, // Week 1 (new year)
    ];

    const result = decorator.decorate(dates);

    expect(result).toHaveLength(4); // 2 dates + 2 markers
    expect(result[1]).toMatchObject({
      weekNumber: 52,
      isWeekNumberDecoration: true,
    });
    expect(result[3]).toMatchObject({
      weekNumber: 1,
      isWeekNumberDecoration: true,
    });
  });
});

describe("DateRange Tests", () => {
  it("should generate dates correctly using a strategy", () => {
    const startDate = new Date(2023, 0, 1);
    const endDate = new Date(2023, 0, 3);
    const range = new DateRange(startDate, endDate).create(
      new StandardDateGenerationStrategy((date) => ({ date })),
    );

    const dates = range.getDates() as DateInfo[];

    expect(dates.length).toBe(3);
    expect(dates[0].date).toStrictEqual(startDate);
    expect(dates[2].date).toStrictEqual(endDate);
  });

  it("should apply a decorator to the generated dates", () => {
    const startDate = new Date(2023, 0, 1);
    const endDate = new Date(2023, 0, 7);
    const range = new DateRange(startDate, endDate)
      .create(
        new StandardDateGenerationStrategy((date) => ({
          date,
          weekNumber: getISOWeek(date),
        })),
      )
      // @ts-ignore
      .apply(new WeekNumberDecorator());

    const decoratedDates = range.getDates() as WeekNumberDecoration[];

    expect(decoratedDates.some((d) => "isWeekNumberDecoration" in d)).toBe(
      true,
    ); // Check for week markers
  });

  it("should group dates by month", () => {
    const startDate = new Date(2023, 0, 1);
    const endDate = new Date(2023, 1, 28); // January to February
    const range = new DateRange(startDate, endDate)
      .create(new StandardDateGenerationStrategy((date) => ({ date })))
      .group(new MonthGroupingStrategy());

    const groupedDates = range.getDates() as MonthInfo<{ date: Date }>[];

    expect(groupedDates.length).toBe(2); // January and February
    expect(groupedDates[0].title).toBe("January");
    expect(groupedDates[1].title).toBe("February");
  });

  it("should throw an error for invalid date ranges", () => {
    expect(
      () => new DateRange(new Date(2023, 0, 2), new Date(2023, 0, 1)),
    ).toThrow();
  });
});
