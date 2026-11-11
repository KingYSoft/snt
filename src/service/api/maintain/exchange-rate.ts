import { request } from '@/service/request';

export interface ExchangeRateQueryParams {
  currencyFrom?: string;
  currencyTo?: string;
  period?: string;
}

export interface ExchangeRateRecord {
  exrate_period: string;
  exrate_start: string;
  exrate_end: string;
  exrate_from: string;
  exrate_to: string;
  exrate_sell_rate: string;
  index?: number;
}

function toDateOnly(value: unknown): string {
  if (value == null || value === '') return '';
  const text = String(value);
  return text.includes('T') ? text.split('T')[0] : text;
}

function toText(value: unknown): string {
  return value == null ? '' : String(value);
}

/** 接口响应行 → 表格行（兼容 first-cargo 的 snake_case 与 camelCase） */
export function normalizeExchangeRateRecord(raw: Record<string, any>, index?: number): ExchangeRateRecord {
  return {
    exrate_period: toText(raw.exrate_period ?? raw.exratePeriod),
    exrate_start: toDateOnly(raw.exrate_start ?? raw.exrateStart),
    exrate_end: toDateOnly(raw.exrate_end ?? raw.exrateEnd),
    exrate_from: toText(raw.exrate_from ?? raw.exrateFrom),
    exrate_to: toText(raw.exrate_to ?? raw.exrateTo),
    exrate_sell_rate: toText(raw.exrate_sell_rate ?? raw.exrateSellRate),
    index
  };
}

/** POST /company/query-exchange-rate */
export function queryExchangeRateList(data: ExchangeRateQueryParams) {
  return request<ExchangeRateRecord[]>({
    url: '/company/query-exchange-rate',
    method: 'post',
    data
  });
}
