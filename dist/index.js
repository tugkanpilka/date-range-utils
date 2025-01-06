"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateRange = exports.WeekNumberDecorator = exports.MonthGroupingStrategy = exports.StandardDateGenerationStrategy = void 0;
var date_fns_1 = require("date-fns");
var date_fns_2 = require("date-fns");
var StandardDateGenerationStrategy = /** @class */ (function () {
    function StandardDateGenerationStrategy(dateFactory) {
        this.dateFactory = dateFactory;
    }
    StandardDateGenerationStrategy.prototype.generate = function (startDate, endDate) {
        var dates = [];
        var totalDays = (0, date_fns_1.differenceInCalendarDays)(endDate, startDate) + 1;
        for (var i = 0; i < totalDays; i++) {
            var currentDate = (0, date_fns_1.addDays)(startDate, i);
            dates.push(this.dateFactory(currentDate));
        }
        return dates;
    };
    return StandardDateGenerationStrategy;
}());
exports.StandardDateGenerationStrategy = StandardDateGenerationStrategy;
var MonthGroupingStrategy = /** @class */ (function () {
    function MonthGroupingStrategy() {
    }
    MonthGroupingStrategy.prototype.group = function (dates) {
        var monthsMap = new Map();
        dates.forEach(function (dateInfo) {
            var date = dateInfo.date;
            var month = (0, date_fns_1.getMonth)(date);
            if (!monthsMap.has(month)) {
                monthsMap.set(month, {
                    title: date.toLocaleString("default", { month: "long" }),
                    number: month + 1,
                    data: [],
                });
            }
            monthsMap.get(month).data.push(dateInfo);
        });
        return Array.from(monthsMap.values()).sort(function (a, b) { return a.number - b.number; });
    };
    return MonthGroupingStrategy;
}());
exports.MonthGroupingStrategy = MonthGroupingStrategy;
var WeekNumberDecorator = /** @class */ (function () {
    function WeekNumberDecorator() {
    }
    /**
     * Decorates the date array by adding a `weekNumber` marker
     * at the end of each week. The marker is added after the last day of the week
     * but represents the week number of that week.
     * @param dates Array of objects with a `date` property.
     * @returns Array with week markers inserted at the end of each ISO week.
     */
    WeekNumberDecorator.prototype.decorate = function (dates) {
        if (dates.length === 0)
            return [];
        var result = [];
        var weekStartDate = dates[0].date;
        dates.forEach(function (dateInfo, index) {
            var _a;
            var currentWeek = (0, date_fns_2.getISOWeek)(dateInfo.date);
            var nextDate = (_a = dates[index + 1]) === null || _a === void 0 ? void 0 : _a.date;
            var isLastDate = index === dates.length - 1;
            var isWeekTransition = nextDate && (0, date_fns_2.getISOWeek)(nextDate) !== currentWeek;
            // If this is the first date of a new week, update weekStartDate
            if (index === 0 || (0, date_fns_2.getISOWeek)(dates[index - 1].date) !== currentWeek) {
                weekStartDate = dateInfo.date;
            }
            // Push the current date into the result
            result.push(dateInfo);
            // Add week marker if it's the last date of the week
            if (isWeekTransition || isLastDate) {
                result.push({
                    isWeekNumberDecoration: true,
                    weekNumber: currentWeek,
                    date: weekStartDate, // Use the first date of the week
                });
            }
        });
        return result;
    };
    return WeekNumberDecorator;
}());
exports.WeekNumberDecorator = WeekNumberDecorator;
var DateRange = /** @class */ (function () {
    function DateRange(startDate, endDate) {
        this.startDate = startDate;
        this.endDate = endDate;
        this.dates = [];
        var start = (0, date_fns_1.startOfDay)(this.startDate);
        var end = (0, date_fns_1.startOfDay)(this.endDate);
        if (start > end) {
            throw new Error("ERROR! location: DateRange.ts. \n\n        Message: ".concat(start.toLocaleString(), " is greater than ").concat(end.toLocaleString(), "."));
        }
        this.startDate = start;
        this.endDate = end;
    }
    DateRange.prototype.create = function (strategy) {
        this.dates = strategy.generate(this.startDate, this.endDate);
        return this;
    };
    DateRange.prototype.apply = function (decorator) {
        var decoratedDates = decorator.decorate(this.dates);
        // Explicitly change the type of 'this' to ensure assignment works:
        var updatedDateRange = this;
        updatedDateRange.dates = decoratedDates;
        return updatedDateRange;
    };
    DateRange.prototype.group = function (strategy) {
        this.dates = strategy.group(this.dates);
        return this;
    };
    DateRange.prototype.getDates = function () {
        return this.dates;
    };
    return DateRange;
}());
exports.DateRange = DateRange;
