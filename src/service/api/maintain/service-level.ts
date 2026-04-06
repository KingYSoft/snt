import { request } from '@/service/request';

export interface ServiceLevelQueryParams {
  skipCount: number;
  maxResultCount: number;
  filters: Array<{ key: string; op: string; val: string }>;
}

export function queryServiceLevelPage(params: ServiceLevelQueryParams) {
  return request<{ items: any[]; totalCount: number }>({
    url: '/service-level/query-page',
    method: 'get',
    params
  });
}

export function saveServiceLevel(data: any) {
  return request({
    url: '/service-level/save',
    method: 'post',
    data
  });
}

export function deleteServiceLevel(id: number) {
  return request({
    url: `/service-level/delete/${id}`,
    method: 'post'
  });
}
