import { RangeType } from '../../statistics/enums/range-type.enum';
import { DateRange } from '../../statistics/dto/date-range';

export function parseDate(date: string) {
    const [month, day, year] = date.split('/');
    return year + '-' + month + '-' + day;
}

export function getMonthRanges(rangeType: string, date: string): DateRange[] {
    const dateRanges = [];
    let limit = 0;

    // in case we need all year's months we scan for 12 months before
    if (rangeType == RangeType.YEARLY) {
        limit = 12;
    }
    // 2022-10-12
    const parsedDate = new Date(date);
    for (let i = 0; i <= limit; i++) {
        const firstDay = new Date(
            parsedDate.getFullYear(),
            parsedDate.getMonth() - i,
            1,
        );
        const lastDay = new Date(
            parsedDate.getFullYear(),
            parsedDate.getMonth() - i + 1,
            0,
        );
        dateRanges.push({
            dateFrom:
                firstDay.getFullYear() +
                '-' +
                (+firstDay.getMonth() + 1) +
                '-01',
            dateTo: parseDate(lastDay.toLocaleDateString()),
        });
    }
    return dateRanges;
}

export function getWeek(monday: Date) {
    console.log(monday);
    const sunday = new Date(
        monday.getFullYear(),
        monday.getMonth(),
        monday.getDate() + 6,
    );
    console.log(parseDate(sunday.toLocaleDateString()));
    return {
        dateFrom: parseDate(monday.toLocaleDateString()),
        dateTo: parseDate(sunday.toLocaleDateString()),
    };
}

