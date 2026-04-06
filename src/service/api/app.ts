import { request } from '../request';

/**
 * Get app global configuration
 * This includes user session info, menus, permissions, etc.
 */
export function fetchAppAllConfig() {
  return request({
    url: '/app/all/config',
    method: 'get'
  });
}

/**
 * Clear app cache
 */
export function fetchAppCacheClear() {
  return request({
    url: '/app/cache/clear',
    method: 'get'
  });
}
