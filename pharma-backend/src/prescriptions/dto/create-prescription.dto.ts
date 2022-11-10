import { IsNotEmpty, IsNumberString, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePrescriptionDto {
    @IsNotEmpty()
    @IsNumberString()
    @Type(() => String)
    amount: string;

    @IsNotEmpty()
    @IsString()
    @Type(() => String)
    userId: string;
}
