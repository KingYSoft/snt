import { request } from '@/service/request';
import type {
  AccTransactionHeader,
  BillingChargeLineItem,
  BillingChargeLineOutput,
  BillingDraftPageOutput,
  QueryChargesByInvoiceOutput
} from '@/service/api/business/billing';

/** POST /consolidation/billing/charge-line */
export interface ConsolBillingChargeLineInput {
  jkPk: string;
  chargeType: string;
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
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

export type { AccTransactionHeader, BillingChargeLineItem, BillingChargeLineOutput, BillingDraftPageOutput };

export async function consolBillingChargeLine(params: ConsolBillingChargeLineInput) {
  return request<BillingChargeLineOutput>({
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
