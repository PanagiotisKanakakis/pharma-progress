import {
    CanActivate,
    ExecutionContext,
    Injectable,
    Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import KeycloakConnect from 'keycloak-connect';
import {
    PolicyEnforcementMode,
    RoleMatchingMode,
} from '../../authbroker.constants';
import {
    META_ENFORCER_OPTIONS,
    META_UNPROTECTED,
    META_RESOURCE,
    META_ROLES,
    META_SCOPES,
} from '../decorators';
import {
    ResourceDecoratorOptions,
    RoleDecoratorOptionsInterface,
    ScopeDecoratorOptionsInterface,
} from '../../interfaces';
import { KeycloakConnectService } from '../../keycloak';

@Injectable()
export class ResourceOrRoleGuard implements CanActivate {
    private readonly logger = new Logger(ResourceOrRoleGuard.name);

    constructor(
        private keycloakConnectService: KeycloakConnectService,
        private readonly reflector: Reflector,
    ) {}

    public async canActivate(context: ExecutionContext): Promise<boolean> {

        this.logger.verbose('Executing resource-or-role guard');

        const votes = [
            this.voteOnPublic(context),
            this.voteOnResource(context),
            this.voteOnRole(context),
        ];
        const voteValues = await Promise.all(votes);

        const anyAllow = voteValues.some((v) => v == Vote.Allow);
        if (anyAllow) {
            this.logger.verbose('Allowing since at least one positive vote');
            return true;
        }
        const anyDeny = voteValues.some((v) => v == Vote.Deny);
        if (anyDeny) {
            this.logger.verbose(
                'Denying since no positive vote and at least one negative',
            );
            return false;
        }

        // Default to permissive
        const pem =
            this.keycloakConnectService.getPolicyEnforcementMode() ||
            PolicyEnforcementMode.PERMISSIVE;
        return pem === PolicyEnforcementMode.PERMISSIVE;
    }

    private async voteOnPublic(context: ExecutionContext): Promise<Vote> {
        const isUnprotected = this.reflector.getAllAndOverride<boolean>(
            META_UNPROTECTED,
            [context.getClass(), context.getHandler()],
        );

        if (isUnprotected) {
            this.logger.verbose(`Route is public, allowed`);
            return Vote.Allow;
        }

        return Vote.Unsure;
    }

    private async voteOnResource(context: ExecutionContext): Promise<Vote> {
        const resourceMetadata =
            this.reflector.getAllAndOverride<ResourceDecoratorOptions>(
                META_RESOURCE,
                [context.getClass(), context.getHandler()],
            );

        // figure out the resource
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const resource: string = this.resolveResource(
            resourceMetadata,
            request,
        );

        if (!resource) {
            return Vote.Unsure;
        }

        const scopesMetaData =
            this.reflector.getAllAndOverride<ScopeDecoratorOptionsInterface>(
                META_SCOPES,
                [context.getClass(), context.getHandler()],
            );

        let scopes = [];
        if (scopesMetaData && scopesMetaData.scopes) {
            scopes = scopesMetaData.scopes;
        }

        if (scopes.length == 0) {
            this.logger.verbose(
                `Protecting resource [ ${resource} ] with any scope`,
            );
        } else {
            this.logger.verbose(
                `Protecting resource [ ${resource} ] with scopes: [ ${scopes} ]`,
            );
        }

        // Build permissions
        const permissions =
            scopes.length == 0
                ? [`${resource}`]
                : scopes.map((scope) => `${resource}:${scope}`);

        if (!request.user) {
            this.logger.verbose(`Route has no user`);
            return Vote.Deny;
        }

        const user = request.user?.preferred_username ?? 'user';

        const enforcerOpts =
            this.reflector.getAllAndOverride<KeycloakConnect.EnforcerOptions>(
                META_ENFORCER_OPTIONS,
                [context.getClass(), context.getHandler()],
            );

        const enforcerFn = createEnforcerContext(
            request,
            response,
            enforcerOpts,
        );
        const isAllowed = await enforcerFn(
            this.keycloakConnectService.getKeycloak(),
            permissions,
        );

        // If statement for verbose logging only
        if (!isAllowed) {
            this.logger.verbose(
                `Resource [ ${resource} ] denied to [ ${user} ]`,
            );
            return Vote.Deny;
        } else {
            this.logger.verbose(
                `Resource [ ${resource} ] granted to [ ${user} ]`,
            );
            return Vote.Allow;
        }
    }

    private async voteOnRole(context: ExecutionContext): Promise<Vote> {
        const rolesMetaData =
            this.reflector.getAllAndOverride<RoleDecoratorOptionsInterface>(
                META_ROLES,
                [context.getClass(), context.getHandler()],
            );

        if (!rolesMetaData || rolesMetaData.roles.length === 0) {
            return Vote.Unsure;
        }

        if (rolesMetaData && !rolesMetaData.mode) {
            rolesMetaData.mode = RoleMatchingMode.ANY;
        }

        const rolesStr = JSON.stringify(rolesMetaData.roles);
        this.logger.verbose(`Roles: ${rolesStr}`);

        // Extract request
        const request = context.switchToHttp().getRequest();
        const { accessTokenJWT } = request;

        if (!accessTokenJWT) {
            // No access token attached, auth guard should have attached the necessary token
            this.logger.warn(
                'No access token found in request, are you sure AuthGuard is first in the chain?',
            );
            return Vote.Unsure;
        }

        // Create grant
        const gm = this.keycloakConnectService.getGrantManager();
        const grant = await gm.createGrant({
            access_token: accessTokenJWT,
        });

        // Grab access token from grant
        const accessToken: KeycloakConnect.Token = grant.access_token as any;

        // For verbose logging, we store it instead of returning it immediately
        const granted =
            rolesMetaData.mode === RoleMatchingMode.ANY
                ? rolesMetaData.roles.some((r) => accessToken.hasRole(r))
                : rolesMetaData.roles.every((r) => accessToken.hasRole(r));

        if (granted) {
            this.logger.verbose(`Resource granted due to role(s)`);
            return Vote.Allow;
        } else {
            this.logger.verbose(`Resource denied due to mismatched role(s)`);
            return Vote.Deny;
        }
    }

    /**
     * Resolve the resource.
     *
     * @param resourceMetadata The resource metadata
     * @param request the request
     * @returns the resource name
     */
    private resolveResource(
        resourceMetadata: ResourceDecoratorOptions,
        request: any,
    ): string {
        const resolvePathParams = (
            resourceMetadata: ResourceDecoratorOptions,
            resource: string,
        ): string => {
            const defaultSupportedParams: string[] = ['id'];
            const paramsToReplace: Set<string> = new Set(
                defaultSupportedParams,
            );
            if (resourceMetadata.resolvePathParams) {
                for (const p of resourceMetadata.resolvePathParams) {
                    paramsToReplace.add(p);
                }
            }

            for (const paramName of paramsToReplace) {
                this.logger.verbose(
                    `Checking whether to replace :${paramName} in resource name.`,
                );
                if (request.params[paramName]) {
                    resource = resource.replace(
                        new RegExp(`:${paramName}`, 'g'),
                        request.params[paramName],
                    );
                }
            }
            return resource;
        };

        let resource = null;
        if (resourceMetadata) {
            if (resourceMetadata.useRequestPathAsName) {
                resource = request.path;
            } else if (resourceMetadata.useRoutePathAsName) {
                resource = request.route.path;
                if (resource.indexOf(':') >= 0) {
                    resource = resolvePathParams(resourceMetadata, resource);
                }
            } else if (resourceMetadata.name) {
                resource = resourceMetadata.name;
                if (resource.indexOf(':') >= 0) {
                    resource = resolvePathParams(resourceMetadata, resource);
                }
            }
        }
        return resource;
    }
}

enum Vote {
    Allow = 'Allow',
    Deny = 'Deny',
    Unsure = 'Unsure',
}

const createEnforcerContext =
    (request: any, response: any, options?: KeycloakConnect.EnforcerOptions) =>
    (keycloak: KeycloakConnect.Keycloak, permissions: string[]) =>
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        new Promise<boolean>((resolve, _) =>
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            keycloak.enforcer(permissions, options)(
                request,
                response,
                (_: any) => {
                    if (request.resourceDenied) {
                        resolve(false);
                    } else {
                        resolve(true);
                    }
                },
            ),
        );
