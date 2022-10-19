import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import { Logger, Injectable } from '@nestjs/common';
import { RealmRole } from '../authbroker.constants';
import { CreateUserDto } from '../common';
import { KeycloakAdminService } from './keycloak-admin.service';
import { KeycloakGroupsService } from './keycloak-groups.service';

@Injectable()
export class KeycloakUsersService {
    private readonly logger = new Logger(KeycloakUsersService.name);

    constructor(
        private readonly keycloakAdminService: KeycloakAdminService,
        private readonly keycloakGroupsService: KeycloakGroupsService,
    ) {}

    public async getOrCreateUserByAfm(
        dto: CreateUserDto,
    ): Promise<{ id: string }> {
        // const username = await afmToUsername(dto.afm);

        const user = await this.keycloakAdminService.getUserByUsername(
            dto.username,
        );

        // if found return
        if (typeof user !== 'undefined') {
            return { id: user.id };
        }
        // user not found, create in keycloak
        const payload: UserRepresentation = {
            username: dto.username,
            enabled: true,
            emailVerified: false,
            email: dto.email,
            firstName: dto.firstName,
            lastName: dto.lastName,
            attributes: {
                afm: dto.afm,
            },
        };
        if (dto?.password) {
            payload.credentials = [
                {
                    value: dto.password,
                    type: 'password',
                },
            ];
        }

        const { id } = await this.keycloakAdminService.createUser(payload);

        // new user should be added to the users groups
        const usersGroupId =
            await this.keycloakGroupsService.getOrCreateTopLevelUsersGroup();

        await this.keycloakAdminService
            .addUserToGroup(id, usersGroupId)
            .catch((e) => {
                this.logger.warn(
                    `Failed to add user ${id} to users group ${usersGroupId}: ${e}`,
                );
            });

        // new user should have default role
        await this.keycloakAdminService.addUserRoleMapping(
            id,
            RealmRole.KepUser,
        );

        return { id };
    }
}
