import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOkResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
    Body,
    Controller,
    Post,
    Res,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { RealmRole, Roles } from '../authbroker';
import { QueryFileDto } from './dto';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Files')
@Controller('api/files')
export class FilesController {
    constructor(readonly service: FilesService) {}

    @Post('upload')
    @Roles({
        roles: [RealmRole.Admin, RealmRole.KepAdmin, RealmRole.KepManager],
    })
    @ApiOkResponse({
        status: 201,
        description: 'Upload file',
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiBearerAuth()
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile('file') file): Promise<number> {
        return this.service.upload(
            file.originalname,
            file.mimetype,
            file.buffer,
        );
    }

    @Post('download')
    @Roles({
        roles: [RealmRole.KepManager, RealmRole.KepAdmin, RealmRole.Admin],
    })
    @ApiOkResponse({
        status: 200,
        description: 'Download file by fileId',
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiBearerAuth()
    async downloadFile(@Body() dto: QueryFileDto, @Res() res: Response) {
        const file = await this.service.downloadFileById(dto);
        res.status(200);
        res.type(file.mimeType);
        res.header(
            'Content-Disposition',
            `attachment; filename="${file.fileName}"`,
        );
        res.end(file.data);
    }
}
