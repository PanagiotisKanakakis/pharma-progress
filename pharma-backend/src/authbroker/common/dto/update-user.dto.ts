import { IsNotEmpty, IsNumberString, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    businessType: string;

    @IsNotEmpty()
    @IsNumberString()
    @ApiProperty()
    openingBalance: string;
}
