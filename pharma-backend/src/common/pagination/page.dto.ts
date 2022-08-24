import { IsArray } from "class-validator";
import {ApiProperty} from "@nestjs/swagger";

export class PageDto<T> {

    @IsArray()
    readonly data: T[];
    @ApiProperty()
    readonly count: number;
    @ApiProperty()
    readonly total: number;
    @ApiProperty()
    readonly page: number;
    @ApiProperty()
    readonly pageCount: number;
    
    constructor(data: T[], total: number, pageCount: number, page: number) {
        this.data = data;
        this.count = data.length;
        this.total = total;
        this.page = page;
        this.pageCount = pageCount;
    }

}