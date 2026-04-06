import type { AxiosResponse } from 'axios';
import { BACKEND_ERROR_CODE, createFlatRequest } from '@sa/axios';
import { useAuthStore } from '@/store/modules/auth';
import { getServiceBaseURL } from '@/utils/service';
import { $t } from '@/locales';
import { getAuthorization, handleExpiredRequest, showErrorMsg } from './shared';
import type { RequestInstanceState } from './type';

const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
const { baseURL, otherBaseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);

// Main request instance
export const request = createFlatRequest(
  {
    baseURL,
    headers: {}
  },
  {
    defaultState: {
      errMsgStack: [],
      refreshTokenPromise: null
    } as RequestInstanceState,
    transform(response: AxiosResponse<App.Service.Response<any>>) {
      // For successful requests, return the data
      // For errors with errCode === -1, show error message and return the full response
      if ('errCode' in response.data && response.data.errCode === -1) {
        showErrorMsg(request.state, response.data.msg || $t('common.error'));
        return response.data;
      }
      return response.data.data;
    },
    async onRequest(config) {
      const Authorization = getAuthorization();
      const lang = localStorage.getItem('lang') || 'en';
      const cookieLangValue = lang === 'zhHans' ? 'zh-Hans' : lang;

      Object.assign(config.headers, {
        'Content-Type': 'application/json',
        Authorization,
        'Facade-Language': `c=${cookieLangValue}|uic=${cookieLangValue}`
      });

      return config;
    },
    isBackendSuccess(response) {
      // Support both errCode !== -1 (sjc_vuetify style) and code === successCode (soybean-admin style)
      if ('errCode' in response.data) {
        return response.data.errCode !== -1;
      }
      return String(response.data.code) === import.meta.env.VITE_SERVICE_SUCCESS_CODE;
    },
    async onBackendFail(response, instance) {
      const authStore = useAuthStore();
      const responseCode = 'code' in response.data ? String(response.data.code) : '';
      const responseErrCode = 'errCode' in response.data ? String(response.data.errCode) : '';

      // Handle token expiration
      const expiredTokenCodes = import.meta.env.VITE_SERVICE_EXPIRED_TOKEN_CODES?.split(',') || [];
      if (expiredTokenCodes.includes(responseCode) || expiredTokenCodes.includes(responseErrCode)) {
        const success = await handleExpiredRequest(request.state);
        if (success) {
          const Authorization = getAuthorization();
          Object.assign(response.config.headers, { Authorization });
          return instance.request(response.config) as Promise<AxiosResponse>;
        }
      }

      // Handle logout codes
      const logoutCodes = import.meta.env.VITE_SERVICE_LOGOUT_CODES?.split(',') || [];
      if (logoutCodes.includes(responseCode) || logoutCodes.includes(responseErrCode)) {
        authStore.resetStore();
        return null;
      }

      // Handle modal logout codes
      const modalLogoutCodes = import.meta.env.VITE_SERVICE_MODAL_LOGOUT_CODES?.split(',') || [];
      if (modalLogoutCodes.includes(responseCode) || modalLogoutCodes.includes(responseErrCode)) {
        let errorMsg = '';
        if ('msg' in response.data && response.data.msg) {
          errorMsg = response.data.msg;
        } else if ('message' in response.data && typeof response.data.message === 'string') {
          errorMsg = response.data.message;
        }

        if (!request.state.errMsgStack?.includes(errorMsg)) {
          request.state.errMsgStack = [...(request.state.errMsgStack || []), errorMsg];

          const handleLogout = () => authStore.resetStore();
          window.addEventListener('beforeunload', handleLogout);

          window.$dialog?.error({
            title: $t('common.error'),
            content: errorMsg || $t('common.error'),
            positiveText: $t('common.confirm'),
            maskClosable: false,
            closeOnEsc: false,
            onPositiveClick() {
              handleLogout();
              window.removeEventListener('beforeunload', handleLogout);
              request.state.errMsgStack = request.state.errMsgStack.filter(msg => msg !== errorMsg);
            },
            onClose() {
              handleLogout();
              window.removeEventListener('beforeunload', handleLogout);
              request.state.errMsgStack = request.state.errMsgStack.filter(msg => msg !== errorMsg);
            }
          });
        }
        return null;
      }

      return null;
    },
    onError(error) {
      let message = error.message;
      let backendErrorCode = '';

      if (error.code === BACKEND_ERROR_CODE && error.response?.data) {
        if ('msg' in error.response.data && typeof error.response.data.msg === 'string') {
          message = error.response.data.msg || message;
        }
        if ('message' in error.response.data && typeof error.response.data.message === 'string') {
          message = error.response.data.message || message;
        }
        if ('code' in error.response.data) {
          backendErrorCode = String(error.response.data.code);
        }
        if ('errCode' in error.response.data) {
          backendErrorCode = String(error.response.data.errCode);
        }
      }

      // Skip error message for modal logout and expired token codes
      const modalLogoutCodes = import.meta.env.VITE_SERVICE_MODAL_LOGOUT_CODES?.split(',') || [];
      const expiredTokenCodes = import.meta.env.VITE_SERVICE_EXPIRED_TOKEN_CODES?.split(',') || [];

      if (!modalLogoutCodes.includes(backendErrorCode) && !expiredTokenCodes.includes(backendErrorCode) && message) {
        showErrorMsg(request.state, message);
      }
    }
  }
);

// Demo request instance - simplified implementation
export const demoRequest = {
  baseURL: otherBaseURL.demo,
  state: {
    errMsgStack: [],
    refreshTokenPromise: null
  } as RequestInstanceState,

  async request<T>(config: any): Promise<T> {
    const { headers = {}, url, method = 'get', data } = config;

    // Add headers
    const token = localStorage.getItem('token');
    const Authorization = token ? `Bearer ${token}` : '';
    const lang = localStorage.getItem('lang') || 'en';
    const cookieLangValue = lang === 'zhHans' ? 'zh-Hans' : lang;

    Object.assign(headers, {
      'Content-Type': 'application/json',
      Authorization,
      'Facade-Language': `c=${cookieLangValue}|uic=${cookieLangValue}`
    });

    // Simple implementation for demo purposes
    try {
      // For demo, we'll just return the data wrapped in a result structure
      console.log('Demo request:', { url, method, data, headers });
      return { result: data } as T;
    } catch (error) {
      console.error('Demo request error:', error);
      throw error;
    }
  }
};
