import { request } from '@/service/request';

export interface PortCodeQueryParams {
  skipCount: number;
  maxResultCount: number;
  filters: Array<{ key: string; op: string; val: string }>;
}

export function queryPortCodePage(params: PortCodeQueryParams) {
  return request<{ items: any[]; totalCount: number }>({
    url: '/port-code/query-page',
    method: 'get',
    params
  });
}

export function savePortCode(data: any) {
  return request({
    url: '/port-code/save',
    method: 'post',
    data
  });
}

export function deletePortCode(id: number) {
  return request({
    url: `/port-code/delete/${id}`,
    method: 'post'
  });
}
