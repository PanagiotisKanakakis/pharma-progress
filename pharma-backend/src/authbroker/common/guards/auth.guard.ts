import {
    CanActivate,
    ExecutionContext,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as KeycloakConnect from 'keycloak-connect';
import { TokenValidation } from '../../authbroker.constants';
import {
    META_SKIP_AUTH,
    META_UNPROTECTED,
} from '../decorators';
import { KeycloakConnectService } from '../../keycloak';

/**
 * An authentication guard. Will return a 401 unauthorized when it is unable to
 * verify the JWT token or Bearer header is missing.
 */
@Injectable()
export class AuthGuard implements CanActivate {
    private readonly logger = new Logger(AuthGuard.name);

    constructor(
        private keycloakConnectService: KeycloakConnectService,
        private readonly reflector: Reflector,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isUnprotected = this.reflector.getAllAndOverride<boolean>(
            META_UNPROTECTED,
            [context.getClass(), context.getHandler()],
        );
        const skipAuth = this.reflector.getAllAndOverride<boolean>(
            META_SKIP_AUTH,
            [context.getClass(), context.getHandler()],
        );

        // If unprotected is set skip Keycloak authentication
        if (isUnprotected && skipAuth) {
            return true;
        }

        // Extract request/response
        const request = context.switchToHttp().getRequest();
        const jwt = this.extractJwt(request.headers);
        const isJwtEmpty = jwt === null || jwt === undefined;

        // Empty jwt, but skipAuth = false, isUnprotected = true allow fallback
        if (isJwtEmpty && !skipAuth && isUnprotected) {
            this.logger.verbose(
                'Empty JWT, skipAuth disabled, and a publicly marked route, allowed for fallback',
            );
            return true;
        }

        // Empty jwt given, immediate return
        if (isJwtEmpty) {
            this.logger.verbose('Empty JWT, unauthorized');
            throw new UnauthorizedException();
        }

        this.logger.verbose(`User JWT: ${jwt}`);

        const isValidToken = await this.validateToken(jwt);

        if (isValidToken) {
            // Attach user info object
            request.user = this.parseToken(jwt);
            // Attach raw access token JWT extracted from bearer/cookie
            request.accessTokenJWT = jwt;

            // Write jwt as a bearer authorization header.
            // This is important in order for keycloak authorization services to work correctly.
            // The reason is that keycloak connect tries to find the original jwt at that location
            // when checking permissions with the grant manager.
            // (see https://github.com/keycloak/keycloak-nodejs-connect/blob/main/middleware/auth-utils/grant-manager.js)
            if (!request.headers.authorization) {
                request.headers.authorization = `Bearer ${jwt}`;
            }

            this.logger.verbose(
                `Authenticated User: ${JSON.stringify(request.user)}`,
            );
            return true;
        }

        throw new UnauthorizedException();
    }

    private async validateToken(jwt: any) {
        const tokenValidation =
            this.keycloakConnectService.getTokenValidation() ||
            TokenValidation.ONLINE;

        const gm = this.keycloakConnectService.getGrantManager();
        let grant: KeycloakConnect.Grant;

        try {
            grant = await gm.createGrant({ access_token: jwt });
        } catch (ex) {
            this.logger.warn(`Cannot validate access token: ${ex}`);
            // It will fail to create grants on invalid access token (i.e expired or wrong domain)
            return false;
        }

        const token = grant.access_token;

        this.logger.verbose(
            `Using token validation method: ${tokenValidation.toUpperCase()}`,
        );

        try {
            let result: boolean | KeycloakConnect.Token;

            switch (tokenValidation) {
                case TokenValidation.ONLINE:
                    result = await gm.validateAccessToken(token);
                    return result === token;
                case TokenValidation.OFFLINE:
                    result = await gm.validateToken(token, 'Bearer');
                    return result === token;
                case TokenValidation.NONE:
                    return true;
                default:
                    this.logger.warn(
                        `Unknown validation method: ${tokenValidation}`,
                    );
                    return false;
            }
        } catch (ex) {
            this.logger.warn(`Cannot validate access token: ${ex}`);
        }

        return false;
    }

    private extractJwt(headers: { [key: string]: string }) {
        if (headers && 'x-forwarded-access-token' in headers) {
            const entry = headers['x-forwarded-access-token'];
            if (entry !== undefined) {
                this.logger.verbose(
                    'Found jwt access token in x-forwarded-access-token',
                );
                return entry;
            }
        }

        if (headers && !headers.authorization) {
            this.logger.verbose(`No authorization header`);
            return null;
        }

        const auth = headers.authorization.split(' ');

        // We only allow bearer
        if (auth[0].toLowerCase() !== 'bearer') {
            this.logger.verbose(`No bearer header`);
            return null;
        }

        return auth[1];
    }

    private parseToken(token: string): string {
        const parts = token.split('.');
        return JSON.parse(Buffer.from(parts[1], 'base64').toString());
    }
}
