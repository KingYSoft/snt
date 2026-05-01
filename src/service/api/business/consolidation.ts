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

/**
 * 匹配货物（查询可附加到 consolidation 的 shipment）
 */
export async function consolidationMatchingShipments(params: {
  con_transport_mode: string;
  origin: string;
  destination: string;
  etd: string;
  shipment_number?: string;
}) {
  return request({
    url: '/consolidation/matching-shipments',
    method: 'get',
    params
  });
}

/**
 * 保存 consolidation（新建）
 * TODO: 待后端对接，替换为真实 API
 */
export async function consolidationSave(data: Record<string, any>) {
  return request({
    url: '/consolidation/save',
    method: 'post',
    data
  });
}

/**
 * 更新 consolidation
 * TODO: 待后端对接，替换为真实 API
 */
export async function consolidationUpdate(data: Record<string, any>) {
  return request({
    url: '/consolidation/update',
    method: 'post',
    data
  });
}

/**
 * 附加 shipments 到 consolidation
 * TODO: 待后端对接，替换为真实 API
 */
export async function consolidationAttachShipments(data: { consol_pk: string; shipment_pks: string[] }) {
  return request({
    url: '/consolidation/attach-shipments',
    method: 'post',
    data
  });
}

/**
 * 从 consolidation 分离 shipments
 * TODO: 待后端对接，替换为真实 API
 */
export async function consolidationDetachShipments(data: { consol_pk: string; shipment_pks: string[] }) {
  return request({
    url: '/consolidation/detach-shipments',
    method: 'post',
    data
  });
}
