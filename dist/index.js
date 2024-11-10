"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateRange = exports.MonthGroupingStrategy = exports.StandardDateGenerationStrategy = void 0;
var date_fns_1 = require("date-fns");
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
        this.dates = decorator.decorate(this.dates);
        return this;
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
