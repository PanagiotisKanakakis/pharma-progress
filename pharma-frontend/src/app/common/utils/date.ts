import {NgbDate, NgbDateStruct} from '@ng-bootstrap/ng-bootstrap';
import {DatePeriod} from './interfaces/date-period.interface';
import {translate} from '@angular/localize/tools';

export default class DateUtils {

    static toDate(date: string) {
        const [day, month, year] = date.split('-');
        return new Date(+year, +month - 1, +day);
    }

    static getMonday(date: Date) {
        const day = date.getDay(), diff = date.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(date.setDate(diff));
    }

    static formatDate(date: Date) {
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();
        return dd + '-' + mm + '-' + yyyy;
    }

    static queryFormattedDate(date: Date) {
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();
        return yyyy + '-' + mm + '-' + dd;
    }

    static initWeek(date: Date) {
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const nextDay = new Date(date);
            nextDay.setDate(date.getDate() + i);
            const name = nextDay.toLocaleString('en-us', {weekday: 'long'});
            dates.push({
                name: 'DAYS.' + name.toUpperCase(),
                queryFormattedDate: DateUtils.queryFormattedDate(nextDay),
                date: DateUtils.formatDate(nextDay)
            });
        }
        return dates;
    }

    static NgbDateToDate(date: NgbDate) {
        const year = date.year;
        const month = date.month <= 9 ? '0' + date.month : date.month;
        const day = date.day <= 9 ? '0' + date.day : date.day;
        return year + '-' + month + '-' + day;
    }

    static NgbDateToMonthPeriod(date: NgbDate): DatePeriod{
        const year = date.year;
        const month = date.month <= 9 ? '0'+ date.month : date.month;
        return {
            dateFrom: year + '-' + month + '-01',
            dateTo: DateUtils.queryFormattedDate(new Date(year, +month, 0)),
        }
    }

    static initSpecificWeek(date: NgbDate) {
        const year = date.year;
        const month = date.month <= 9 ? '0' + date.month : date.month;
        const day = date.day <= 9 ? '0' + date.day : date.day;
        const finalDate = year + '-' + month + '-' + day;
        const startDay = DateUtils.getMonday(new Date(finalDate));
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const nextDay = new Date(startDay);
            nextDay.setDate(startDay.getDate() + i);
            const name = nextDay.toLocaleString('en-us', {weekday: 'long'});
            dates.push({
                name: 'DAYS.' + name.toUpperCase(),
                queryFormattedDate: DateUtils.queryFormattedDate(nextDay),
                date: DateUtils.formatDate(nextDay)
            });
        }
        return dates;
    }

    static formatDbDate(date: string){
        const stringDate = date.split('T')[0];
        const [year, month, day] = stringDate.split('-');
        return this.formatDate(new Date(+year, +month - 1, +day));
    }

    static dateInRange(period: DatePeriod, value: Date) {
        if(period === undefined){
            return false;
        }else{
            const dateFromToDateFormat = new Date(period.dateFrom);
            const dateToToDateFormat = new Date(period.dateTo);
            return value >= dateFromToDateFormat && value <= dateToToDateFormat;
        }
    }

    static getTodayAsNgbDateStruct():NgbDateStruct{
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();

        return {
            year: year,
            month: +month,
            day: +day
        }
    }
}
