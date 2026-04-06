import { request } from '@/service/request';

export interface OrganizationQueryParams {
  skipCount: number;
  maxResultCount: number;
  filters: Array<{ key: string; op: string; val: string }>;
}

export function queryOrganizationPage(params: OrganizationQueryParams) {
  return request<{ items: any[]; totalCount: number }>({
    url: '/api/organization/query-page',
    method: 'get',
    params
  });
}

export function saveOrganization(data: any) {
  return request({
    url: '/api/organization/create-or-update',
    method: 'post',
    data
  });
}

export function createOrUpdateOrganization(data: any) {
  return request({
    url: '/api/organization/create-or-update',
    method: 'post',
    data
  });
}

export function organizationTbl(params: any) {
  return request({
    url: '/api/organization/query-page',
    method: 'get',
    params
  });
}

export function deleteOrganization(id: number) {
  return request({
    url: `/api/organization/delete/${id}`,
    method: 'delete'
  });
}

export function getOrganizationById(id: number) {
  return request({
    url: `/api/organization/get/${id}`,
    method: 'get'
  });
}
