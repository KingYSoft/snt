import { request } from '../request';

/**
 * Query switch table data (company, branch, department list)
 */
export function querySwitchTbl() {
  return request<{
    company_list: Array<{
      company_pk: string;
      company_code: string;
      company_name: string;
      branch_list: Array<{
        branch_pk: string;
        branch_code: string;
        branch_name: string;
        dept_list: Array<{
          dept_pk: string;
          dept_code: string;
          dept_name: string;
        }>;
      }>;
    }>;
  }>({
    url: '/user/querySwitchTbl',
    method: 'get'
  });
}

/**
 * Switch branch
 */
export function switchBranch(data: { company_pk: string | null; branch_pk: string | null; dept_pk: string | null }) {
  return request<{ access_token: string }>({
    url: '/user/switchBranch',
    method: 'post',
    data
  });
}
