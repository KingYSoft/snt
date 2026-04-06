import { request } from '@/service/request';

export interface CurrencyQueryParams {
  skipCount: number;
  maxResultCount: number;
  filters: Array<{ key: string; op: string; val: string }>;
}

export function queryCurrencyPage(params: CurrencyQueryParams) {
  return request<{ items: any[]; totalCount: number }>({
    url: '/api/currency/query-page',
    method: 'get',
    params
  });
}

export function saveCurrency(data: any) {
  return request({
    url: '/api/currency/save',
    method: 'post',
    data
  });
}

export function deleteCurrency(id: number) {
  return request({
    url: `/api/currency/delete/${id}`,
    method: 'post'
  });
}

export function getCurrencyList() {
  return request<Array<{ code: string; desc: string }>>({
    url: '/GetCurrency',
    method: 'get'
  });
}
