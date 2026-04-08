import { request } from '@/service/request';

export interface BillingParams {
  shp_pk: string;
  charges: Array<{
    id?: number;
    pk?: string;
    jch_charge_code: string;
    jch_charge_desc: string;
    jch_branch: string;
    jch_product_quantity: number;
    jch_estimated_cost: number;
    jch_line_type: string;
    jch_sell_account?: string;
    jch_sell_currency?: string;
    jch_sell_rated?: number;
    jch_ts_sell_amt?: number;
    jch_a9_sell_vat_class?: string;
    jch_ts_sell_wht_amt?: number;
    jch_ts_sell_ex_rate?: number;
    jch_home_sell_amt?: number;
    jch_cost_account?: string;
    jch_cost_currency?: string;
    jch_cost_rated?: number;
    jch_ts_cost_amt?: number;
    jch_a9_cost_vat_class?: string;
    jch_ts_cost_wht_amt?: number;
    jch_ts_cost_ex_rate?: number;
    jch_home_cost_amt?: number;
  }>;
}

export async function createOrUpdateBilling(params: BillingParams) {
  return request({
    url: '/api/billing/save',
    method: 'post',
    data: params
  });
}
