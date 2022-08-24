import { IsNumberString, IsString } from "class-validator";
import {ApiProperty} from "@nestjs/swagger";

export class NumericIdParams {
    @IsNumberString()
    @ApiProperty()
    id: string;
}

export class IdParams {
    @IsString()
    @ApiProperty()
    id: string;
}

export class AfmParams {
    @IsNumberString()
    @ApiProperty()
    afm: string;
}

export class NameParams {
    @IsString()
    @ApiProperty()
    name: string;
}

