import {
    IsNotEmpty,
    IsNumberString,
    IsOptional,
    IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCheckDto {
    @IsNotEmpty()
    @IsString()
    @Type(() => String)
    purchasedAt: string;

    @IsNotEmpty()
    @IsString()
    @Type(() => String)
    expiredAt: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    comment: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    company: string;

    @IsNotEmpty()
    @IsNumberString()
    @Type(() => String)
    cost: string;

    @IsNotEmpty()
    @IsNumberString()
    @Type(() => String)
    userId: string;
}
