import axios from 'axios';
import { UserInfo } from './auth.interfaces';
import {
  getSignInUrlByCurrentWindowLocation, OAUTH2_USER_INFO_PATH,
  SIGN_OUT_URL, USER_INFO_URL,
  USER_PROFILE_URL
} from './auth.config';

// Login / Logout
export const signIn = async () => {
  const windowLocationHref = window.location.href;
  window.location.assign(getSignInUrlByCurrentWindowLocation(windowLocationHref));
};

export const signOut = () => {
  window.location.assign(SIGN_OUT_URL);
};

// User Info
export const getUserInfo = async (headers): Promise<UserInfo> => {
  const { data } = await axios.get(USER_PROFILE_URL,{
    headers: headers
  });
  return data;
};

export const oauth2UserInfo = async (headers): Promise<any> => {
  const { data } = await axios.get(USER_INFO_URL,{
    headers: headers
  });
  return data;
};

// export const updateUserInfo = async (userInfo: UserInfo): Promise<UserInfo> => {
//   const { data: response } = await axios.put(USER_PROFILE_URL + `/${userInfo.id}`, userInfo);
//   return response.data;
// };
