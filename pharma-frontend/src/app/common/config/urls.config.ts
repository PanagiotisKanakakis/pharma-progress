import {environment} from '../../../environments/environment';

export const CURRENT_DOMAIN = 'pharma.test';
export const KEYCLOAK_REALM = 'pharma';

export const BASE_URL = `${environment.HTTP_SCHEME}://${CURRENT_DOMAIN}`;

export const PHARMA_KEYCLOAK_URL = `${environment.HTTP_SCHEME}://auth.${CURRENT_DOMAIN}`;

export const API_BASE_URL = `${BASE_URL}/v1/api`;
