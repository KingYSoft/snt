import { request } from '@/service/request';
import type { SystemPageQuery } from './user';
import type { SysGroup } from './group';

export interface SysBranch {
  pk?: string;
  code?: string;
  branch_name?: string;
  company_pk?: string;
  company_code?: string;
  company_name?: string;
  address1?: string;
  address2?: string;
  address3?: string;
  city?: string;
  state?: string;
  postcode?: string;
  postal_code?: string;
  phone?: string;
  fax?: string;
  email?: string;
  country_code?: string;
  home_port?: string;
  org_code?: string;
  system_company?: string;
  accounting_group_code?: string;
  finance_group_code?: string;
  is_active?: number;
  is_valid?: number;
}

export function queryBranchPage(params: SystemPageQuery) {
  return request<{ items: SysBranch[]; totalCount: number }>({
    url: '/branch/query-page',
    method: 'post',
    data: params
  });
}

export function getBranch(data: { pk?: string; code?: string }) {
  return request<SysBranch>({
    url: '/branch/get',
    method: 'post',
    data
  });
}

export function saveBranch(data: SysBranch) {
  return request<SysBranch>({
    url: '/branch/save',
    method: 'post',
    data
  });
}

export function deleteBranch(pk: string) {
  return request({
    url: `/branch/delete/${pk}`,
    method: 'post'
  });
}

export function queryBranchGroupList() {
  return request<{ list: SysGroup[] }>({
    url: '/branch/group-list',
    method: 'get'
  });
}
