import { SetMetadata } from '@nestjs/common';
import { ResourceDecoratorOptions } from '../../interfaces';

export const META_RESOURCE = 'resource';

/**
 * Keycloak Resource.
 * @param resourceMetadata - resource metadata
 */
export const Resource = (resourceMetadata: ResourceDecoratorOptions) =>
    SetMetadata(META_RESOURCE, resourceMetadata);
