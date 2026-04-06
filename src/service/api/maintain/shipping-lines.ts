import { request } from '@/service/request';

export interface ShippingLinesQueryParams {
  skipCount: number;
  maxResultCount: number;
  filters: Array<{ key: string; op: string; val: string }>;
}

export function queryShippingLinesPage(params: ShippingLinesQueryParams) {
  return request<{ items: any[]; totalCount: number }>({
    url: '/QueryShippingLinesPage',
    method: 'get',
    params
  });
}

export function saveShippingLines(data: any) {
  return request({
    url: '/SaveShippingLines',
    method: 'post',
    data
  });
}

export function deleteShippingLines(id: number) {
  return request({
    url: `/DeleteShippingLines/${id}`,
    method: 'post'
  });
}
