import { request } from '@/service/request';
import type { SystemPageQuery, SysUser } from './user';

export interface SysGroup {
  pk?: string;
  code?: string;
  description?: string;
  desc?: string;
  is_admin?: string;
  is_active?: number;
}

export interface GroupPermissionRow {
  company_pks?: string[];
  company_code?: string;
  company_name?: string;
  branch_pks?: string[];
  branch_code?: string;
  branch_name?: string;
  is_allow?: string;
  permission_names?: string[];
}

export interface GroupDetail {
  group_detail?: SysGroup;
  users?: SysUser[];
  permission_rows?: GroupPermissionRow[];
}

export interface GroupSaveInput {
  group_detail?: SysGroup;
  pk?: string;
  code?: string;
  description?: string;
  desc?: string;
  is_admin?: string;
  is_active?: number;
  selected_user_pks?: string[];
  permission_rows?: GroupPermissionRow[];
}

export interface PermissionDto {
  name?: string;
  permission_name?: string;
  display_name?: string;
  children?: PermissionDto[];
}

export interface BranchOption {
  pk?: string;
  code?: string;
  name?: string;
  company_pk?: string;
  branch_code?: string;
  branch_name?: string;
  branch_pks?: string[];
}

export interface CompanyOption {
  pk?: string;
  code?: string;
  name?: string;
  company_code?: string;
  company_name?: string;
  company_pks?: string[];
  branch_list?: BranchOption[];
}

export function queryGroupPage(params: SystemPageQuery) {
  return request<{ items: SysGroup[]; totalCount: number }>({
    url: '/group/query-page',
    method: 'get',
    params
  });
}

export function getGroupDetail(pk: string) {
  return request<GroupDetail>({
    url: '/group/detail',
    method: 'get',
    params: { pk }
  });
}

export function saveGroup(data: GroupSaveInput) {
  return request<{ pk?: string; group?: SysGroup }>({
    url: '/group/save',
    method: 'post',
    data
  });
}

export function queryGroupAllPermission() {
  return request<{ list: PermissionDto[] }>({
    url: '/group/all-permission',
    method: 'get'
  });
}

export function queryCompanyBranchOptions() {
  return request<{ company_list: CompanyOption[] }>({
    url: '/group/query-company-branch-dept-options',
    method: 'get'
  });
}
