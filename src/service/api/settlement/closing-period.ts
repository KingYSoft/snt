import { request } from '@/service/request';

export type ClosingPeriodFilterKey = 'close_period' | 'closing_date' | 'branch_pk';

export interface ClosingPeriodQueryFilter {
  key: ClosingPeriodFilterKey;
  op: 'between' | '=';
  val?: string;
  start?: string;
  end?: string;
}

export interface ClosingPeriodQueryParams {
  skipCount: number;
  maxResultCount: number;
  filters: ClosingPeriodQueryFilter[];
}

export interface ClosingPeriodRecord {
  id?: number;
  pk?: string;
  branch_pk?: string;
  branch_code?: string;
  branch_name?: string;
  branch_name_cn?: string;
  branch_name_en?: string;
  close_period?: string;
  closing_date?: string;
  create_user?: string;
  creation_time?: string;
  last_modify_user?: string;
  last_modification_time?: string;
}

export interface ClosingPeriodPage {
  items: ClosingPeriodRecord[];
  totalCount: number;
}

export interface ClosingPeriodSaveInput {
  branch_pk_list: string[];
  close_period: string;
  closing_date: string;
}

export interface ClosingPeriodUpdateInput extends ClosingPeriodSaveInput {
  id: number;
}

/** 期间只取 yyyy-MM */
export function formatClosingPeriodMonth(value?: string | null): string {
  const text = String(value ?? '').trim();
  if (/^\d{4}-\d{2}$/.test(text)) return text;
  const match = text.match(/^(\d{4}-\d{2})/);
  return match ? match[1] : text;
}

/** 日期只取 yyyy-MM-dd */
export function formatClosingPeriodDate(value?: string | null): string {
  const text = String(value ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : text;
}

/** 默认会计月范围：前 2 个月 ~ 后 2 个月 */
export function createClosingPeriodDefaultMonthRange(offsetStart = -2, offsetEnd = 2) {
  const build = (offset: number) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() + offset);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };
  return {
    start: build(offsetStart),
    end: build(offsetEnd)
  };
}

/** POST /sun-period-manage/query-page */
export function queryClosingPeriodPage(data: ClosingPeriodQueryParams) {
  return request<ClosingPeriodPage>({
    url: '/sun-period-manage/query-page',
    method: 'post',
    data
  });
}

/** POST /sun-period-manage/add */
export function createClosingPeriod(data: ClosingPeriodSaveInput) {
  return request({
    url: '/sun-period-manage/add',
    method: 'post',
    data
  });
}

/** POST /sun-period-manage/update */
export function updateClosingPeriod(data: ClosingPeriodUpdateInput) {
  return request({
    url: '/sun-period-manage/update',
    method: 'post',
    data
  });
}
