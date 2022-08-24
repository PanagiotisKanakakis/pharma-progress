/**
 * Role matching mode.
 */
export enum RoleMatchingMode {
    /**
     * Match all roles
     */
    ALL = 'all',
    /**
     * Match any roles
     */
    ANY = 'any',
}

/**
 * Policy enforcement mode.
 */
export enum PolicyEnforcementMode {
    /**
     * Deny all request when there is no matching resource.
     */
    ENFORCING = 'enforcing',
    /**
     * Allow all request even when there's no matching resource.
     */
    PERMISSIVE = 'permissive',
}

/**
 * Token validation methods.
 */
export enum TokenValidation {
    /**
     * The default validation method, performs live validation via Keycloak servers.
     */
    ONLINE = 'online',
    /**
     * Validate offline against the configured keycloak options.
     */
    OFFLINE = 'offline',
    /**
     * Does not check for any validation. Should only be used for special cases (i.e development, internal networks)
     */
    NONE = 'none',
}

/**
 * Available realm roles in keycloak.
 */
export enum RealmRole {
    Admin = 'realm:admin',
    KepAdmin = 'realm:kepadmin',
    KepManager = 'realm:kepmanager',
    KepUser = 'realm:kepuser',
}

/**
 * Kep office roles inside the system. These roles are
 * translated to scopes and resource policies in keycloak.
 * These roles match the gate roles from the KEP EMPLOYEES
 * KED interoperability.
 */
export enum KepResourceRole {
    /**
     * Elevated priviledges user
     */
    Head = 'head',
    /**
     * Normal user
     */
    Clerk = 'clerk',
}

/**
 * Realm prefix for roles
 */
export const ROLE_REALM_PREFIX: string = 'realm:';
