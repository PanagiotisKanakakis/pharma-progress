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
import { IdParams, NumericIdParams, PageDto } from '../../common';
import { UpdateResult } from 'typeorm';
import {
    CreateUserDto,
    QueryUserDto,
    RealmRole,
    Roles,
    UpdateUserDto,
} from '../index';
import { User } from './user.entity';
import { UserService } from './user.service';
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
export class UserController {
    constructor(private readonly usersService: UserService) {}

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
