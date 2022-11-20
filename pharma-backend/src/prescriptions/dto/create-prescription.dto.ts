import {
    IsNotEmpty,
    IsNumberString,
    IsOptional,
    IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePrescriptionDto {
    @IsNotEmpty()
    @IsNumberString()
    @Type(() => String)
    amount: string;

    @IsNotEmpty()
    @IsString()
    @Type(() => String)
    createdAt: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    comment: string;

    @IsNotEmpty()
    @IsString()
    @Type(() => String)
    userId: string;
}
