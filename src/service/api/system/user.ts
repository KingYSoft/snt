import { request } from '@/service/request';

export interface SystemFilterItem {
  key: string;
  op: string;
  val: string;
}

export interface SystemPageQuery {
  skipCount: number;
  maxResultCount: number;
  query?: string;
  sorting?: string;
  filters?: SystemFilterItem[];
}

export interface SysUserGroupRow {
  id?: number | string;
  group_code?: string;
  group_description?: string;
  domain_name?: string;
  type?: string;
}

export interface SysUserOwnerGroupRow {
  id?: number | string;
  group_code?: string;
  group_description?: string;
  domain_name?: string;
  parent_code?: string;
  parent_type?: string;
}

export interface SysUser {
  pk?: string;
  code?: string;
  login_name?: string;
  full_name?: string;
  email_address?: string;
  work_phone?: string;
  mobile_phone?: string;
  home_branch?: string;
  home_department?: string;
  country_code?: string;
  is_active?: number;
  is_valid?: number;
  can_login?: number;
  password?: string;
  password_hash?: string;
  baiwang_digital_account?: string;
  short_code?: string;
  last_logon_date?: string;
  last_login_date?: string;
  fax?: string;
  current_status?: string;
  current_task?: string;
  groups?: SysUserGroupRow[];
  ownerGroups?: SysUserOwnerGroupRow[];
}

export function queryUserPage(params: SystemPageQuery) {
  return request<{ items: SysUser[]; totalCount: number }>({
    url: '/user/query-page',
    method: 'get',
    params
  });
}

export function getUserDetail(pk: string) {
  return request<SysUser>({
    url: '/user/detail',
    method: 'get',
    params: { pk }
  });
}

export function saveUser(data: SysUser) {
  return request<SysUser>({
    url: '/user/save',
    method: 'post',
    data
  });
}

export function deleteUser(pk: string) {
  return request({
    url: `/user/delete/${pk}`,
    method: 'post'
  });
}

export function queryUserAll(query = '') {
  return request<{ list: SysUser[] }>({
    url: '/user/query-all',
    method: 'get',
    params: { query }
  });
}
