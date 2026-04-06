import { request } from '@/service/request';

export interface VesselQueryParams {
  skipCount: number;
  maxResultCount: number;
  filters: Array<{ key: string; op: string; val: string }>;
}

export function queryVesselPage(params: VesselQueryParams) {
  return request<{ items: any[]; totalCount: number }>({
    url: '/QueryVesselPage',
    method: 'get',
    params
  });
}

export function saveVessel(data: any) {
  return request({
    url: '/SaveVessel',
    method: 'post',
    data
  });
}

export function deleteVessel(id: number) {
  return request({
    url: `/DeleteVessel/${id}`,
    method: 'post'
  });
}
