import {
  BASE_URL } from '../../common';
import {environment} from '../../../environments/environment';

// SIGN IN
export const OAUTH2_SIGN_IN_PATH = '/oauth2/sign_in';
export const getSignInUrlByCurrentWindowLocation = (currentWindowLocation: string) => {
  const currenWindowtLocationUrlEncoded = encodeURIComponent(currentWindowLocation);
  return `${BASE_URL}${OAUTH2_SIGN_IN_PATH}?rd=${currenWindowtLocationUrlEncoded}`;
};

// SIGN OUT
export const OAUTH2_SIGN_OUT_PATH = '/oauth2/sign_out';
export const KEYCLOAK_SIGN_OUT_PATH = `/realms/${environment.KEYCLOAK_REALM}/protocol/openid-connect/logout`;
export const SIGN_OUT_URL = `${environment.KEYCLOAK_URL}${KEYCLOAK_SIGN_OUT_PATH}?redirect_uri=${environment.BASE_URL}${OAUTH2_SIGN_OUT_PATH}`;

// OAUTH2 PROXY
export const OAUTH2_AUTH_PATH = '/oauth2/auth';
export const OAUTH2_USER_INFO_PATH = '/oauth2/userinfo';

// USER PROFILE
export const USER_PROFILE_PATH = '/auth/profile';
export const USER_PROFILE_URL = `${environment.API_BASE_URL}${USER_PROFILE_PATH}`;
export const USER_UPDATE_URL = `${environment.API_BASE_URL}/auth/users`;

export const KEYCLOAK_ADMIN_TOKEN_URL = `${environment.KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`;
export const KEYCLOAK_USER_TOKEN_URL = `${environment.KEYCLOAK_URL}/realms/${environment.KEYCLOAK_REALM}/protocol/openid-connect/token`;
export const KEYCLOAK_REGISTER_USER_URL = `${environment.KEYCLOAK_URL}/admin/realms/${environment.KEYCLOAK_REALM}/users`;
export const KEYCLOAK_LOGIN_USER_URL = `${environment.KEYCLOAK_URL}/realms/${environment.KEYCLOAK_REALM}/account`;
export const USER_INFO_URL = `${environment.KEYCLOAK_URL}/realms/${environment.KEYCLOAK_REALM}/protocol/openid-connect/userinfo`;
export const KEYCLOAK_AUTH = `${environment.KEYCLOAK_URL}/realms/${environment.KEYCLOAK_REALM}/protocol/openid-connect/auth`;
export const KEYCLOAK_LOGIN = `${environment.KEYCLOAK_URL}/realms/${environment.KEYCLOAK_REALM}/protocol/openid-connect/auth`;
