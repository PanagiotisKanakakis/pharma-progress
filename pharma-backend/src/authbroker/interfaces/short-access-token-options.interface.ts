export enum ResourceTypes {
    CASE = 'case',
    FILE = 'file',
}

export enum PermissionTypes {
    READ,
    WRITE,
    READWRITE,
}

export interface ShortAccessTokenOptions {
    resourceType: ResourceTypes;
    permissions: PermissionTypes;
    resourceField: string;
    tokenField: string;
}
