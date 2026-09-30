import { request } from '../request';

/** GET /user/session — current login user / company / branch */
export function getUserSession() {
  return request<Api.App.UserSession>({
    url: '/user/session',
    method: 'get'
  });
}

/** POST /user/switch-branch */
export function switchBranch(data: { branch_pks: string[] }) {
  return request<{ accessToken?: string }>({
    url: '/user/switch-branch',
    method: 'post',
    data
  });
}

/** POST /user/change-password */
export interface UserChangePasswordInput {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function changePassword(data: UserChangePasswordInput) {
  return request({
    url: '/user/change-password',
    method: 'post',
    data: {
      pwd_old: data.oldPassword,
      pwd_new: data.newPassword,
      pwd_new2: data.confirmPassword
    }
  });
}

/** POST /user/logout */
export function logoutUser(data?: { refresh_token?: string }) {
  return request({
    url: '/user/logout',
    method: 'post',
    data: data ?? {}
  });
}
