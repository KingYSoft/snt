import { request } from '@/service/request';

export interface ConsolidationFilter {
  key: string;
  op: string;
  val: string;
  start?: string;
  end?: string;
  or?: ConsolidationFilter[];
}

export interface ConsolidationQueryParams {
  SkipCount: number;
  MaxResultCount: number;
  filters?: ConsolidationFilter[];
}

export async function consolidationQueryPage(params: ConsolidationQueryParams) {
  return request({
    url: '/consolidation/tbl',
    method: 'post',
    data: params
  });
}

export async function consolidationGetById(id: number | string) {
  return request({
    url: '/consolidation/detail',
    method: 'get',
    params: { id }
  });
}

export async function consolidationExport(params: ConsolidationQueryParams) {
  return request({
    url: '/api/con-consol/export',
    method: 'post',
    data: params,
    responseType: 'blob'
  });
}
