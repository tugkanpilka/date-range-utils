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
    data?: string;
    weekNumber?: number;
  }

  it("should handle an empty array", () => {
    expect(decorator.decorate<TestDateInfo>([])).toEqual([]);
  });

  it("should handle a single date", () => {
    const date = new Date("2024-01-01");
    const input: TestDateInfo[] = [{ date }];

    const expected: WeekNumberDecoration<TestDateInfo>[] = [
      { date },
      {
        isWeekNumberDecoration: true,
        weekNumber: getISOWeek(date),
        date,
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

    const result = decorator.decorate(input);

    // Find week markers
    const weekMarkers = result.filter(
      (
        item
      ): item is {
        date: Date;
        isWeekNumberDecoration: true;
        weekNumber: number;
      } => "isWeekNumberDecoration" in item
    );

    expect(weekMarkers).toHaveLength(3); // Should have markers for weeks 1, 2, and 3
    expect(weekMarkers[0].weekNumber).toBe(1);
    expect(weekMarkers[1].weekNumber).toBe(2);
    expect(weekMarkers[2].weekNumber).toBe(3);
  });

  it("should handle dates in a single week without inserting extra week markers", () => {
    const input: TestDateInfo[] = [
      { date: new Date("2024-01-01") },
      { date: new Date("2024-01-03") },
      { date: new Date("2024-01-05") },
    ];

    const result = decorator.decorate(input);
    const weekMarkers = result.filter(
      (
        item
      ): item is {
        date: Date;
        isWeekNumberDecoration: true;
        weekNumber: number;
      } => "isWeekNumberDecoration" in item
    );

    expect(weekMarkers).toHaveLength(1);
    expect(weekMarkers[0].weekNumber).toBe(getISOWeek(new Date("2024-01-01")));
  });

  it("should correctly handle edge cases at the end of the year", () => {
    const input: TestDateInfo[] = [
      { date: new Date("2023-12-31") }, // ISO week 52 of 2023
      { date: new Date("2024-01-01") }, // ISO week 1 of 2024
      { date: new Date("2024-01-02") }, // Still ISO week 1
    ];

    const result = decorator.decorate(input);
    const weekMarkers = result.filter(
      (
        item
      ): item is {
        date: Date;
        isWeekNumberDecoration: true;
        weekNumber: number;
      } => "isWeekNumberDecoration" in item
    );

    expect(weekMarkers).toHaveLength(2);
    expect(weekMarkers[0].weekNumber).toBe(getISOWeek(new Date("2023-12-31")));
    expect(weekMarkers[1].weekNumber).toBe(getISOWeek(new Date("2024-01-01")));
  });

  it("should correctly handle week numbers at month transitions", () => {
    const input: TestDateInfo[] = [
      // Week 48 (ends in December)
      { date: new Date("2023-11-27") }, // Monday (November)
      { date: new Date("2023-11-28") }, // Tuesday (November)
      { date: new Date("2023-11-29") }, // Wednesday (November)
      { date: new Date("2023-11-30") }, // Thursday (November)
      { date: new Date("2023-12-01") }, // Friday (December)
      { date: new Date("2023-12-02") }, // Saturday (December)
      { date: new Date("2023-12-03") }, // Sunday (December)
      // Week 49 (ends in December)
      { date: new Date("2023-12-04") }, // Monday (December)
      { date: new Date("2023-12-05") }, // Tuesday (December)
    ];

    const result = decorator.decorate(input);

    // Find week markers
    const weekMarkers = result.filter(
      (
        item
      ): item is {
        date: Date;
        isWeekNumberDecoration: true;
        weekNumber: number;
      } =>
        "isWeekNumberDecoration" in item &&
        (item.weekNumber === 48 || item.weekNumber === 49)
    );

    expect(weekMarkers).toHaveLength(2);

    // Week 48 marker should be in December (month 11) because it ends in December
    expect(weekMarkers[0].weekNumber).toBe(48);
    expect(weekMarkers[0].date.getMonth()).toBe(11); // December

    // Week 49 marker should be in December (month 11)
    expect(weekMarkers[1].weekNumber).toBe(49);
    expect(weekMarkers[1].date.getMonth()).toBe(11); // December
  });

  it("should show week number in the month of the last day", () => {
    const input: TestDateInfo[] = [
      // Week 31 (ends in August)
      { date: new Date("2024-07-29") }, // Monday (July)
      { date: new Date("2024-07-30") }, // Tuesday (July)
      { date: new Date("2024-07-31") }, // Wednesday (July)
      { date: new Date("2024-08-01") }, // Thursday (August)
      { date: new Date("2024-08-02") }, // Friday (August)
      { date: new Date("2024-08-03") }, // Saturday (August)
      { date: new Date("2024-08-04") }, // Sunday (August)
      // Week 32 (ends in August)
      { date: new Date("2024-08-05") }, // Monday (August)
      { date: new Date("2024-08-06") }, // Tuesday (August)
    ];

    const result = decorator.decorate(input);
    const weekMarkers = result.filter(
      (
        item
      ): item is {
        date: Date;
        isWeekNumberDecoration: true;
        weekNumber: number;
      } => "isWeekNumberDecoration" in item
    );

    expect(weekMarkers).toHaveLength(2);

    // Week 31 should be in August (month 7) because it ends in August
    expect(weekMarkers[0].weekNumber).toBe(31);
    expect(weekMarkers[0].date.getMonth()).toBe(7); // August

    // Week 32 should be in August (month 7)
    expect(weekMarkers[1].weekNumber).toBe(32);
    expect(weekMarkers[1].date.getMonth()).toBe(7); // August
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
