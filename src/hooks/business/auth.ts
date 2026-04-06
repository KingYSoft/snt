import { computed } from 'vue';
import { useAppStore } from '@/store/modules/app';
import { localStg } from '@/utils/storage';

export function useAuth() {
  const appStore = useAppStore();

  function hasAuth(codes: string | string[]) {
    // Check if user is logged in
    const token = sessionStorage.getItem('token') || localStg.get('token');
    if (!token) {
      return false;
    }

    // Get user buttons from app store
    const userSession = appStore.appConfig.custom?.userSession || {};
    const buttons = Array.isArray(userSession.buttons) ? userSession.buttons : [];

    if (typeof codes === 'string') {
      return buttons.includes(codes);
    }

    return codes.some(code => buttons.includes(code));
  }

  // Calculate isLogin based on token presence
  const isLogin = computed(() => {
    const token = sessionStorage.getItem('token') || localStg.get('token');
    return Boolean(token);
  });

  return {
    hasAuth,
    isLogin
  };
}
