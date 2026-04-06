import { request } from '@/service/request';

export interface AirlineQueryParams {
  skipCount: number;
  maxResultCount: number;
  filters: Array<{ key: string; op: string; val: string }>;
}

export function queryAirlinePage(params: AirlineQueryParams) {
  return request<{ items: any[]; totalCount: number }>({
    url: '/QueryPageAirlines',
    method: 'get',
    params
  });
}

export function saveAirline(data: any) {
  return request({
    url: '/saveAirlines',
    method: 'post',
    data
  });
}

export function deleteAirline(id: number) {
  return request({
    url: `/deleteAirlines/${id}`,
    method: 'post'
  });
}
