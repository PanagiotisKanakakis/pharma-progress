
import { IsNumber, Min, IsOptional, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PageRequestDto {

    @IsOptional()
    @Type(()=>Number)
    @IsNumber()
    @Min(0)
    page?: number = 1;

    @IsOptional()
    @Type(()=>Number)
    @IsNumber()
    @Min(1)
    @Max(100)
    limit?: number = 10;
}