import {IsNumberString, IsOptional} from 'class-validator';
import {ApiProperty} from "@nestjs/swagger";

export class QueryFileDto {
    @IsNumberString()
    @ApiProperty()
    fileId: string;

    @IsOptional()
    @ApiProperty()
    fileName: string;
}
