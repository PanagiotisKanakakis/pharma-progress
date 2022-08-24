import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    Query,
} from '@nestjs/common';
import { PageDto, AfmParams, IdParams, NumericIdParams } from '../../common';
import { UpdateResult } from 'typeorm';
import { RealmRole } from '../authbroker.constants';
import { CreateUserDto, QueryUserDto, UpdateUserDto, Roles } from '../common';
import { User } from './user.entity';
import { UsersService } from './users.service';
import {
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('Authn/Authz')
@Controller('api/auth/users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    @Roles({ roles: [RealmRole.Admin] })
    @ApiCreatedResponse({
        description: 'The user has been successfully created.',
        type: User,
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiBearerAuth()
    create(@Body() createUserDto: CreateUserDto): Promise<User> {
        return this.usersService.create(createUserDto);
    }

    @Put(':id')
    @ApiResponse({
        status: 200,
        description: 'Update user',
        type: UpdateResult,
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiBearerAuth()
    update(
        @Param('id') id: number,
        @Body() dto: UpdateUserDto,
    ): Promise<UpdateResult> {
        return this.usersService.update(id, dto);
    }

    @Get()
    @Roles({ roles: [RealmRole.Admin] })
    @ApiOkResponse({
        status: 200,
        description: 'Retrieve all users',
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiBearerAuth()
    findAll(@Query() dto: QueryUserDto): Promise<PageDto<User>> {
        return this.usersService.findAll(dto);
    }

    @Get(':id')
    @Roles({ roles: [RealmRole.Admin] })
    @ApiResponse({
        status: 200,
        description: 'Retrieve a user',
        type: User,
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiBearerAuth()
    findOne(@Param() params: NumericIdParams): Promise<User> {
        return this.usersService.findOneOrFail(params.id);
    }

    @Get('/keycloakid/:id')
    @Roles({ roles: [RealmRole.Admin] })
    @ApiCreatedResponse({
        description: 'Retrieve user by keycloak id',
        type: User,
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiBearerAuth()
    findOneByKeycloakIdOrFail(@Param() params: IdParams): Promise<User> {
        return this.usersService.findOneByKeycloakIdOrFail(params.id);
    }

    @Get('/afm/:afm')
    @Roles({ roles: [RealmRole.Admin] })
    @ApiCreatedResponse({
        description: 'Retrieve user by afm',
        type: User,
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiBearerAuth()
    findOneByAfm(@Param() params: AfmParams): Promise<User> {
        return this.usersService.findOneByAfmOrFail(params.afm);
    }

    @Delete(':id')
    @Roles({ roles: [RealmRole.Admin] })
    @ApiResponse({
        status: 200,
        description: 'Delete user',
        type: User,
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiBearerAuth()
    remove(@Param() params: NumericIdParams): Promise<void> {
        return this.usersService.remove(params.id);
    }
}
