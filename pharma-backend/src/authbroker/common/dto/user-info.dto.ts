import { Allow, IsEmail, IsNotEmpty, IsNumberString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UserInfoDto {
    @IsNotEmpty()
    @ApiProperty()
    id: number;

    @IsNotEmpty()
    @ApiProperty()
    username: string;

    @IsEmail()
    @ApiProperty()
    email: string;

    @IsNotEmpty()
    @ApiProperty()
    @IsNumberString()
    afm: string;

    @Allow()
    @ApiProperty()
    firstName: string;

    @Allow()
    @ApiProperty()
    lastName: string;
}
