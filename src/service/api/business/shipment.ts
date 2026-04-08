import { request } from '@/service/request';

export interface ShipmentQueryParams {
  skipCount: number;
  maxResultCount: number;
  filters?: Array<{
    key: string;
    op: string;
    val: string;
    start?: string;
    end?: string;
  }>;
}

export interface ShipmentSaveParams {
  id?: number;
  pk?: string;
  shp_transport_mode?: string;
  shipper?: any;
  consignee?: any;
  notify_party?: any;
  containers_list?: any[];
  loose_list?: any[];
  po_lines_list?: any[];
  notes_list?: any[];
  ar_charges?: any[];
  ap_charges?: any[];
  shp_unit_of_weight?: string;
  shp_unit_of_volume?: string;
  shp_transit_time_unit?: string;
  shp_pack_type?: string;
  shp_is_forward_registered?: number;
  doc_data?: any;
  [key: string]: any;
}

export interface ShipmentPdfGenerateParams {
  business_id: number;
  business_pk: string;
  template_code: string;
  version_no: string;
}

export interface ShipmentQueryPortCodeParams {
  query: string;
}

export async function shipmentTbl(params: ShipmentQueryParams) {
  return request({
    url: '/shipment/tbl',
    method: 'post',
    data: params
  });
}

export async function shipmentSave(params: ShipmentSaveParams) {
  return request({
    url: '/shipment/save',
    method: 'post',
    data: params
  });
}

export async function shipmentExport(params: ShipmentQueryParams) {
  return request({
    url: '/shipment/export',
    method: 'post',
    data: params,
    responseType: 'blob'
  });
}

export async function shipmentPdfGenerate(params: ShipmentPdfGenerateParams) {
  return request({
    url: '/shipment/pdf-generate',
    method: 'post',
    data: params
  });
}

export async function shipmentQueryPortCode(params: ShipmentQueryPortCodeParams) {
  return request({
    url: '/shipment/query-port-code',
    method: 'get',
    params
  });
}

export async function shipmentDeactivate(id: number) {
  return request({
    url: '/shipment/deactivate',
    method: 'post',
    data: { id }
  });
}

export async function shipmentReopen(id: number) {
  return request({
    url: '/shipment/reopen',
    method: 'post',
    data: { id }
  });
}

export async function shipmentCopy(id: number) {
  return request<{ id: number; pk: string }>({
    url: '/shipment/copy',
    method: 'post',
    data: { id }
  });
}

export async function edocSearch(params: { parent_table: string; related_key: string }) {
  return request({
    url: '/edoc/search',
    method: 'post',
    data: params
  });
}

export async function edocSave(formData: FormData) {
  return request({
    url: '/edoc/save',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

export async function logsSearch(params: {
  SkipCount: number;
  MaxResultCount: number;
  parent_table: string;
  related_key: string;
}) {
  return request({
    url: '/api/logs/search',
    method: 'post',
    data: params
  });
}

export async function billingQueryPage(params: {
  shpPk: string;
  chargeType: string;
  SkipCount?: number;
  MaxResultCount?: number;
}) {
  return request({
    url: '/api/billing/query-page',
    method: 'get',
    params
  });
}

export async function billingSummary(shpPk: string) {
  return request({
    url: '/api/billing/summary',
    method: 'get',
    params: { shpPk }
  });
}

export async function shipmentQueryOrgAddress(params: Record<string, any>) {
  return request({
    url: '/shipment/query-org-address',
    method: 'get',
    params
  });
}

export async function shipmentSaveOrgAddress(params: Record<string, any>) {
  return request({
    url: '/shipment/save-org-address',
    method: 'post',
    data: params
  });
}

export async function userQueryAll(params: { query?: string }) {
  return request<{ list: Array<{ pk: string; full_name: string; email_address: string }> }>({
    url: '/user/query-all',
    method: 'get',
    params
  });
}

export async function chargeCodeOptions() {
  return request<Array<{ code: string; description: string }>>({
    url: '/charge-code/options',
    method: 'get'
  });
}

export async function currencyOptions() {
  return request<Array<{ code: string; desc: string }>>({
    url: '/api/currency/options',
    method: 'get'
  });
}

export async function generateDraft(params: { pks: string[] }) {
  return request({
    url: '/api/billing/generate-draft',
    method: 'post',
    data: params
  });
}

export async function deleteBilling(pks: string[]) {
  return request({
    url: '/api/billing/delete',
    method: 'delete',
    data: pks
  });
}

export async function queryDraftPage(params: {
  shpPk: string;
  SkipCount?: number;
  MaxResultCount?: number;
  Sorting?: string;
  invoice_no?: string;
}) {
  return request({
    url: '/api/billing/query-draft-page',
    method: 'get',
    params
  });
}

export async function postCharge(params: { pks: string[] }) {
  return request({
    url: '/api/billing/postCharge',
    method: 'post',
    data: params
  });
}

export async function poSearch(params: Record<string, any>) {
  return request({
    url: '/po/search',
    method: 'post',
    data: params
  });
}

export async function poDetailsUploadPoXlsx(formData: FormData) {
  return request({
    url: '/shipment/upload-po-xlsx',
    method: 'post',
    headers: { 'Content-Type': 'multipart/form-data' },
    data: formData
  });
}
