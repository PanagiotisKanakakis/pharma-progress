import { Logger, Injectable, NotFoundException } from '@nestjs/common';
import { KepResourceRole } from '../authbroker.constants';
import { KeycloakAdminService } from './keycloak-admin.service';

@Injectable()
export class AclResourcesService {
    private readonly logger = new Logger(AclResourcesService.name);
    private readonly ACL_ATTRIBUTE = 'PHARMAacl';

    constructor(private readonly keycloakAdminService: KeycloakAdminService) {}

    public async setKepResourceRole(
        resourceName: string,
        keycloakUserId: string,
        kepResourceRole: KepResourceRole,
    ) {
        this.logger.debug(
            `Setting ${resourceName}:${kepResourceRole} for user ${keycloakUserId}`,
        );
        const user = await this.keycloakAdminService.getUser(keycloakUserId);
        if (!user) {
            throw new NotFoundException(`User ${keycloakUserId} not found.`);
        }
        if (!user.attributes) {
            user.attributes = {};
        }
        if (!(this.ACL_ATTRIBUTE in user.attributes)) {
            user.attributes[this.ACL_ATTRIBUTE] = '{}';
        }
        const attrs = JSON.parse(user.attributes[this.ACL_ATTRIBUTE]);
        attrs[resourceName] = kepResourceRole;
        user.attributes[this.ACL_ATTRIBUTE] = JSON.stringify(attrs);
        await this.keycloakAdminService.updateUser(keycloakUserId, user);
    }

    public async clearKepResourceRole(
        resourceName: string,
        keycloakUserId: string,
    ) {
        const user = await this.keycloakAdminService.getUser(keycloakUserId);
        if (!user.attributes) {
            return;
        }
        if (!(this.ACL_ATTRIBUTE in user.attributes)) {
            return;
        }
        const attrs = JSON.parse(user.attributes[this.ACL_ATTRIBUTE]);
        if (resourceName in attrs) {
            this.logger.debug(
                `Clearing all roles from  ${resourceName} for user ${keycloakUserId}`,
            );
            delete attrs[resourceName];
            user.attributes[this.ACL_ATTRIBUTE] = JSON.stringify(attrs);
            await this.keycloakAdminService.updateUser(keycloakUserId, user);
        }
    }
}
