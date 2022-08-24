import {ApiProperty} from "@nestjs/swagger";

export class UploadFileDto {

    @ApiProperty()
    fileName: string;

    @ApiProperty()
    mimeType: string;

    @ApiProperty()
    dataBuffer: Buffer;

}
