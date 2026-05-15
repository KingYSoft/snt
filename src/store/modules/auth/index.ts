import { computed, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { defineStore } from 'pinia';
import { useLoading } from '@sa/hooks';
import { fetchLogin } from '@/service/api';
import { useRouterPush } from '@/hooks/common/router';
import { localStg } from '@/utils/storage';
import { SetupStoreId } from '@/enum';
import { $t } from '@/locales';
import { useRouteStore } from '../route';
import { useTabStore } from '../tab';
import { useAppStore } from '../app';
import { clearAuthStorage, getToken } from './shared';

export const useAuthStore = defineStore(SetupStoreId.Auth, () => {
  const route = useRoute();
  const routeStore = useRouteStore();
  const tabStore = useTabStore();
  const appStore = useAppStore();
  const { toLogin, redirectFromLogin } = useRouterPush(false);
  const { loading: loginLoading, startLoading, endLoading } = useLoading();

  const token = ref('');

  const userInfo: Api.Auth.UserInfo = reactive({
    userId: '',
    userName: '',
    email_address: '',
    roles: [],
    buttons: []
  });

  /** is super role in static route */
  const isStaticSuper = computed(() => {
    const { VITE_AUTH_ROUTE_MODE, VITE_STATIC_SUPER_ROLE } = import.meta.env;

    return VITE_AUTH_ROUTE_MODE === 'static' && userInfo.roles.includes(VITE_STATIC_SUPER_ROLE);
  });

  /** Is login */
  const isLogin = computed(() => Boolean(token.value));
  console.log('token.value', token.value);

  /** Reset auth store */
  async function resetStore() {
    recordUserId();

    clearAuthStorage();

    // Manually reset state (setup stores don't auto-support $reset)
    token.value = '';
    userInfo.userId = '';
    userInfo.userName = '';
    userInfo.email_address = '';
    userInfo.roles = [];
    userInfo.buttons = [];

    // Also reset app store config
    appStore.resetAppStore();

    if (!route.meta.constant) {
      await toLogin();
    }

    tabStore.cacheTabs();
    routeStore.resetStore();
  }

  /** Record the user ID of the previous login session Used to compare with the current user ID on next login */
  function recordUserId() {
    if (!userInfo.userId) {
      return;
    }

    localStg.set('lastLoginUserId', userInfo.userId);
  }

  /**
   * Check if current login user is different from previous login user If different, clear all tabs
   *
   * @returns {boolean} Whether to clear all tabs
   */
  function checkTabClear(): boolean {
    if (!userInfo.userId) {
      return false;
    }

    const lastLoginUserId = localStg.get('lastLoginUserId');

    // Clear all tabs if current user is different from previous user
    if (!lastLoginUserId || lastLoginUserId !== userInfo.userId) {
      localStg.remove('globalTabs');
      tabStore.clearTabs();

      localStg.remove('lastLoginUserId');
      return true;
    }

    localStg.remove('lastLoginUserId');
    return false;
  }

  /**
   * Login - sjc_vuetify pattern:
   * 1. POST /user/login -> get access_token
   * 2. Store token in sessionStorage + localStorage
   * 3. fetchAppConfig -> GET /app/all/config
   * 4. Redirect to home or redirect URL
   *
   * Route initialization (initAuthRoute) is handled by the route guard.
   */
  async function login(email: string, password: string, redirect = true) {
    startLoading();

    try {
      const { data: loginResponse, error } = await fetchLogin(email, password);

      if (!error && loginResponse?.accessToken) {
        // Step 1 & 2: Store token
        token.value = loginResponse.accessToken;
        sessionStorage.setItem('token', loginResponse.accessToken);
        localStg.set('token', loginResponse.accessToken);
        localStorage.setItem('email', email);

        // Step 3: Fetch app config (user session, permissions, menus)
        await appStore.fetchAppConfig();

        // Step 4: Redirect (route guard will handle initAuthRoute)
        const isClear = checkTabClear();
        const needRedirect = isClear ? false : redirect;
        await redirectFromLogin(needRedirect);
        window.$notification?.success({
          title: $t('page.login.common.loginSuccess'),
          content: $t('page.login.common.welcomeBack', {
            userName: userInfo.userName
          }),
          duration: 4500
        });
      } else {
        window.$notification?.error({
          title: $t('common.error'),
          content: $t('common.error'),
          duration: 4500
        });
        clearAuthStorage();
        token.value = '';
      }
    } catch (err) {
      console.error('Login failed:', err);
      window.$notification?.error({
        title: $t('common.error'),
        content: $t('common.error'),
        duration: 4500
      });
      clearAuthStorage();
      token.value = '';
    } finally {
      endLoading();
    }
  }

  /**
   * Init user info from storage (for page refresh).
   * Called by route guard via routeStore.initAuthRoute.
   * Only restores token; user info comes from fetchAppConfig.
   */
  async function initUserInfo() {
    const maybeToken = getToken();

    if (maybeToken) {
      token.value = maybeToken;
    }
  }

  return {
    token,
    userInfo,
    isStaticSuper,
    isLogin,
    loginLoading,
    resetStore,
    login,
    initUserInfo
  };
});
