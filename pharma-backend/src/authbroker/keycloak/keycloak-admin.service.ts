import { Logger, Injectable } from '@nestjs/common';
import KcAdminClient from '@keycloak/keycloak-admin-client';
import { ConfigService } from '@nestjs/config';
import { Credentials } from '@keycloak/keycloak-admin-client/lib/utils/auth';
import RoleRepresentation from '@keycloak/keycloak-admin-client/lib/defs/roleRepresentation';
import {
    RealmRole,
    KepResourceRole,
    ROLE_REALM_PREFIX,
} from '../authbroker.constants';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { ProtectionResourceRepresentation } from '../interfaces';
import GroupRepresentation from '@keycloak/keycloak-admin-client/lib/defs/groupRepresentation';

@Injectable()
export class KeycloakAdminService {
    public static readonly TOKEN_EXPIRATION_SECONDS_BEFORE = 60;

    private readonly logger = new Logger(KeycloakAdminService.name);
    private kcAdminClient: KcAdminClient;
    private clientCredentials: Credentials;
    private accessToken: string;
    private protectionApiUrl: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
    ) {
        this.kcAdminClient = new KcAdminClient({
            baseUrl: this.configService.get('PHARMA_KEYCLOAK_URL'),
            realmName: this.configService.get('PHARMA_KEYCLOAK_REALM'),
        });
        this.clientCredentials = {
            grantType: 'client_credentials',
            clientId: this.configService.get('PHARMA_CLIENT_ID'),
            clientSecret: this.configService.get('PHARMA_CLIENT_SECRET'),
        };
        this.protectionApiUrl = `${this.configService.get(
            'PHARMA_KEYCLOAK_URL',
        )}/realms/${this.configService.get(
            'PHARMA_KEYCLOAK_REALM',
        )}/authz/protection`;
    }

    /**
     * Get a keycloak user.
     * @param keycloakId the keycloak user identifier
     * @returns the user representation of keycloak
     */
    public async getUser(keycloakId: string): Promise<UserRepresentation> {
        await this.lazyAcquireAccessToken();
        return await this.kcAdminClient.users.findOne({ id: keycloakId });
    }

    /**
     * Get a user by username
     * @param username the username
     * @returns a user or undefined
     */
    public async getUserByUsername(
        username: string,
    ): Promise<UserRepresentation | undefined> {
        await this.lazyAcquireAccessToken();
        return await this.kcAdminClient.users
            .find({
                username: username,
                exact: true,
            })
            .then((r) => r[0])
            .catch((e) => undefined);
    }

    /**
     * Create a user in keycloak
     * @param user the user representation
     * @returns the user id
     */
    public async createUser(user: UserRepresentation): Promise<{ id: string }> {
        await this.lazyAcquireAccessToken();
        return await this.kcAdminClient.users.create(user);
    }

    /**
     * Get a keycloak user.
     * @param keycloakId the keycloak user identifier
     * @param payload the user representation
     * @returns the user representation of keycloak
     */
    public async updateUser(
        keycloakId: string,
        payload: UserRepresentation,
    ): Promise<void> {
        await this.lazyAcquireAccessToken();
        return await this.kcAdminClient.users.update(
            { id: keycloakId },
            payload,
        );
    }

    /**
     * Get the keycloak representation of a role.
     *
     * @param role the role
     * @returns the keycloak representation
     */
    public async getRole(role: RealmRole): Promise<RoleRepresentation> {
        await this.lazyAcquireAccessToken();
        const roleName = role.replace(ROLE_REALM_PREFIX, '');
        return await this.kcAdminClient.roles.findOneByName({ name: roleName });
    }

    /**
     * Get all keycloak client roles representation.
     */
    public async getRoles(): Promise<RoleRepresentation[]> {
        await this.lazyAcquireAccessToken();
        return await this.kcAdminClient.roles.find();
    }

    /**
     * Add a user role mapping
     * @param id the keycloak user id
     * @param role the realm role
     */
    public async addUserRoleMapping(
        id: string,
        role: RealmRole,
    ): Promise<void> {
        await this.lazyAcquireAccessToken();
        const roleRepresentation = await this.getRole(role);
        await this.kcAdminClient.users.addRealmRoleMappings({
            id: id,
            roles: [
                {
                    id: roleRepresentation.id,
                    name: roleRepresentation.name,
                },
            ],
        });
    }

    /**
     * Search groups
     * @param groupName the group name
     * @returns the group representations
     */
    public async searchGroupsByName(
        name: string,
    ): Promise<GroupRepresentation[]> {
        this.logger.verbose(`Looking up for group ${name}.`);
        await this.lazyAcquireAccessToken();
        return await this.kcAdminClient.groups
            .find({
                search: name,
            })
            .catch((e) => {
                this.logger.verbose('Failed to find: ' + e);
                return [];
            });
    }

    /**
     * Create a top level group.
     * @param name the name of the group
     * @returns the id of the group
     */
    public async createGroup(name: string): Promise<{ id: string }> {
        await this.lazyAcquireAccessToken();
        return await this.kcAdminClient.groups.create({
            name: name,
        });
    }

    /**
     * Create a child group
     * @param parent_group_id the parent id group
     * @param name the name of the group
     * @returns the id of the group
     */
    public async createChildGroup(
        parent_group_id: string,
        name: string,
    ): Promise<{ id: string }> {
        await this.lazyAcquireAccessToken();
        return await this.kcAdminClient.groups.setOrCreateChild(
            {
                id: parent_group_id,
            },
            {
                name: name,
            },
        );
    }

    /**
     * Add a user to a group
     * @param id the keycloak user id
     * @param groupId the keycloak group id
     * @returns a string
     */
    public async addUserToGroup(id: string, groupId: string) {
        this.logger.debug(`Adding user ${id} to group ${groupId}`);
        return await this.kcAdminClient.users.addToGroup({
            id: id,
            groupId: groupId,
        });
    }

    /**
     * Delete a user from a group
     * @param id the user id in keycloak
     * @param groupId the group id in keycloak
     * @returns a string
     */
    public async deleteUserFromGroup(id: string, groupId: string) {
        return await this.kcAdminClient.users.delFromGroup({
            id: id,
            groupId: groupId,
        });
    }

    /**
     * Create a protection resource. The scopes of the resource are automatically populated to
     * all available scopes in `@ResourceScope`.
     * @param name the name of the resource
     * @param type the type of the resource
     * @param uris the uris of the resource
     * @returns the resource representation
     */
    public async createProtectionResource(
        name: string,
        type: string,
        uris: string[],
    ): Promise<ProtectionResourceRepresentation> {
        await this.lazyAcquireAccessToken();
        const response = await lastValueFrom(
            this.httpService.post(
                `${this.protectionApiUrl}/resource_set`,
                {
                    name: name,
                    type: `urn:${this.clientCredentials.clientId}:resources:${type}`,
                    uris: uris,
                    scopes: [KepResourceRole.Clerk, KepResourceRole.Head],
                },
                {
                    headers: { Authorization: 'Bearer ' + this.accessToken },
                },
            ),
        );
        return response.data;
    }

    /**
     * Get a protection resource by id
     * @param id the id
     * @returns a protection resource representation
     */
    public async getProtectionResourceById(id: string): Promise<string> {
        await this.lazyAcquireAccessToken();
        const url = `${this.protectionApiUrl}/resource_set/${id}`;
        const response = await lastValueFrom(
            this.httpService.get(url, {
                headers: { Authorization: 'Bearer ' + this.accessToken },
            }),
        );
        return response.data;
    }

    /**
     * Get protection resource by name. Does an exact search.
     * @param name the name
     * @returns an array of resource identifiers
     */
    public async getProtectionResourcesByName(name: string): Promise<string[]> {
        await this.lazyAcquireAccessToken();
        const url = `${this.protectionApiUrl}/resource_set`;
        const response = await lastValueFrom(
            this.httpService.get(url, {
                headers: { Authorization: 'Bearer ' + this.accessToken },
                params: {
                    name: name,
                    exactName: true,
                },
            }),
        );
        return response.data;
    }

    /**
     * Get protection resource by uri
     * @param uri the uri
     * @returns an array of resource identifiers
     */
    public async getProtectionResourcesByUri(uri: string): Promise<string[]> {
        await this.lazyAcquireAccessToken();
        const url = `${this.protectionApiUrl}/resource_set`;
        const response = await lastValueFrom(
            this.httpService.get(url, {
                headers: { Authorization: 'Bearer ' + this.accessToken },
                params: {
                    uri: uri,
                },
            }),
        );
        return response.data;
    }

    /**
     * Initialize an access token if current access token is missing
     * or is expired.
     */
    private async lazyAcquireAccessToken(): Promise<void> {
        if (this.isExpiredToken(this.accessToken)) {
            this.logger.debug(
                'Acquiring new client service account access token',
            );
            await this.kcAdminClient.auth(this.clientCredentials);
            this.accessToken = await this.kcAdminClient.getAccessToken();
        }
    }

    /**
     * Parse an access token
     *
     * @param token  the access token
     * @returns the parsed token
     */
    private parseToken(token: string): any {
        const parts = token.split('.');
        return JSON.parse(Buffer.from(parts[1], 'base64').toString());
    }

    /**
     * Check whether an access token has expired.
     *
     * @param token  the token
     * @returns true or false
     */
    private isExpiredToken(token: string): boolean {
        if (!token) {
            return true;
        }
        const jwt = this.parseToken(token);
        const exp = jwt['exp'];
        if (!exp) {
            return true;
        }
        const current_time = new Date().getTime() / 1000;
        if (
            current_time >
            exp - KeycloakAdminService.TOKEN_EXPIRATION_SECONDS_BEFORE
        ) {
            this.logger.debug(
                `Token expired or is about to expire since ${current_time} > ${exp} - ${KeycloakAdminService.TOKEN_EXPIRATION_SECONDS_BEFORE}`,
            );
            return true;
        }
        return false;
    }
}
