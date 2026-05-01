import type { RouteMeta } from 'vue-router';
import ElegantVueRouter from '@elegant-router/vue/vite';
import type { RouteKey } from '@elegant-router/types';

/** Route order mapping (matches sjc_vuetify definePage order) */
const routeOrderMap: Partial<Record<RouteKey, number>> = {
  // Top-level modules
  home: 1,
  business: 2,
  settlement: 3,
  maintain: 8,
  system: 9,

  // Business children
  business_shipment: 2,
  business_consolidation: 3,

  // Settlement children
  'settlement_receivable-transactions': 1,
  'settlement_payable-transactions': 2,
  settlement_writeoff: 3,

  // Maintain children
  maintain_airlines: 1,
  maintain_bank: 2,
  'maintain_charge-code': 3,
  maintain_commodities: 4,
  maintain_containers: 5,
  maintain_currency: 6,
  'maintain_package-types': 7,
  'maintain_port-code': 8,
  'maintain_service-level': 9,
  'maintain_shipping-lines': 10,
  maintain_vessel: 11,
  maintain_organization: 12,
  'maintain_organization-detail': 13,
  'maintain_organization-edit': 14,
  'maintain_organization-new': 15,

  // System children
  system_user: 1,
  system_group: 2,
  system_company: 3,
  system_branch: 4
};

export function setupElegantRouter() {
  return ElegantVueRouter({
    layouts: {
      base: 'src/layouts/base-layout/index.vue',
      blank: 'src/layouts/blank-layout/index.vue'
    },
    routePathTransformer(routeName, routePath) {
      const key = routeName as RouteKey;

      if (key === 'login') {
        const modules: UnionKey.LoginModule[] = ['pwd-login'];

        const moduleReg = modules.join('|');

        return `/login/:module(${moduleReg})?`;
      }

      return routePath;
    },
    onRouteMetaGen(routeName) {
      const key = routeName as RouteKey;

      const constantRoutes: RouteKey[] = ['login', '403', '404', '500'];

      const meta: Partial<RouteMeta> = {
        title: key,
        i18nKey: `route.${key}` as App.I18n.I18nKey
      };

      if (constantRoutes.includes(key)) {
        meta.constant = true;
      }

      const hideInMenuRoutes: RouteKey[] = [
        'business_consolidation-edite',
        'maintain_organization-detail',
        'maintain_organization-edit',
        'maintain_organization-new'
      ];

      if (hideInMenuRoutes.includes(key)) {
        meta.hideInMenu = true;
      }

      // Set order from routeOrderMap
      const order = routeOrderMap[key];
      if (order !== undefined) {
        meta.order = order;
      }

      return meta;
    }
  });
}
