import { IsNotEmpty, IsNumberString, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOpeningBalanceDto {
    @IsNotEmpty()
    @IsNumberString()
    @Type(() => String)
    cost: string;

    @IsNotEmpty()
    @IsString()
    @Type(() => String)
    userId: string;
}
