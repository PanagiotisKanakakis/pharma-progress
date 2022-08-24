import { Module } from '@nestjs/common';
import {
    AuthGuard,
    ResourceOrRoleGuard,
    ShortAccessTokenGuard,
} from './common';
import { UsersService, User, UsersController } from './users';
import { ProfileService, ProfileController } from './profile';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
    KeycloakAdminService,
    KeycloakConnectService,
    AclResourcesService,
    KeycloakGroupsService,
    KeycloakUsersService,
} from './keycloak';
import { RolesController } from './roles';
import { HttpModule } from '@nestjs/axios';
import {
    ShortAccessTokenController,
    ShortAccessTokenEntity,
    ShortAccessTokenService,
} from './shortaccesstoken';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, ShortAccessTokenEntity]),
        HttpModule,
    ],
    providers: [
        ShortAccessTokenService,
        KeycloakConnectService,
        KeycloakAdminService,
        UsersService,
        ProfileService,
        AclResourcesService,
        KeycloakGroupsService,
        KeycloakUsersService,
        AuthGuard,
        ShortAccessTokenGuard,
        ResourceOrRoleGuard,
    ],
    exports: [
        KeycloakConnectService,
        KeycloakAdminService,
        AclResourcesService,
        KeycloakGroupsService,
        KeycloakUsersService,
        AuthGuard,
        ShortAccessTokenService,
        ShortAccessTokenGuard,
        ResourceOrRoleGuard,
    ],
    controllers: [
        ProfileController,
        UsersController,
        RolesController,
        ShortAccessTokenController,
    ],
})
export class AuthBrokerModule {}
