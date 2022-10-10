import {
    IsArray,
    IsNotEmpty,
    IsNumberString,
    IsOptional,
    IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CriteriaDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsNumberString()
    userId: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    dateFrom?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    dateTo?: string;

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
