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

describe("WeekNumberDecorator", () => {
  const decorator = new WeekNumberDecorator();

  interface TestDateInfo {
    date: Date;
    data?: string; // Example additional property
  }

  it("should handle an empty array", () => {
    expect(decorator.decorate<TestDateInfo>([])).toEqual([]);
  });

  it("should handle a single date", () => {
    const input: TestDateInfo[] = [{ date: new Date("2024-01-01") }];

    const expected: WeekNumberDecoration<TestDateInfo>[] = [
      { date: new Date("2024-01-01") },
      {
        isWeekNumberDecoration: true,
        weekNumber: getISOWeek(new Date("2024-01-01")),
      },
    ];

    expect(decorator.decorate(input)).toEqual(expected);
  });

  it("should add week markers for multiple weeks", () => {
    const input: TestDateInfo[] = [
      { date: new Date("2024-01-01") }, // ISO week 1
      { date: new Date("2024-01-07") }, // Still ISO week 1
      { date: new Date("2024-01-08") }, // ISO week 2
      { date: new Date("2024-01-13") }, // Still ISO week 2
      { date: new Date("2024-01-15") }, // ISO week 3
    ];

    const expected: WeekNumberDecoration<TestDateInfo>[] = [
      { date: new Date("2024-01-01") },
      { date: new Date("2024-01-07") },
      { isWeekNumberDecoration: true, weekNumber: 1 },
      { date: new Date("2024-01-08") },
      { date: new Date("2024-01-13") },
      { isWeekNumberDecoration: true, weekNumber: 2 },
      { date: new Date("2024-01-15") },
      { isWeekNumberDecoration: true, weekNumber: 3 },
    ];

    expect(decorator.decorate(input)).toEqual(expected);
  });

  it("should handle dates in a single week without inserting extra week markers", () => {
    const input: TestDateInfo[] = [
      { date: new Date("2024-01-01") },
      { date: new Date("2024-01-03") },
      { date: new Date("2024-01-05") },
    ];

    const expected: WeekNumberDecoration<TestDateInfo>[] = [
      { date: new Date("2024-01-01") },
      { date: new Date("2024-01-03") },
      { date: new Date("2024-01-05") },
      {
        isWeekNumberDecoration: true,
        weekNumber: getISOWeek(new Date("2024-01-01")),
      },
    ];

    expect(decorator.decorate(input)).toEqual(expected);
  });

  it("should correctly handle edge cases at the end of the year", () => {
    const input: TestDateInfo[] = [
      { date: new Date("2023-12-31") }, // ISO week 52 of 2023
      { date: new Date("2024-01-01") }, // ISO week 1 of 2024
      { date: new Date("2024-01-02") }, // Still ISO week 1
    ];

    const expected: WeekNumberDecoration<TestDateInfo>[] = [
      { date: new Date("2023-12-31") },
      {
        isWeekNumberDecoration: true,
        weekNumber: getISOWeek(new Date("2023-12-31")),
      },
      { date: new Date("2024-01-01") },
      { date: new Date("2024-01-02") },
      {
        isWeekNumberDecoration: true,
        weekNumber: getISOWeek(new Date("2024-01-01")),
      },
    ];

    expect(decorator.decorate(input)).toEqual(expected);
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

    const decoratedDates = range.getDates();

    expect(decoratedDates.some((d) => "isWeekNumberDecoration" in d)).toBe(
      true,
    );
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
