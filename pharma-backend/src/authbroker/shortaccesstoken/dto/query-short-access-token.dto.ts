import { IsOptional, IsString } from 'class-validator';
import { PageRequestDto } from '../../../common';

export class ShortAccessTokenQueryDto extends PageRequestDto {
    @IsOptional()
    @IsString()
    token: string;
}
