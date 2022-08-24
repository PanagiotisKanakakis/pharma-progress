import GroupRepresentation from '@keycloak/keycloak-admin-client/lib/defs/groupRepresentation';
import { Logger, Injectable } from '@nestjs/common';
import { KepResourceRole } from '../authbroker.constants';
import { KeycloakAdminService } from './keycloak-admin.service';

/**
 * Find by name in a keycloak group
 *
 * @param name the name to find
 * @param groupRepresentation the group representation
 * @returns an array with all matches
 */
const findByNameInGroupRecursively = (
    name: string,
    groupRepresentation: GroupRepresentation[],
): GroupRepresentation[] => {
    const matches = [];
    for (let g of groupRepresentation) {
        if (g.name == name) {
            matches.push(g);
        } else {
            const children = findByNameInGroupRecursively(name, g.subGroups);
            if (children.length > 0) {
                matches.push(children);
            }
        }
    }
    return matches;
};

/**
 * Find by path in a keycloak group
 *
 * @param path the path to find
 * @param groupRepresentation the group representation
 * @returns an array with all matches
 */
const findByPathInGroupRecursively = (
    path: string,
    groupRepresentation: GroupRepresentation[],
): GroupRepresentation[] => {
    const matches = [];
    for (let g of groupRepresentation) {
        if (g.path == path) {
            matches.push(g);
        } else {
            const children = findByPathInGroupRecursively(path, g.subGroups);
            if (children.length > 0) {
                matches.push(children);
            }
        }
    }
    return matches;
};

@Injectable()
export class KeycloakGroupsService {
    private readonly logger = new Logger(KeycloakGroupsService.name);

    private readonly USERS_GROUP_NAME = 'users';
    private readonly USERS_GROUP_PATH = '/users';
    private readonly KEP_GROUP_NAME = 'kep';
    private readonly KEP_GROUP_PATH = '/kep';

    constructor(private readonly keycloakAdminService: KeycloakAdminService) {}

    /**
     * Get or create the top level USERS group.
     * @returns the id of the group
     */
    public async getOrCreateTopLevelUsersGroup(): Promise<string> {
        const candidates = await this.keycloakAdminService.searchGroupsByName(
            this.USERS_GROUP_NAME,
        );
        const groups = findByPathInGroupRecursively(
            this.USERS_GROUP_PATH,
            candidates,
        );
        if (groups.length > 0) {
            return groups[0].id;
        } else {
            // create if missing
            const { id } = await this.keycloakAdminService.createGroup(
                this.USERS_GROUP_NAME,
            );
            return id;
        }
    }

    /**
     * Get or create the top level KEP group.
     * @returns the id of the group
     */
    public async getOrCreateTopLevelKepGroup(): Promise<string> {
        const candidates = await this.keycloakAdminService.searchGroupsByName(
            this.KEP_GROUP_NAME,
        );
        const groups = findByPathInGroupRecursively(
            this.KEP_GROUP_PATH,
            candidates,
        );
        if (groups.length > 0) {
            return groups[0].id;
        } else {
            // create if missing
            const { id } = await this.keycloakAdminService.createGroup(
                this.KEP_GROUP_NAME,
            );
            return id;
        }
    }

    public async getOrCreatPHARMAGroup(
        id: string | number,
        kepResourceRole: KepResourceRole,
    ) {
        const kepResourceRoleGroup = this.kepResourceRoleGroup(
            id,
            kepResourceRole,
        );
        const searchResults =
            await this.keycloakAdminService.searchGroupsByName(
                kepResourceRoleGroup.name,
            );
        const groups = findByPathInGroupRecursively(
            kepResourceRoleGroup.path,
            searchResults,
        );
        if (groups.length > 0) {
            return groups[0].id;
        } else {
            // create if missing
            const topLevelKepGroupId = await this.getOrCreateTopLevelKepGroup();
            const { id: groupId } =
                await this.keycloakAdminService.createChildGroup(
                    topLevelKepGroupId,
                    kepResourceRoleGroup.name,
                );
            return groupId;
        }
    }

    /**
     * Get the name and path of a resource role group in a kep.
     * @param id the kep id
     * @param kepResourceRole the resource role group
     * @returns name and path
     */
    public kepResourceRoleGroup(
        id: string | number,
        kepResourceRole: KepResourceRole,
    ) {
        const roleGroupName = `${this.KEP_GROUP_NAME}-${id}-${kepResourceRole}`;
        const roleGroupPath = `${this.KEP_GROUP_PATH}/${roleGroupName}`;
        return {
            name: roleGroupName,
            path: roleGroupPath,
        };
    }
}
