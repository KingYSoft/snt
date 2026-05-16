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
  EtdStart?: string;
  EtdEnd?: string;
  PaymentDateStart?: string;
  PaymentDateEnd?: string;
}

/** 匹配明细查询参数 */
export interface MatchTransactionLinesParams {
  apPk: string;
}

/** 销账编辑页详情（GET /match-transactions/detail） */
export interface MatchTransactionDetailParams {
  Pk: string;
}

/** 组织地址查询参数（GET /match-transactions/query-org-address） */
export interface OrgAddressQueryParams {
  Query: string;
}

/** GET /match-transactions/query-org-address 返回的 data */
export interface OrgAddressQueryResponseData {
  list: OrgAddressRow[];
}

/** 组织地址行（与接口一致） */
export interface OrgAddressRow {
  aH_OH: string;
  oH_FullName: string;
  oH_Code: string;
}

export function parseOrgAddressQueryResponse(
  res: { data?: OrgAddressQueryResponseData } | null | undefined
): OrgAddressRow[] {
  const list = res?.data?.list;
  return Array.isArray(list) ? list : [];
}

export function orgAddressRowLabel(row: OrgAddressRow | null | undefined): string {
  if (!row?.oH_Code && !row?.oH_FullName) return '—';
  return `${row.oH_FullName} (${row.oH_Code})`;
}

/** 下拉 option value（公司编码） */
export function orgAddressRowSelectValue(row: OrgAddressRow | null | undefined): string {
  return row?.oH_Code ?? '';
}

/** 保存核销等接口的 billingParty（公司编码，与后端约定为准） */
export function orgAddressRowBillingParty(row: OrgAddressRow | null | undefined): string {
  return String(row?.oH_Code ?? '').trim();
}

/** POST query-outstandingInvoices 的 billingParty：使用组织头主键 aH_OH */
export function orgAddressOutstandingBillingParty(row: OrgAddressRow | null | undefined): string {
  return String(row?.aH_OH ?? '').trim();
}

/** 未结清发票查询（POST /match-transactions/query-outstandingInvoices） */
export interface OutstandingInvoicesParams {
  billingParty: string;
  ledgerScope: string;
  query?: string;
  statementNo?: string;
  currency?: string;
  chargeDesc?: string;
  pageIndex?: number;
  pageSize?: number;
}

/** 接口返回的 data.items 单行（camelCase） */
export interface OutstandingInvoiceItem {
  id: string;
  tthPk: string;
  ledger: string;
  jobNo: string;
  taxInvoiceNo: string;
  invoiceNumber: string;
  billingDate: string;
  chargeDesc: string;
  outstanding: number;
  settlementAmountOriginal: number;
  exRate: number;
  settlementAmountHome: number;
  currency: string;
}

/** 转为表格行（内部 snake_case，与现有列、保存逻辑一致） */
export function mapOutstandingInvoiceToTableRow(raw: Record<string, any>, index: number) {
  if (!raw || typeof raw !== 'object') return null;
  const billingRaw = raw.billingDate ?? '';
  const billingDateStr =
    typeof billingRaw === 'string' && billingRaw.includes('T') ? billingRaw.split('T')[0] : String(billingRaw);
  return {
    id: String(raw.id ?? `l-${index}`),
    tth_pk: raw.tthPk ?? '',
    ledger: String(raw.ledger ?? '').toUpperCase() || 'AR',
    job_no: raw.jobNo ?? '',
    tax_invoice_no: raw.taxInvoiceNo ?? '',
    invoice_number: raw.invoiceNumber ?? '',
    billing_date: billingDateStr,
    currency: raw.currency ?? '',
    charge_desc: raw.chargeDesc ?? '',
    outstanding: Number(raw.outstanding) || 0,
    settlement_amount_original: Number(raw.settlementAmountOriginal) || 0,
    ex_rate: Number(raw.exRate) || 1,
    settlement_amount_home: Number(raw.settlementAmountHome) || 0
  };
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

/** 核销银行查询（POST /match-transactions/get-writeOff-bank） */
export interface WriteOffBankParams {
  settleCompanyName: string;
}

/** 核销银行行（与接口 data[] 一致） */
export interface WriteOffBankRow {
  ab_code: string;
  ab_bankname: string;
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
 * 新版详情常见形态：{ header, bank, lines }
 */
export function normalizeWriteoffDetailResponse(raw: Record<string, any> | null | undefined): {
  matchLink: Record<string, any>;
  header: Record<string, any>;
  transactionLines: any[];
  bank: Record<string, any> | null;
} {
  if (!raw || typeof raw !== 'object') {
    return { matchLink: {}, header: {}, transactionLines: [], bank: null };
  }
  const bankRaw = raw.bank ?? null;
  const bank = bankRaw && typeof bankRaw === 'object' ? (bankRaw as Record<string, any>) : null;

  const hasBundleShape =
    raw.matchLink != null || raw.header != null || raw.transactionLines != null || Array.isArray(raw.lines);

  if (hasBundleShape) {
    const transactionLines = Array.isArray(raw.transactionLines)
      ? raw.transactionLines
      : Array.isArray(raw.lines)
        ? raw.lines
        : [];
    return {
      matchLink: (raw.matchLink as Record<string, any>) ?? {},
      header: (raw.header as Record<string, any>) ?? {},
      transactionLines,
      bank
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

  return { matchLink, header, transactionLines, bank: null };
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

export interface MatchTransactionsCurrencyOptionsParams {
  query?: string;
}

export function parseMatchTransactionsCurrencyOptions(payload: unknown): Array<{ label: string; value: string }> {
  const rows = (payload as { data?: Array<{ code?: string }> } | null | undefined)?.data;
  if (!Array.isArray(rows)) return [];
  const out: Array<{ label: string; value: string }> = [];
  for (const row of rows) {
    const code = String(row?.code ?? '').trim();
    if (!code) continue;
    out.push({ label: code, value: code });
  }
  return out;
}

export function matchTransactionsCurrencyOptions(params?: MatchTransactionsCurrencyOptionsParams) {
  return request<any>({
    url: '/match-transactions/currency-options',
    method: 'get',
    params: {
      query: params?.query?.trim() ?? ''
    }
  });
}
