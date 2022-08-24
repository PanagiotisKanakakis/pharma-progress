import { SetMetadata } from '@nestjs/common';
import { ShortAccessTokenOptions } from '../../interfaces';

export const META_SHORT_ACCESS_TOKEN_OPTIONS = 'short-access-token-options';

export const ShortAccessToken = (
    shortAccessTokenMetaData: ShortAccessTokenOptions,
) => SetMetadata(META_SHORT_ACCESS_TOKEN_OPTIONS, shortAccessTokenMetaData);
