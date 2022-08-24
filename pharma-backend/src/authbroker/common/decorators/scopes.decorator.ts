import { SetMetadata } from '@nestjs/common';
import { ScopeDecoratorOptionsInterface } from '../../interfaces';

export const META_SCOPES = 'scopes';

/**
 * Keycloak Authorization Scopes.
 * @param scopesMetadata - scopes that are associated with the resource
 */
export const Scopes = (scopesMetadata: ScopeDecoratorOptionsInterface) =>
    SetMetadata(META_SCOPES, scopesMetadata);
