import { request } from '@/service/request';

export interface BankQueryParams {
  skipCount: number;
  maxResultCount: number;
  filters: Array<{ key: string; op: string; val: string }>;
}

export function queryBankPage(params: BankQueryParams) {
  return request<{ items: any[]; totalCount: number }>({
    url: '/QueryBankPage',
    method: 'get',
    params
  });
}

export function saveBank(data: any) {
  return request({
    url: '/SaveBank',
    method: 'post',
    data
  });
}

export function deleteBank(id: number) {
  return request({
    url: `/DeleteBank/${id}`,
    method: 'post'
  });
}
