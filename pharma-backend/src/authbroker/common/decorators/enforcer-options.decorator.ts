import { SetMetadata } from '@nestjs/common';
import * as KeycloakConnect from 'keycloak-connect';

export const META_ENFORCER_OPTIONS = 'enforcer-options';

/**
 * Keycloak enforcer options
 * @param opts - enforcer options
 */
export const EnforcerOptions = (opts: KeycloakConnect.EnforcerOptions) =>
    SetMetadata(META_ENFORCER_OPTIONS, opts);
