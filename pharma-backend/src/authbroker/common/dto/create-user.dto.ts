import { IsEmail, IsNumberString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @IsNumberString()
    @ApiProperty()
    afm: string;

    @IsNumberString()
    @ApiProperty()
    username: string;

    @IsEmail()
    @IsOptional()
    @ApiProperty()
    email: string;

    @IsOptional()
    @ApiProperty()
    firstName: string;

    @IsOptional()
    @ApiProperty()
    lastName: string;

    @IsOptional()
    @ApiProperty()
    password: string;

    @IsNumberString()
    @ApiProperty()
    openingBalance: string;

    @IsOptional()
    @ApiProperty()
    businessType: string;
}
