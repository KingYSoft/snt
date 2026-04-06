import { request } from '@/service/request';

export interface ChargeCodeQueryParams {
  skipCount: number;
  maxResultCount: number;
  filters: Array<{ key: string; op: string; val: string }>;
}

export function queryChargeCodePage(params: ChargeCodeQueryParams) {
  return request<{ items: any[]; totalCount: number }>({
    url: '/charge-code/query-page',
    method: 'get',
    params
  });
}

export function saveChargeCode(data: any) {
  return request({
    url: '/charge-code/save',
    method: 'post',
    data
  });
}

export function deleteChargeCode(id: number) {
  return request({
    url: `/charge-code/delete/${id}`,
    method: 'post'
  });
}
