import { useAuthStore } from '@/store/modules/auth';

export function useAppInit() {
  const authStore = useAuthStore();

  /**
   * Initialize user info from storage (restore token on page refresh).
   * Route initialization is handled by the route guard.
   */
  const initApp = async () => {
    await authStore.initUserInfo();
  };

  return {
    initApp
  };
}
