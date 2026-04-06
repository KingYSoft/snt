import { request } from '@/service/request';

export interface PackageTypeQueryParams {
  skipCount: number;
  maxResultCount: number;
  filters: Array<{ key: string; op: string; val: string }>;
}

export function queryPackageTypePage(params: PackageTypeQueryParams) {
  return request<{ items: any[]; totalCount: number }>({
    url: '/package-type/query-page',
    method: 'get',
    params
  });
}

export function savePackageType(data: any) {
  return request({
    url: '/package-type/save',
    method: 'post',
    data
  });
}

export function deletePackageType(id: number) {
  return request({
    url: `/package-type/delete/${id}`,
    method: 'post'
  });
}
