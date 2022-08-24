import { IsNumberString, IsOptional } from 'class-validator';
import { PageRequestDto } from '../../../common';

export class QueryUserDto extends PageRequestDto {
    @IsOptional()
    @IsNumberString()
    afm: string;

    @IsOptional()
    username: string;

    @IsOptional()
    firstName: string;

    @IsOptional()
    lastName: string;

    @IsOptional()
    keycloakId: string;
}
