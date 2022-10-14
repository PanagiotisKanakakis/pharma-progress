import {
    IsArray,
    IsIn,
    IsNotEmpty,
    IsNumberString,
    IsOptional,
    IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RangeType } from '../enums/range-type.enum';
import { Type } from 'class-transformer';

export class CriteriaDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsNumberString()
    userId: string;

    @ApiProperty()
    @IsString()
    @Type(() => String)
    @IsIn([
        RangeType.DAILY,
        RangeType.MONTHLY,
        RangeType.YEARLY,
        RangeType.WEEKLY,
    ])
    range: string;

    @ApiProperty()
    @IsString()
    date: string;

    @ApiProperty()
    @IsOptional()
    @IsArray()
    @IsNumberString({}, { each: true })
    transactionType?: number[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsArray()
    @IsNumberString({}, { each: true })
    paymentType?: number[];

    @ApiProperty()
    @IsOptional()
    @IsNotEmpty()
    @IsNumberString()
    supplierType?: number;
}
