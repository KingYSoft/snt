import { request } from '@/service/request';
import type { SystemPageQuery } from './user';

export interface SysCompany {
  pk?: string;
  code?: string;
  name?: string;
  business_reg_no?: string;
  business_reg_no2?: string;
  customs_registration_no?: string;
  address1?: string;
  address2?: string;
  address3?: string;
  city?: string;
  phone?: string;
  postcode?: string;
  postal_code?: string;
  state?: string;
  fax?: string;
  email?: string;
  web_address?: string;
  website?: string;
  home_currency?: string;
  org_code?: string;
  country_code?: string;
  is_gst_registered?: number;
  is_active?: number;
  is_valid?: number;
}

export function querySystemCompanyPage(params: SystemPageQuery) {
  return request<{ items: SysCompany[]; totalCount: number }>({
    url: '/company/query-page',
    method: 'post',
    data: params
  });
}

export function saveSystemCompany(data: SysCompany) {
  return request<SysCompany>({
    url: '/company/save',
    method: 'post',
    data
  });
}

export function deleteSystemCompany(pk: string) {
  return request({
    url: `/company/delete/${pk}`,
    method: 'post'
  });
}
