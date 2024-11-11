# Date Range Utils
Date Range Utils is a util class including generating, grouping, and decorating dates.

> Warning: This package is heavily under development right now. Breaking changes can occur anytime.

## Date Range Generation
```ts
import { StandardDateGenerationStrategy, DateInfo } from 'date-range-utils';

const startDate = new Date(2023, 0, 1); // January 1, 2023
const endDate = new Date(2023, 0, 10); // January 10, 2023

const dateFactory = (date: Date): DateInfo => ({
    date,
    weekNumber: Math.ceil(date.getDate() / 7),
});

const generationStrategy = new StandardDateGenerationStrategy<DateInfo>(dateFactory);
const generatedDates = generationStrategy.generate(startDate, endDate);
```


## Group Dates by Month
```ts
import { std, MonthGroupingStrategy, MonthInfo, DateInfo } from 'date-range-utils';

const dates: DateInfo[] = [
    { date: new Date(2023, 0, 1), weekNumber: 1 },
    { date: new Date(2023, 0, 10), weekNumber: 2 },
    { date: new Date(2023, 1, 15), weekNumber: 3 }
];

const groupingStrategy = new MonthGroupingStrategy<DateInfo>();
const groupedDates = groupingStrategy.group(dates);
```

## Date Range Handling
Combining generation, decoration, and grouping functionalities using DateRange:
```ts
import { DateRange, StandardDateGenerationStrategy, MonthGroupingStrategy, DateInfo, MonthInfo } from 'date-range-utils';

const startDate = new Date(2023, 0, 1);
const endDate = new Date(2023, 0, 31);

const dateFactory = (date: Date): DateInfo => ({
    date,
    weekNumber: Math.ceil(date.getDate() / 7),
});

const generationStrategy = new StandardDateGenerationStrategy<DateInfo>(dateFactory);
const groupingStrategy = new MonthGroupingStrategy<DateInfo>();

const dateRange = new DateRange<DateInfo, MonthInfo<DateInfo>>(startDate, endDate);
const finalResult = dateRange.create(generationStrategy).group(groupingStrategy).getDates();
```
