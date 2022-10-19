import { Module } from '@nestjs/common';
import {
    AuthGuard,
    ResourceOrRoleGuard,
    ShortAccessTokenGuard,
} from './common';
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
import { User, UserController, UserService } from './users';
import { OpeningBalance } from '../opening-balance';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            ShortAccessTokenEntity,
            OpeningBalance,
        ]),
        HttpModule,
    ],
    providers: [
        ShortAccessTokenService,
        KeycloakConnectService,
        KeycloakAdminService,
        UserService,
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
        UserController,
        RolesController,
        ShortAccessTokenController,
    ],
})
export class AuthBrokerModule {}
