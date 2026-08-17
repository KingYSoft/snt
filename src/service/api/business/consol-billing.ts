import { request } from '@/service/request';
import type {
  AccTransactionHeader,
  BillingChargeLineItem,
  BillingDraftPageOutput,
  QueryChargesByInvoiceOutput
} from '@/service/api/business/billing';

/** POST /consolidation/billing/charge-line — 仅 AP（JobConsolCost） */
export interface ConsolBillingChargeLineInput {
  jkPk: string;
  /** 仅 AP 有数据；其他值返回空 */
  chargeType?: string;
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
}

/** 子行：按运单分摊的 JobCharge */
export interface ConsolCostItemDto {
  e6_pk?: string;
  jr_pk?: string;
  jr_jh?: string;
  js_pk?: string;
  shipment_no?: string;
  jr_desc?: string;
  local_cost_amount?: number;
  os_cost_amount?: number;
  currency?: string;
  ap_line_pk?: string;
  container_count?: number | string;
  gross_weight?: number | string;
  gross_weight_unit?: string;
  cbm?: number | string;
  cbm_unit?: string;
  chargeable_weight?: number | string;
  unit_price?: number | string;
  unit?: string;
  qty?: number | string;
  tax_code?: string;
  tax_desc?: string;
  tax_amount?: number | string;
}

/** 主行：合单级 AP 成本行 JobConsolCost */
export interface ConsolBillingCostLineItem {
  e6_pk?: string;
  sequence?: number;
  e6_ac?: string;
  charge_code?: string;
  charge_desc?: string;
  description?: string;
  display_description?: string;
  currency?: string;
  os_cost_amount?: number;
  os_gst_amount?: number;
  exchange_rate?: number;
  local_cost_amount?: number;
  creditor_oh?: string;
  creditor_code?: string;
  creditor_name?: string;
  cost_reference?: string;
  invoice_num?: string;
  invoice_date?: string;
  apportionment_method?: string;
  vat_class?: string;
  tax_code?: string;
  payment_date?: string;
  payment_type?: string;
  ap_invoice_pk?: string;
  ap_invoice_no?: string;
  ap_invoice_date?: string;
  ap_invoice_is_cancelled?: number | null;
  draft?: string;
  trans_no?: string;
  branch_code?: string;
  branch_name?: string;
  unit_price?: number | string;
  unit?: string;
  qty?: number | string;
  cost_items?: ConsolCostItemDto[];
}

export interface ConsolBillingCostLineOutput {
  totalCount: number;
  items: ConsolBillingCostLineItem[];
}

/** POST /consolidation/billing/draft-page */
export interface ConsolBillingDraftPageInput {
  jkPk: string;
  chargeType?: string;
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
}

/** GET /consolidation/billing/summary */
export interface ConsolBillingSummary {
  grossProfitMargin?: number;
  ar?: number;
  ap?: number;
  profits?: number;
  home_currency?: string;
}

export type { AccTransactionHeader, BillingChargeLineItem, BillingDraftPageOutput };

export async function consolBillingChargeLine(params: ConsolBillingChargeLineInput) {
  return request<ConsolBillingCostLineOutput>({
    url: '/consolidation/billing/charge-line',
    method: 'post',
    data: params
  });
}

export async function consolBillingDraftPage(params: ConsolBillingDraftPageInput) {
  return request<BillingDraftPageOutput>({
    url: '/consolidation/billing/draft-page',
    method: 'post',
    data: params
  });
}

export async function consolBillingSummary(jkPk: string) {
  return request<ConsolBillingSummary>({
    url: '/consolidation/billing/summary',
    method: 'get',
    params: { jkPk }
  });
}

export async function consolBillingChargesByInvoice(invoiceNo: string) {
  return request<QueryChargesByInvoiceOutput>({
    url: '/consolidation/billing/charges-by-invoice',
    method: 'get',
    params: { invoiceNo }
  });
}
