import ResourceRepresentation from '@keycloak/keycloak-admin-client/lib/defs/resourceRepresentation';
import ScopeRepresentation from '@keycloak/keycloak-admin-client/lib/defs/scopeRepresentation';

export interface ProtectionResourceRepresentation
    extends ResourceRepresentation {
    resource_scopes?: ScopeRepresentation[];
}
