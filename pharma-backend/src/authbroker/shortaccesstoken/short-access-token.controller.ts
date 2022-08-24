import { Controller, Get, Post, Logger, Query, Body } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ShortAccessTokenService } from './short-access-token.service';
import { PageDto } from '../../common';
import { ShortAccessTokenEntity } from './short-access-token.entity';
import { Roles } from '../common';
import { RealmRole } from '../authbroker.constants';
import { CreateShortAccessToken, ShortAccessTokenQueryDto } from './dto';

@ApiTags('Authn/Authz')
@Controller('api/auth/shortaccesstoken')
export class ShortAccessTokenController {
    private readonly logger = new Logger(ShortAccessTokenController.name);
    constructor(
        private readonly shortAccessTokenService: ShortAccessTokenService,
    ) {}

    @Get()
    @ApiResponse({
        status: 200,
        description: 'Get short access tokens',
    })
    @Roles({ roles: [RealmRole.Admin] })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiBearerAuth()
    async findAll(
        @Query() dto: ShortAccessTokenQueryDto,
    ): Promise<PageDto<ShortAccessTokenEntity>> {
        return this.shortAccessTokenService.findAll(dto);
    }

    @Post()
    @Roles({ roles: [RealmRole.Admin] })
    create(
        @Body() dto: CreateShortAccessToken,
    ): Promise<ShortAccessTokenEntity> {
        return this.shortAccessTokenService.create(dto);
    }
}
