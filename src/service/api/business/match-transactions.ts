/**
 * 结算匹配 API 服务
 */

import { request } from "@/service/request";

// ==================== 类型定义 ====================

/** 匹配交易记录（与后端字段一致） */
export interface MatchTransactionRecord {
  ap_pk: string;
  ap_amount: number;
  ap_matchdate: string;
  ap_systemcreatetimeutc: string;
  ap_reason: string;
  ap_ah: string;
  ah_transactionnum: string;
  ah_rx_nktransactioncurrency: string;
  ah_matchstatus: string;
  ah_transactiontype: string;
  companyName: string;
  index?: number;
}

/** 匹配交易查询参数（PascalCase，与后端一致） */
export interface MatchTransactionQueryParams {
  SkipCount: number;
  MaxResultCount: number;
  Shipper?: string;
  JobNumber?: string;
  MatchNumber?: string;
  Type?: string;
  Sorting?: string;
}

/** 匹配明细查询参数 */
export interface MatchTransactionLinesParams {
  apPk: string;
}

/** 组织地址查询参数 */
export interface OrgAddressQueryParams {
  Query?: string;
  SkipCount: number;
  MaxResultCount: number;
}

/** 未结清发票查询参数 */
export interface OutstandingInvoicesParams {
  billingParty: string;
  ledgerScope?: string;
  lineSearch?: string;
  query?: string;
  statementNo?: string;
  currency?: string;
  chargeDesc?: string;
}

/** 保存匹配核销参数 */
export interface SaveMatchWriteOffParams {
  matchNumber: string;
  mode: string;
  billingParty: string;
  billingPartyName: string;
  description: string;
  bankAccountId: string;
  bankAccountName: string;
  settleDate: string;
  refNo: string;
  chequeNo: string;
  settleAmount: number;
  exRateMode: string;
  lines: Array<{
    tthPk: string;
    ledger: string;
    jobNo: string;
    invoiceNumber: string;
    writeOffAmountOriginal: number;
    writeOffAmountHome: number;
    currentOutstandingOriginal: number;
    currentOutstandingHome: number;
  }>;
}

/** 银行账户查询参数 */
export interface WriteOffBankParams {
  mode?: string;
  settleCompanyName?: string;
  settleCompanyCode?: string;
}

// ==================== 工具函数 ====================

/** API 响应 → 表格行（直接使用后端字段） */
export function mapMatchTransactionItem(
  raw: Record<string, any>,
): Partial<MatchTransactionRecord> {
  if (!raw || typeof raw !== "object") return {};
  return {
    ap_pk: raw.ap_pk ?? "",
    ap_amount: Number(raw.ap_amount) || 0,
    ap_matchdate: raw.ap_matchdate ?? "",
    ap_systemcreatetimeutc: raw.ap_systemcreatetimeutc ?? "",
    ap_reason: raw.ap_reason ?? "",
    ap_ah: raw.ap_ah ?? "",
    ah_transactionnum: raw.ah_transactionnum ?? "",
    ah_rx_nktransactioncurrency: raw.ah_rx_nktransactioncurrency ?? "",
    ah_matchstatus: raw.ah_matchstatus ?? "",
    ah_transactiontype: raw.ah_transactiontype ?? "",
    companyName: raw.companyName ?? "",
  };
}

// ==================== API 函数 ====================

/** 分页查询匹配交易列表 */
export function matchTransactionsQueryPage(data: MatchTransactionQueryParams) {
  return request<any>({
    url: "/reconciliation/writeoff/tbl",
    method: "post",
    data,
  });
}

/** 查询匹配明细 */
export function matchTransactionsQueryLines(
  params: MatchTransactionLinesParams,
) {
  return request<any>({
    url: "/reconciliation/writeoff/detail",
    method: "get",
    params,
  });
}

/** 查询组织地址（结算公司） */
export function matchTransactionsQueryOrgAddress(
  params: OrgAddressQueryParams,
  signal?: AbortSignal,
) {
  return request<any>({
    url: "/match-transactions/query-org-address",
    method: "get",
    params,
    signal,
  });
}

/** 查询未结清发票列表 */
export function matchTransactionsQueryOutstandingInvoices(
  data: OutstandingInvoicesParams,
) {
  return request<any>({
    url: "/match-transactions/query-outstandingInvoices",
    method: "post",
    data,
  });
}

/** 保存匹配核销 */
export function matchTransactionsSaveMatchWriteOff(
  data: SaveMatchWriteOffParams,
) {
  return request<any>({
    url: "/match-transactions/save-matchWriteOff",
    method: "post",
    data,
  });
}

/** 查询核销银行 */
export function matchTransactionsGetWriteOffBank(data: WriteOffBankParams) {
  return request<any>({
    url: "/match-transactions/get-writeOff-bank",
    method: "post",
    data,
  });
}

/** 获取下一个匹配单号 */
export function matchTransactionsQueryDraftMatchNumber(params: {
  mode: string;
}) {
  return request<any>({
    url: "/match-transactions/query-draft-match-number",
    method: "get",
    params: { Mode: params.mode },
  });
}
