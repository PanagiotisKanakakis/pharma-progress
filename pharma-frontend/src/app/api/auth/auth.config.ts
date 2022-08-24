import {API_BASE_URL,
  BASE_URL,
  KEYCLOAK_REALM,
  PHARMA_KEYCLOAK_URL} from '../../common';

// SIGN IN
export const OAUTH2_SIGN_IN_PATH = '/oauth2/sign_in';
export const getSignInUrlByCurrentWindowLocation = (currentWindowLocation: string) => {
  const currenWindowtLocationUrlEncoded = encodeURIComponent(currentWindowLocation);
  return `${BASE_URL}${OAUTH2_SIGN_IN_PATH}?rd=${currenWindowtLocationUrlEncoded}`;
};

// SIGN OUT
export const OAUTH2_SIGN_OUT_PATH = '/oauth2/sign_out';
export const KEYCLOAK_SIGN_OUT_PATH = `/realms/${KEYCLOAK_REALM}/protocol/openid-connect/logout`;
export const SIGN_OUT_URL = `${PHARMA_KEYCLOAK_URL}${KEYCLOAK_SIGN_OUT_PATH}?redirect_uri=${BASE_URL}${OAUTH2_SIGN_OUT_PATH}`;

// OAUTH2 PROXY
export const OAUTH2_AUTH_PATH = '/oauth2/auth';
export const OAUTH2_USER_INFO_PATH = '/oauth2/userinfo';

// USER PROFILE
export const USER_PROFILE_PATH = '/auth/profile';
export const USER_PROFILE_URL = `${API_BASE_URL}${USER_PROFILE_PATH}`;

export const KEYCLOAK_TOKEN_URL = `${PHARMA_KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
export const USER_INFO_URL = `${PHARMA_KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/userinfo`;
export const KEYCLOAK_AUTH = `${PHARMA_KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/auth`;
export const KEYCLOAK_LOGIN = `${PHARMA_KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/auth`;
