import { request } from '@/service/request';

export interface ContainerQueryParams {
  skipCount: number;
  maxResultCount: number;
  filters: Array<{ key: string; op: string; val: string }>;
}

export function queryContainerTypePage(params: ContainerQueryParams) {
  return request<{ items: any[]; totalCount: number }>({
    url: '/QueryContainerTypePage',
    method: 'get',
    params
  });
}

export function saveContainerType(data: any) {
  return request({
    url: '/SaveContainerType',
    method: 'post',
    data
  });
}

export function deleteContainerType(id: number) {
  return request({
    url: `/DeleteContainerType/${id}`,
    method: 'post'
  });
}
