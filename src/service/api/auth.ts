import { request } from '../request';

/**
 * Login
 *
 * @param email User email
 * @param password Password
 */
export function fetchLogin(email: string, password: string) {
  return request<Api.Auth.LoginResponse>({
    url: '/user/login',
    method: 'post',
    data: {
      email,
      password
    }
  });
}

/** Get user info */
export function fetchGetUserInfo() {
  return request<Api.Auth.UserInfo>({ url: '/auth/getUserInfo' });
}

/**
 * Refresh token
 *
 * @param refreshToken Refresh token
 */
export function fetchRefreshToken(refreshToken: string) {
  return request<Api.Auth.LoginToken>({
    url: '/auth/refreshToken',
    method: 'post',
    data: {
      refreshToken
    }
  });
}

/**
 * return custom backend error
 *
 * @param code error code
 * @param msg error message
 */
export function fetchCustomBackendError(code: string, msg: string) {
  return request({ url: '/auth/error', params: { code, msg } });
}
