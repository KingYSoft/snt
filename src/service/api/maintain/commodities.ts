import { request } from '@/service/request';

export interface CommoditiesQueryParams {
  skipCount: number;
  maxResultCount: number;
  filters: Array<{ key: string; op: string; val: string }>;
}

export function queryCommodityPage(params: CommoditiesQueryParams) {
  return request<{ items: any[]; totalCount: number }>({
    url: '/QueryCommodityPage',
    method: 'get',
    params
  });
}

export function saveCommodity(data: any) {
  return request({
    url: '/SaveCommodity',
    method: 'post',
    data
  });
}

export function deleteCommodity(id: number) {
  return request({
    url: `/DeleteCommodity/${id}`,
    method: 'post'
  });
}
