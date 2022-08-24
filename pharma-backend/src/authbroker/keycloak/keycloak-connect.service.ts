import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import KeycloakConnect from 'keycloak-connect';
import {
    PolicyEnforcementMode,
    TokenValidation,
} from '../authbroker.constants';

@Injectable()
export class KeycloakConnectService {
    private readonly logger = new Logger(KeycloakConnectService.name);
    private keycloak: KeycloakConnect.Keycloak;
    private tokenValidation: TokenValidation;
    private policyEnforcementMode: PolicyEnforcementMode;

    constructor(private readonly configService: ConfigService) {
        this.logger.log('Initializing keycloak provider');

        this.tokenValidation = this.configService.get(
            'PHARMA_TOKEN_VALIDATION',
        );
        this.logger.log(
            `Using default token validation policy: ${this.tokenValidation}.`,
        );
        this.policyEnforcementMode = PolicyEnforcementMode.PERMISSIVE;

        const keycloakOpts: any = {
            authServerUrl: this.configService.get('PHARMA_KEYCLOAK_URL'),
            realm: this.configService.get('PHARMA_KEYCLOAK_REALM'),
            clientId: this.configService.get('PHARMA_CLIENT_ID'),
            secret: this.configService.get('PHARMA_CLIENT_SECRET'),
            public: false,
            // optional loglevels. default is verbose
            logLevels: ['verbose'], // warn
            useNestLogger: false,
            // optional, already defaults to permissive
            policyEnforcement: this.getPolicyEnforcementMode(),
            // optional, already defaults to online validation
            tokenValidation: this.getTokenValidation(),
        };

        const keycloak: any = new KeycloakConnect({}, keycloakOpts);

        // Access denied is called, add a flag to request so our resource guard knows
        keycloak.accessDenied = (req: any, res: any, next: any) => {
            req.resourceDenied = true;
            next();
        };

        this.keycloak = keycloak;
    }

    public getKeycloak(): KeycloakConnect.Keycloak {
        return this.keycloak;
    }

    public getGrantManager(): KeycloakConnect.GrantManager {
        return this.keycloak.grantManager;
    }

    public async getGrant(req: Request, res: Response): Promise<any> {
        return await this.keycloak.getGrant(req, res);
    }

    public getTokenValidation(): TokenValidation {
        return this.tokenValidation;
    }

    public getPolicyEnforcementMode(): PolicyEnforcementMode {
        return this.policyEnforcementMode;
    }
}
