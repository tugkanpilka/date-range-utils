import { differenceInCalendarDays } from "date-fns";
import {
  DateRange,
  StandardDateGenerationStrategy,
  MonthGroupingStrategy,
  WeekNumberDecorator,
  DateInfo,
  MonthInfo,
} from "./index";

describe("DateRange Class Tests", () => {
  // Test creating a valid date range and generating expected dates
  it("should generate dates using a valid strategy", () => {
    const startDate = new Date(2023, 0, 1); // January 1, 2023
    const endDate = new Date(2023, 0, 3); // January 3, 2023
    const strategy = new StandardDateGenerationStrategy((date) => ({ date }));

    // Creating a DateRange and generating dates
    const dateRange = new DateRange(startDate, endDate).create(strategy);
    const dates = dateRange.getDates() as { date: Date }[];

    // Assertions
    expect(dates.length).toBe(3); // Expect range to contain 3 dates
    expect(dates[0].date).toStrictEqual(startDate); // First date should match startDate
    expect(dates[2].date).toStrictEqual(endDate); // Last date should match endDate
  });

  // Test edge case: startDate is after endDate
  it("should throw an error when startDate is after endDate", () => {
    const startDate = new Date(2023, 0, 3); // January 3, 2023
    const endDate = new Date(2023, 0, 1); // January 1, 2023

    // Invalid date range should throw an error
    expect(() => new DateRange(startDate, endDate)).toThrow(/is greater than/);
  });

  // Test applying a decorator after generating a range
  it("should apply a decorator to generated dates", () => {
    const startDate = new Date(2023, 0, 1);
    const endDate = new Date(2023, 0, 3);
    const strategy = new StandardDateGenerationStrategy((date) => ({
      date,
      weekNumber: 1,
    }));
    const decorator = new WeekNumberDecorator();

    // Create a range, generate dates, and decorate them
    const dateRange = new DateRange<DateInfo>(startDate, endDate)
      .create(strategy)
      .apply(decorator);

    const decoratedDates = dateRange.getDates() as (DateInfo & {
      isWeekNumberDecoration: boolean;
    })[];

    // Check decorated dates
    expect(decoratedDates.some((d) => d.isWeekNumberDecoration)).toBe(true); // Ensure weekNumber markers are added
    expect(decoratedDates.find((d) => d.isWeekNumberDecoration)?.isDummy).toBe(
      true,
    ); // Dummy dates should be marked
  });

  // Test grouping dates after generation
  it("should group dates by month after generation", () => {
    const startDate = new Date(2023, 0, 1); // January
    const endDate = new Date(2023, 1, 28); // February
    const strategy = new StandardDateGenerationStrategy((date) => ({ date }));
    const groupStrategy = new MonthGroupingStrategy();

    const dateRange = new DateRange(startDate, endDate)
      .create(strategy)
      .group(groupStrategy);

    const groupedDates = dateRange.getDates() as MonthInfo<{ date: Date }>[];

    // Check group details
    expect(groupedDates[0].title).toBe("January"); // First group title must be January
    expect(groupedDates[1].title).toBe("February"); // Second group title must be February
    expect(groupedDates.length).toBe(2); // Only two months should be grouped
  });
});

describe("StandardDateGenerationStrategy Tests", () => {
  it("should generate a list of consecutive dates", () => {
    const startDate = new Date(2023, 0, 1); // January 1, 2023
    const endDate = new Date(2023, 0, 5); // January 5, 2023
    const strategy = new StandardDateGenerationStrategy((date) => ({ date }));

    // Generating dates
    const dates = strategy.generate(startDate, endDate);

    // Check number of generated dates
    expect(dates.length).toBe(differenceInCalendarDays(endDate, startDate) + 1);
    expect(dates[0].date).toStrictEqual(startDate); // Verify the first date
    expect(dates[4].date).toStrictEqual(endDate); // Verify the last date
  });
});

describe("MonthGroupingStrategy Tests", () => {
  it("should group dates correctly by month", () => {
    const startDate = new Date(2023, 0, 1); // January
    const endDate = new Date(2023, 2, 15); // March
    const strategy = new StandardDateGenerationStrategy((date) => ({ date }));
    const dates = strategy.generate(startDate, endDate);

    const groupingStrategy = new MonthGroupingStrategy();
    const groupedDates = groupingStrategy.group(dates);

    // Verify groups
    expect(groupedDates.length).toBe(3); // Expect 3 groups (Jan, Feb, Mar)
    expect(groupedDates[0].title).toBe("January");
    expect(groupedDates[1].title).toBe("February");
    expect(groupedDates[2].title).toBe("March");

    // Check grouping logic
    expect(groupedDates[0].data.length).toBeGreaterThan(0); // January should not be empty
    expect(groupedDates[2].data.some((d) => d.date.getMonth() === 2)).toBe(
      true,
    ); // March entries should have a month of "2"
  });
});

describe("WeekNumberDecorator Tests", () => {
  let decorator: WeekNumberDecorator;

  beforeEach(() => {
    decorator = new WeekNumberDecorator();
  });

  it("should add weekNumber for distinct weeks in the array", () => {
    const dates: DateInfo[] = [
      { date: new Date(2024, 0, 2), weekNumber: 1 }, // 2 Jan 2024 (Week 1)
      { date: new Date(2024, 0, 3), weekNumber: 1 }, // 3 Jan 2024 (Week 1)
      { date: new Date(2024, 0, 9), weekNumber: 2 }, // 9 Jan 2024 (Week 2)
      { date: new Date(2024, 0, 15), weekNumber: 3 }, // 15 Jan 2024 (Week 3)
    ];

    const result = decorator.decorate(dates);

    expect(result).toHaveLength(7); // 4 dates + 3 week markers
    expect(result[0]).toMatchObject({
      weekNumber: 1,
      isWeekNumberDecorationDecoration: true,
    }); // Week 1 marker
    expect(result[1]).toMatchObject({
      date: dates[0].date,
      isWeekNumberDecorationDecoration: false,
    }); // 2 Jan 2024
    expect(result[4]).toMatchObject({
      weekNumber: 2,
      isWeekNumberDecorationDecoration: true,
    }); // Week 2 marker
  });

  it("should only add a single weekNumber marker for each week", () => {
    const dates: DateInfo[] = [
      { date: new Date(2024, 0, 1), weekNumber: 1 }, // 1 Jan 2024 (Week 1)
      { date: new Date(2024, 0, 2), weekNumber: 1 }, // 2 Jan 2024 (Week 1)
      { date: new Date(2024, 0, 3), weekNumber: 1 }, // 3 Jan 2024 (Week 1)
      { date: new Date(2024, 0, 8), weekNumber: 2 }, // 8 Jan 2024 (Week 2)
      { date: new Date(2024, 0, 9), weekNumber: 2 }, // 9 Jan 2024 (Week 2)
    ];

    const result = decorator.decorate(dates);

    expect(result).toHaveLength(7); // 5 dates + 2 week markers
    expect(result.filter((entry) => entry.isWeekNumberDecoration)).toHaveLength(
      2,
    ); // Only two week markers
    expect(result[0]).toMatchObject({
      weekNumber: 1,
      isWeekNumberDecoration: true,
    }); // Week 1 marker
    expect(result[3]).toMatchObject({
      weekNumber: 2,
      isWeekNumberDecoration: true,
    }); // Week 2 marker
  });

  it("should handle consecutive daily data in a single week", () => {
    const dates: DateInfo[] = [
      { date: new Date(2024, 0, 1), weekNumber: 1 }, // 1 Jan 2024 (Week 1)
      { date: new Date(2024, 0, 2), weekNumber: 1 }, // 2 Jan 2024 (Week 1)
      { date: new Date(2024, 0, 3), weekNumber: 1 }, // 3 Jan 2024 (Week 1)
    ];

    const result = decorator.decorate(dates);

    expect(result).toHaveLength(4); // 3 dates + 1 week marker
    expect(result[0]).toMatchObject({
      weekNumber: 1,
      isWeekNumberDecoration: true,
    }); // Week 1 marker
    expect(result[1]).toMatchObject({
      date: dates[0].date,
      isWeekNumberDecoration: false,
    }); // First date
  });

  it("should handle sparse weekly entries", () => {
    const dates: DateInfo[] = [
      { date: new Date(2024, 0, 3), weekNumber: 1 }, // 3 Jan 2024 (Week 1)
      { date: new Date(2024, 0, 15), weekNumber: 3 }, // 15 Jan 2024 (Week 3)
      { date: new Date(2024, 0, 30), weekNumber: 5 }, // 30 Jan 2024 (Week 5)
    ];

    const result = decorator.decorate(dates);

    expect(result).toHaveLength(6); // 3 dates + 3 week markers
    expect(result[0]).toMatchObject({
      weekNumber: 1,
      isWeekNumberDecoration: true,
    }); // Week 1 marker
    expect(result[2]).toMatchObject({
      weekNumber: 3,
      isWeekNumberDecoration: true,
    }); // Week 3 marker
    expect(result[4]).toMatchObject({
      weekNumber: 5,
      isWeekNumberDecoration: true,
    }); // Week 5 marker
  });

  it("should handle a single date", () => {
    const dates: DateInfo[] = [{ date: new Date(2024, 0, 2), weekNumber: 1 }]; // 2 Jan 2024 (Week 1)

    const result = decorator.decorate(dates);

    expect(result).toHaveLength(2); // 1 date + 1 week marker
    expect(result[0]).toMatchObject({
      weekNumber: 1,
      isWeekNumberDecoration: true,
    }); // Week 1 marker
    expect(result[1]).toMatchObject({
      date: dates[0].date,
      isWeekNumberDecoration: false,
    }); // Original date
  });

  it("should handle an empty array", () => {
    const dates: DateInfo[] = []; // No dates

    const result = decorator.decorate(dates);

    expect(result).toHaveLength(0); // No output for empty input
  });

  it("should calculate correct ISO week numbers for edge cases", () => {
    const dates: DateInfo[] = [
      { date: new Date(2023, 11, 31), weekNumber: 52 }, // 31 Dec 2023 (Week 52, ISO year 2023)
      { date: new Date(2024, 0, 1), weekNumber: 1 }, // 1 Jan 2024 (Week 1, ISO year 2024)
    ];

    const result = decorator.decorate(dates);

    expect(result).toHaveLength(4); // 2 dates + 2 week markers
    expect(result[0]).toMatchObject({
      weekNumber: 52,
      isWeekNumberDecoration: true,
    }); // Week 52 marker
    expect(result[2]).toMatchObject({
      weekNumber: 1,
      isWeekNumberDecoration: true,
    }); // Week 1 marker
  });
});
