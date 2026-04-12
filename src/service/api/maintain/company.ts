import { request } from '@/service/request';

export interface CompanyQueryParams {
  skipCount: number;
  maxResultCount: number;
  filters: Array<{ key: string; op: string; val: string }>;
}

export interface Company {
  id: number;
  pk: string;
  code: string;
  name: string;
  nameEnglish?: string;
  abbreviation?: string;
  business_reg_no?: string;
  city?: string;
  country_code?: string;
  is_active?: number;
  home_currency?: string;
  org_code?: string;
}

/**
 * 查询公司分页列表
 * 使用 POST 方法，参数通过 data 传递
 */
export function queryCompanyPage(params: CompanyQueryParams) {
  return request<{ items: Company[]; totalCount: number }>({
    url: '/company/query-page',
    method: 'post',
    data: params
  });
}
