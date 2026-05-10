/**
 * 结算匹配 API 服务
 */

import { request } from '@/service/request';

// ==================== 类型定义 ====================

/** 匹配交易记录（query-page 列表 camelCase；兼容旧字段映射见 mapMatchTransactionItem） */
export interface MatchTransactionRecord {
  pk: string;
  ledger: string;
  matchNumber: string;
  /** 结算方 ID（常为 GUID） */
  billingParty: string;
  /** 结算方显示名（若接口返回） */
  billingPartyName?: string;
  currency: string;
  settledAmount: number;
  paymentDate: string;
  description: string;
  index?: number;
}

/** 匹配交易查询参数（PascalCase，与 /match-transactions/query-page 一致） */
export interface MatchTransactionQueryParams {
  SkipCount: number;
  MaxResultCount: number;
  Shipper?: string;
  JobNumber?: string;
  MatchNumber?: string;
}

/** 匹配明细查询参数 */
export interface MatchTransactionLinesParams {
  apPk: string;
}

/** 销账编辑页详情（GET /match-transactions/detail） */
export interface MatchTransactionDetailParams {
  Pk: string;
}

/** 组织地址查询参数 */
export interface OrgAddressQueryParams {
  Query?: string;
  SkipCount: number;
  MaxResultCount: number;
}

/** 未结清发票查询参数（POST /match-transactions/query-outstandingInvoices） */
export interface OutstandingInvoicesParams {
  billingParty: string;
  ledgerScope?: string;
  query?: string;
  statementNo?: string;
  currency?: string;
  chargeDesc?: string;
  pageIndex: number;
  pageSize: number;
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

/** API 响应 → 表格行（新 camelCase 与旧 snake_case 均可） */
export function mapMatchTransactionItem(raw: Record<string, any>): Partial<MatchTransactionRecord> {
  if (!raw || typeof raw !== 'object') return {};
  const paymentRaw = raw.paymentDate ?? raw.ap_matchdate ?? '';
  const paymentDate =
    typeof paymentRaw === 'string' && paymentRaw.includes('T') ? paymentRaw.split('T')[0] : paymentRaw;
  return {
    pk: raw.pk ?? raw.ap_pk ?? '',
    ledger: raw.ledger ?? raw.ah_transactiontype ?? '',
    matchNumber: raw.matchNumber ?? raw.ah_transactionnum ?? '',
    billingParty: raw.billingParty ?? '',
    billingPartyName: raw.billingPartyName ?? raw.companyName ?? '',
    currency: raw.currency ?? raw.ah_rx_nktransactioncurrency ?? '',
    settledAmount: Number(raw.settledAmount ?? raw.ap_amount) || 0,
    paymentDate: typeof paymentDate === 'string' ? paymentDate : '',
    description: raw.description ?? raw.ap_reason ?? ''
  };
}

/** 列表行：补全默认值，供表格 / CSV 使用 */
export function normalizeMatchTransactionRecord(raw: Record<string, any>, index?: number): MatchTransactionRecord {
  const m = mapMatchTransactionItem(raw);
  return {
    pk: m.pk ?? '',
    ledger: m.ledger ?? '',
    matchNumber: m.matchNumber ?? '',
    billingParty: m.billingParty ?? '',
    billingPartyName: m.billingPartyName,
    currency: m.currency ?? '',
    settledAmount: m.settledAmount ?? 0,
    paymentDate: m.paymentDate ?? '',
    description: m.description ?? '',
    index
  };
}

/**
 * 将 /match-transactions/detail 或旧版 reconciliation 详情响应整理为 writeoff-edit 使用的结构
 */
export function normalizeWriteoffDetailResponse(raw: Record<string, any> | null | undefined): {
  matchLink: Record<string, any>;
  header: Record<string, any>;
  transactionLines: any[];
} {
  if (!raw || typeof raw !== 'object') {
    return { matchLink: {}, header: {}, transactionLines: [] };
  }
  if (raw.matchLink != null || raw.header != null || raw.transactionLines != null) {
    return {
      matchLink: (raw.matchLink as Record<string, any>) ?? {},
      header: (raw.header as Record<string, any>) ?? {},
      transactionLines: Array.isArray(raw.transactionLines) ? raw.transactionLines : []
    };
  }

  const linesRaw = raw.transactionLines ?? raw.transaction_lines ?? raw.lines ?? raw.items ?? [];
  const transactionLines = Array.isArray(linesRaw) ? linesRaw : [];

  const matchNumber = raw.matchNumber ?? raw.match_number ?? '';
  const paymentDate = raw.paymentDate ?? raw.payment_date ?? '';
  const settledAmount = raw.settledAmount ?? raw.settled_amount;

  const header: Record<string, any> = {
    ah_transactionnum: matchNumber || raw.ah_transactionnum,
    companyName: raw.billingPartyName ?? raw.companyName ?? raw.company_name ?? raw.billing_party_name ?? '',
    ah_desc: raw.description ?? raw.ah_desc ?? '',
    ah_invoiceamount: settledAmount ?? raw.ah_invoiceamount,
    ah_ostotal: settledAmount ?? raw.ah_ostotal,
    ah_ledger: raw.ledger ?? raw.ah_ledger ?? 'AR',
    ah_fullypaiddate: paymentDate || raw.ah_fullypaiddate,
    billingParty: raw.billingParty ?? raw.billing_party
  };

  const matchLink: Record<string, any> = {
    ap_matchgroupnum: matchNumber || raw.ap_matchgroupnum,
    ap_matchdate: paymentDate || raw.ap_matchdate
  };

  return { matchLink, header, transactionLines };
}

// ==================== API 函数 ====================

/** 分页查询匹配交易列表 */
export function matchTransactionsQueryPage(params: MatchTransactionQueryParams) {
  return request<any>({
    url: '/match-transactions/query-page',
    method: 'get',
    params
  });
}

/** 销账编辑页：详情（替代原 reconciliation writeoff detail） */
export function matchTransactionsGetDetail(params: MatchTransactionDetailParams) {
  return request<any>({
    url: '/match-transactions/detail',
    method: 'get',
    params
  });
}

/** 查询匹配明细 */
export function matchTransactionsQueryLines(params: MatchTransactionLinesParams) {
  return request<any>({
    url: '/reconciliation/writeoff/detail',
    method: 'get',
    params
  });
}

/** 查询组织地址（结算公司） */
export function matchTransactionsQueryOrgAddress(params: OrgAddressQueryParams, signal?: AbortSignal) {
  return request<any>({
    url: '/match-transactions/query-org-address',
    method: 'get',
    params,
    signal
  });
}

/** 查询未结清发票列表 */
export function matchTransactionsQueryOutstandingInvoices(data: OutstandingInvoicesParams) {
  return request<any>({
    url: '/match-transactions/query-outstandingInvoices',
    method: 'post',
    data
  });
}

/** 保存匹配核销 */
export function matchTransactionsSaveMatchWriteOff(data: SaveMatchWriteOffParams) {
  return request<any>({
    url: '/match-transactions/save-matchWriteOff',
    method: 'post',
    data
  });
}

/** 查询核销银行 */
export function matchTransactionsGetWriteOffBank(data: WriteOffBankParams) {
  return request<any>({
    url: '/match-transactions/get-writeOff-bank',
    method: 'post',
    data
  });
}

/** 获取下一个匹配单号 */
export function matchTransactionsQueryDraftMatchNumber(params: { mode: string }) {
  return request<any>({
    url: '/match-transactions/query-draft-match-number',
    method: 'get',
    params: { Mode: params.mode }
  });
}
