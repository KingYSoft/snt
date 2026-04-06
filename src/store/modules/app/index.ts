import { effectScope, nextTick, onScopeDispose, ref, watch, computed } from 'vue';
import { breakpointsTailwind, useBreakpoints, useEventListener, useTitle } from '@vueuse/core';
import { defineStore } from 'pinia';
import { useBoolean } from '@sa/hooks';
import { router } from '@/router';
import { localStg } from '@/utils/storage';
import { SetupStoreId } from '@/enum';
import { $t, setLocale } from '@/locales';
import { setDayjsLocale } from '@/locales/dayjs';
import { useRouteStore } from '../route';
import { useTabStore } from '../tab';
import { useThemeStore } from '../theme';
import { useAuthStore } from '../auth';
import { fetchAppAllConfig } from '@/service/api/app';

export const useAppStore = defineStore(SetupStoreId.App, () => {
  const themeStore = useThemeStore();
  const routeStore = useRouteStore();
  const tabStore = useTabStore();
  const authStore = useAuthStore();
  const scope = effectScope();
  const breakpoints = useBreakpoints(breakpointsTailwind);
  const { bool: themeDrawerVisible, setTrue: openThemeDrawer, setFalse: closeThemeDrawer } = useBoolean();
  const { bool: reloadFlag, setBool: setReloadFlag } = useBoolean(true);
  const { bool: fullContent, toggle: toggleFullContent } = useBoolean();
  const { bool: contentXScrollable, setBool: setContentXScrollable } = useBoolean();
  const { bool: siderCollapse, setBool: setSiderCollapse, toggle: toggleSiderCollapse } = useBoolean();
  const {
    bool: mixSiderFixed,
    setBool: setMixSiderFixed,
    toggle: toggleMixSiderFixed
  } = useBoolean(localStg.get('mixSiderFixed') === 'Y');

  // App config state
  const configLoading = ref(false);
  const configLoaded = ref(false);
  const appConfig = ref<Api.App.AppConfig>({});
  const menus = ref<Api.App.NavMenuItem[]>([]);
  const allMenus = ref<Api.App.NavMenuItem[]>([]);

  /** Is mobile layout */
  const isMobile = breakpoints.smaller('sm');

  /**
   * Reload page
   *
   * @param duration Duration time
   */
  async function reloadPage(duration = 300) {
    setReloadFlag(false);

    const d = themeStore.page.animate ? duration : 40;

    await new Promise(resolve => {
      setTimeout(resolve, d);
    });

    setReloadFlag(true);
    routeStore.resetRouteCache();
  }

  const locale = ref<App.I18n.LangType>(localStg.get('lang') || 'zh-CN');

  const localeOptions: App.I18n.LangOption[] = [
    {
      label: '中文',
      key: 'zh-CN'
    },
    {
      label: 'English',
      key: 'en-US'
    }
  ];

  function changeLocale(lang: App.I18n.LangType) {
    locale.value = lang;
    setLocale(lang);
    localStg.set('lang', lang);
  }

  /** Update document title by locale */
  function updateDocumentTitleByLocale() {
    const { i18nKey, title } = router.currentRoute.value.meta;

    const documentTitle = i18nKey ? $t(i18nKey) : title;

    useTitle(documentTitle);
  }

  function init() {
    setDayjsLocale(locale.value);
  }

  // watch store
  scope.run(() => {
    // watch isMobile, if is mobile, collapse sider
    watch(
      isMobile,
      newValue => {
        if (newValue) {
          // backup theme setting before is mobile
          localStg.set('backupThemeSettingBeforeIsMobile', {
            layout: themeStore.layout.mode,
            siderCollapse: siderCollapse.value
          });

          themeStore.setThemeLayout('vertical');
          setSiderCollapse(true);
        } else {
          // when is not mobile, recover the backup theme setting
          const backup = localStg.get('backupThemeSettingBeforeIsMobile');

          if (backup) {
            nextTick(() => {
              themeStore.setThemeLayout(backup.layout);
              setSiderCollapse(backup.siderCollapse);

              localStg.remove('backupThemeSettingBeforeIsMobile');
            });
          }
        }
      },
      { immediate: true }
    );

    // watch locale
    watch(locale, () => {
      // update document title by locale
      updateDocumentTitleByLocale();

      // update global menus by locale
      routeStore.updateGlobalMenusByLocale();

      // update tabs by locale
      tabStore.updateTabsByLocale();

      // set dayjs locale
      setDayjsLocale(locale.value);
    });
  });

  // cache mixSiderFixed
  useEventListener(window, 'beforeunload', () => {
    localStg.set('mixSiderFixed', mixSiderFixed.value ? 'Y' : 'N');
  });

  // App config getters
  const userSession = computed(() => appConfig.value.custom?.userSession || {});
  const userDisplayName = computed(() => {
    const session = appConfig.value.custom?.userSession;
    return session?.full_name || session?.login_name || 'User';
  });
  const userInitials = computed(() => {
    const session = appConfig.value.custom?.userSession;
    // Match sjc_vuetify: login_name ?? email_address
    const nn = session?.login_name ?? session?.email_address;
    return nn ? nn.charAt(0).toUpperCase() : 'U';
  });
  const userEmail = computed(() => appConfig.value.custom?.userSession?.email_address || '');
  const companyInfo = computed(() => {
    const session = appConfig.value.custom?.userSession;
    return {
      code: session?.company_code || '',
      name: session?.company_name || ''
    };
  });
  const branchInfo = computed(() => {
    const session = appConfig.value.custom?.userSession;
    return {
      code: session?.branch_code || '',
      name: session?.branch_name || ''
    };
  });

  // Permission system (sjc_vuetify pattern)
  /** Granted permissions from app config */
  const grantedPermissions = computed<Record<string, string>>(() => {
    return appConfig.value.auth?.grantedPermissions || {};
  });

  /**
   * Check if the user has a specific permission
   * Matches sjc_vuetify's auth.isGranted() pattern
   */
  function isGranted(permissionName: string): boolean {
    const perms = grantedPermissions.value;
    console.log('perms', permissionName, perms, [permissionName]);
    return (perms[permissionName] ?? '').toLowerCase() === 'true';
  }

  /**
   * Check if the user has any of the specified permissions
   */
  function isGrantedAny(permissionNames: string[]): boolean {
    return permissionNames.some(name => isGranted(name));
  }

  /** First menu path for redirect after login */
  const firstMenuPath = computed<string>(() => {
    const navMenus = appConfig.value.nav?.menus?.MainMenu?.items;
    if (navMenus?.length) {
      const firstItem = navMenus[0];
      return firstItem.path || '/';
    }
    return '/';
  });

  /**
   * Fetch app configuration (sjc_vuetify pattern)
   * Gets user session, permissions, menus from /app/all/config
   */
  async function fetchAppConfig() {
    if (configLoading.value) return;

    configLoading.value = true;
    try {
      const { data } = await fetchAppAllConfig();
      if (data) {
        // Store the full app config
        appConfig.value = data;
        configLoaded.value = true;

        // Store user info in auth store for compatibility
        const session = data.custom?.userSession;
        if (session) {
          authStore.userInfo = {
            ...authStore.userInfo,
            userId: session.login_name || String(session.user_id || ''),
            userName: session.full_name || session.login_name || '',
            email_address: session.email_address || '',
            roles: Array.isArray(session.roles) ? session.roles : ['user'],
            buttons: []
          };
        }
        // Process nav menus from API
        const navMenus = data.nav?.menus?.MainMenu?.items;
        if (navMenus) {
          setAppMenus(navMenus, navMenus);
        }
      }
    } catch (error) {
      console.error('Failed to fetch app config:', error);
    } finally {
      configLoading.value = false;
    }
  }

  /**
   * Set app menus
   */
  function setAppMenus(menusData: Api.App.NavMenuItem[], allMenusData: Api.App.NavMenuItem[]) {
    menus.value = menusData || [];
    allMenus.value = allMenusData || [];
  }

  /**
   * Reset app store
   */
  function resetAppStore() {
    appConfig.value = {};
    configLoaded.value = false;
    menus.value = [];
    allMenus.value = [];
  }

  /** On scope dispose */
  onScopeDispose(() => {
    scope.stop();
  });

  // init
  init();

  return {
    // Original properties
    isMobile,
    reloadFlag,
    reloadPage,
    fullContent,
    locale,
    localeOptions,
    changeLocale,
    themeDrawerVisible,
    openThemeDrawer,
    closeThemeDrawer,
    toggleFullContent,
    contentXScrollable,
    setContentXScrollable,
    siderCollapse,
    setSiderCollapse,
    toggleSiderCollapse,
    mixSiderFixed,
    setMixSiderFixed,
    toggleMixSiderFixed,
    // App config properties
    configLoading,
    configLoaded,
    appConfig,
    userSession,
    userDisplayName,
    userInitials,
    userEmail,
    companyInfo,
    branchInfo,
    // Permission system
    grantedPermissions,
    isGranted,
    isGrantedAny,
    firstMenuPath,
    menus,
    allMenus,
    // Actions
    fetchAppConfig,
    setAppMenus,
    resetAppStore
  };
});
