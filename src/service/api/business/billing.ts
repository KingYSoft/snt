import { request } from '@/service/request';

/** POST /billing/charge-line */
export interface BillingChargeLineInput {
  shpPk: string;
  chargeType: string;
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
}

export interface BillingChargeLineItem {
  jr_pk: string;
  jr_jh: string;
  jr_chargetype: string;
  jr_desc: string;
  amount: number;
  os_amount: number;
  currency: string;
  party_oh: string;
  exchange_rate: number;
  gst_rate: string;
  wht_rate: string;
  vat_class: string;
  line_pk: string;
  invoice_pk: string;
  invoice_no: string;
  invoice_date: string;
  draft: string;
}

export interface BillingChargeLineOutput {
  totalCount: number;
  items: BillingChargeLineItem[];
}

/** POST /billing/create-or-update */
export interface BillingChargeWriteItem {
  jr_pk?: string;
  chargeType: string;
  jr_chargetype?: string;
  jr_desc?: string;
  amount?: number;
  os_amount?: number;
  currency?: string;
  party_oh?: string;
  exchange_rate?: number;
  gst_rate?: string;
  wht_rate?: string;
  vat_class?: string;
}

export interface BillingCreateInput {
  shpPk: string;
  charges: BillingChargeWriteItem[];
}

/** POST /billing/draft-page */
export interface BillingDraftPageInput {
  shpPk: string;
  chargeType: string;
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
}

/** GET /billing/summary */
export interface BillingSummaryDto {
  grossProfitMargin: number;
  ar: number;
  ap: number;
  profits: number;
  home_currency?: string;
}

/** AccTransactionHeaderDtoOutput */
export interface AccTransactionHeader {
  id: string;
  ah_pk: string;
  oh_fullname?: string;
  ah_ledger?: string;
  ah_transactionnum?: string;
  ah_desc?: string;
  ah_invoicedate?: string;
  ah_duedate?: string;
  ah_invoiceamount?: number;
  ah_rx_nktransactioncurrency?: string;
  ah_postdate?: string;
  ah_fullypaiddate?: string;
  ah_invoiceterm?: string;
  ah_matchstatus?: string;
  ah_outstandingamount?: number;
  ah_systemcreatebranch?: string;
  ah_invoiceapproved?: number;
  ah_iscancelled?: number;
  ah_oh?: string;
  ah_consolidatedinvoiceref?: string;
}

export interface BillingDraftPageOutput {
  totalCount: number;
  items: AccTransactionHeader[];
}

export interface GenerateDraftInput {
  pks: string[];
  chargeType: string;
}

export interface PostChargeInput {
  ahPks: string[];
}

export interface VoidInvoiceInput {
  ahPks: string[];
}

export interface BillingTblFilterItem {
  key: string;
  op: string;
  val: string;
  start?: string;
  end?: string;
}

export interface BillingTblInput {
  skipCount: number;
  maxResultCount: number;
  filters?: BillingTblFilterItem[];
}

export async function billingChargeLine(params: BillingChargeLineInput) {
  return request<BillingChargeLineOutput>({
    url: '/billing/charge-line',
    method: 'post',
    data: params
  });
}

export async function createOrUpdateBilling(params: BillingCreateInput) {
  return request({
    url: '/billing/create-or-update',
    method: 'post',
    data: params
  });
}

export async function billingDraftPage(params: BillingDraftPageInput) {
  return request<BillingDraftPageOutput>({
    url: '/billing/draft-page',
    method: 'post',
    data: params
  });
}

export async function getBillingSummary(shpPk: string) {
  return request<BillingSummaryDto>({
    url: '/billing/summary',
    method: 'get',
    params: { shpPk }
  });
}

export async function generateDraft(params: GenerateDraftInput) {
  return request({
    url: '/billing/generate-draft',
    method: 'post',
    data: params
  });
}

export async function postCharge(params: PostChargeInput) {
  return request({
    url: '/billing/post-charge',
    method: 'post',
    data: params
  });
}

export async function voidDraftInvoice(params: VoidInvoiceInput) {
  return request({
    url: '/billing/void-draft',
    method: 'post',
    data: params
  });
}

export async function voidPostedInvoice(invoiceNos: string[]) {
  return request({
    url: '/billing/void-posted',
    method: 'post',
    data: invoiceNos
  });
}

export async function deleteBilling(jrPks: string[]) {
  return request({
    url: '/billing/delete',
    method: 'post',
    data: jrPks
  });
}

export async function queryChargesByInvoice(invoiceNo: string) {
  return request({
    url: '/billing/charges-by-invoice',
    method: 'get',
    params: { invoiceNo }
  });
}

export async function editDraftInvoice(params: {
  ahPk: string;
  deleteJrPks?: string[];
  charges?: BillingChargeWriteItem[];
}) {
  return request({
    url: '/billing/edit-draft',
    method: 'post',
    data: params
  });
}

export async function getBillingDetail(id: string) {
  return request({
    url: '/billing/detail',
    method: 'get',
    params: { id }
  });
}

export async function queryArBilling(params: BillingTblInput) {
  return request({
    url: '/billing/ar/tbl',
    method: 'post',
    data: params
  });
}

export async function queryApBilling(params: BillingTblInput) {
  return request({
    url: '/billing/ap/tbl',
    method: 'post',
    data: params
  });
}

export interface BillingChargeCodeOption {
  pk: string;
  code: string;
  desc: string;
  charge_type: string;
}

/** GET /billing/charge-code-options — fuzzy search via query */
export async function billingChargeCodeOptions(params?: { query?: string }) {
  return request<BillingChargeCodeOption[]>({
    url: '/billing/charge-code-options',
    method: 'get',
    params
  });
}

export async function getCurrencyOptions() {
  return request<Array<{ code: string; desc?: string }>>({
    url: '/api/currency/options',
    method: 'get'
  });
}
