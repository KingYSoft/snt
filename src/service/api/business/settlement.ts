/**
 * 结算模块 API 服务
 */

import { queryArBilling, queryApBilling, type BillingTblInput } from './billing';
import { request } from '@/service/request';

/**
 * API 契约文档（待后端对接）
 *
 * 销账列表 API: GET /api/settlement/writeoff/list
 * 请求参数: WriteoffListQueryParams
 * 响应数据: { items: WriteoffRecord[], totalCount: number }
 *
 * 结欠余额 API: GET /api/settlement/outstanding-balance
 * 请求参数: { companyId: string }
 * 响应数据: OutstandingBalance
 *
 * 明细项目 API: GET /api/settlement/outstanding-items
 * 请求参数: { companyId: string }
 * 响应数据: OutstandingItem[]
 *
 * 保存销账 API: POST /api/settlement/writeoff/save
 * 请求参数: WriteoffCreateRequest
 * 响应数据: WriteoffCreateResponse
 */

// ==================== 类型定义 ====================

/**
 * 销账记录
 */
export interface WriteoffRecord {
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
}

/**
 * 销账列表查询参数
 */
export interface WriteoffListQueryParams {
  skipCount: number;
  maxResultCount: number;
  filters?: Array<{ key: string; op: string; val: string }>;
}

/**
 * 销账列表响应
 */
export interface WriteoffListResponse {
  items: WriteoffRecord[];
  totalCount: number;
}

/**
 * 结欠余额
 */
export interface OutstandingBalance {
  /** 公司 ID */
  companyId: string;
  /** 公司名称 */
  companyName: string;
  /** 结欠金额 */
  balance: number;
  /** 币种 */
  currency: string;
  /** 基础币种金额（如果涉及外币） */
  baseCurrencyAmount?: number;
  /** 汇率（如果涉及外币） */
  exchangeRate?: number;
}

/**
 * 销账明细项目（结欠余额明细）
 */
export interface OutstandingItem {
  /** 明细 ID */
  id: string;
  /** 工作单号 */
  jobNo: string;
  /** 税务发票号 */
  taxInvoiceNo: string;
  /** 账单号 */
  billNo: string;
  /** 账单日期 */
  billingDate: string;
  /** 费用类型 */
  fee: string;
  /** 原币种 */
  originalCurrency: string;
  /** 原币种欠款金额 */
  originalOutstandingAmount: number;
  /** 原币种已结算金额 */
  settledAmountOriginalCurrency: number;
  /** 货币符号 */
  symbol: string;
  /** 汇率 */
  exRate: number;
  /** 转换后已结算金额 */
  settledAmountConverted: number;
  /** 转换后币种 */
  convertedCurrency: string;
  /** 单据号（向后兼容） */
  documentNo?: string;
  /** 单据类型（向后兼容） */
  documentType?: string;
  /** 金额（向后兼容） */
  amount?: number;
  /** 币种（向后兼容） */
  currency?: string;
  /** 单据日期（向后兼容） */
  documentDate?: string;
  /** 到期日（向后兼容） */
  dueDate?: string;
  /** 是否已选中 */
  selected?: boolean;
}

/**
 * 销账创建请求
 */
export interface WriteoffCreateRequest {
  /** 公司 ID */
  companyId: string;
  /** 销账金额 */
  amount: number;
  /** 币种 */
  currency: string;
  /** 选择的明细项目 IDs */
  itemIds: string[];
  /** 银行 ID */
  bankId: string;
  /** 银行名称 */
  bankName: string;
  /** 银行账户 */
  bankAccount: string;
  /** 是否涉及外币 */
  isForeignCurrency: boolean;
  /** 汇率（外币时需要） */
  exchangeRate?: number;
  /** 付款方式 */
  paymentMethod: string;
  /** 参考号 */
  referenceNo?: string;
  /** 备注 */
  remark?: string;
}

/**
 * 销账创建响应
 */
export interface WriteoffCreateResponse {
  /** 销账单号 */
  writeoffNo: string;
  /** 成功标志 */
  success: boolean;
  /** 消息 */
  message: string;
}

export interface SettlementTransactionRecord {
  pk: string;
  id: string;
  invoice_date: string;
  ledger: string;
  tran_type: string;
  job_invoice_number: string;
  transaction_num: string;
  creditor_debtor: string;
  creditor_debtor_full_name: string;
  invoice_description: string;
  post_date: string;
  due_date: string;
  currency: string;
  trans_amount: number;
  exchange_rate: number;
  local_amount: number;
  branch: string;
  department: string;
  tax_amount: number;
  outstanding_amount: number;
  fully_paid_date: string;
  job_number: string;
  canceled: 'Y' | 'N';
}

export interface SettlementTransactionQueryParams {
  skipCount: number;
  maxResultCount: number;
  dateStart?: string;
  dateEnd?: string;
  keywordField?: keyof SettlementTransactionRecord | string;
  keywordValue?: string;
  ledger?: string;
  tranType?: string;
  branch?: string;
  department?: string;
  canceled?: string;
}

// ==================== Mock 数据 ====================

/**
 * Mock 销账列表数据
 */
// const mockWriteoffList = [
//   {
//     writeoffNo: "WFF20250101001",
//     companyId: "1",
//     companyName: "ABC 贸易公司",
//     amount: 15000.0,
//     currency: "CNY",
//     writeoffDate: "2025-01-15",
//     status: "approved",
//     createdAt: "2025-01-15T10:30:00",
//     remark: "月度结算",
//   },
//   {
//     writeoffNo: "WFF20250102001",
//     companyId: "2",
//     companyName: "XYZ 物流有限公司",
//     amount: 8500.5,
//     currency: "USD",
//     writeoffDate: "2025-01-16",
//     status: "submitted",
//     createdAt: "2025-01-16T14:20:00",
//     remark: "",
//   },
//   {
//     writeoffNo: "WFF20250103001",
//     companyId: "3",
//     companyName: "全球供应链公司",
//     amount: 25000.0,
//     currency: "CNY",
//     writeoffDate: "2025-01-17",
//     status: "draft",
//     createdAt: "2025-01-17T09:15:00",
//     remark: "待审核",
//   },
//   {
//     writeoffNo: "WFF20250104001",
//     companyId: "1",
//     companyName: "ABC 贸易公司",
//     amount: 5000.0,
//     currency: "CNY",
//     writeoffDate: "2025-01-18",
//     status: "approved",
//     createdAt: "2025-01-18T16:45:00",
//   },
//   {
//     writeoffNo: "WFF20250105001",
//     companyId: "4",
//     companyName: "太平洋货运代理",
//     amount: 12500.0,
//     currency: "HKD",
//     writeoffDate: "2025-01-19",
//     status: "submitted",
//     createdAt: "2025-01-19T11:30:00",
//     remark: "港币结算",
//   },
// ];

/**
 * Mock 结欠余额数据（按公司 ID 索引）
 */
const mockOutstandingBalances: Record<string, OutstandingBalance> = {
  '1': {
    companyId: '1',
    companyName: 'ABC 贸易公司',
    balance: 45000.0,
    currency: 'CNY',
    baseCurrencyAmount: 45000.0
  },
  '2': {
    companyId: '2',
    companyName: 'XYZ 物流有限公司',
    balance: 28000.0,
    currency: 'USD',
    baseCurrencyAmount: 201600.0,
    exchangeRate: 7.2
  },
  '3': {
    companyId: '3',
    companyName: '全球供应链公司',
    balance: 32000.0,
    currency: 'CNY',
    baseCurrencyAmount: 32000.0
  },
  '4': {
    companyId: '4',
    companyName: '太平洋货运代理',
    balance: 18000.0,
    currency: 'HKD',
    baseCurrencyAmount: 16560.0,
    exchangeRate: 0.92
  }
};

/**
 * Mock 明细项目数据（按公司 ID 索引）
 */
const mockOutstandingItems: Record<string, OutstandingItem[]> = {
  '1': [
    {
      id: 'INV-001',
      jobNo: 'QDOS26000001',
      taxInvoiceNo: '',
      billNo: '',
      billingDate: '2024-12-01',
      fee: 'Document Fee',
      originalCurrency: 'CNY',
      originalOutstandingAmount: 15000.0,
      settledAmountOriginalCurrency: 0,
      symbol: 'CNY',
      exRate: 1.0,
      settledAmountConverted: 0,
      convertedCurrency: 'CNY',
      // 向后兼容字段
      documentNo: 'INV-2024-12-001',
      documentType: '发票',
      amount: 15000.0,
      currency: 'CNY',
      documentDate: '2024-12-01',
      dueDate: '2025-01-15'
    },
    {
      id: 'INV-002',
      jobNo: 'QDOS26000002',
      taxInvoiceNo: '',
      billNo: '',
      billingDate: '2024-12-15',
      fee: 'ICS2',
      originalCurrency: 'CNY',
      originalOutstandingAmount: 20000.0,
      settledAmountOriginalCurrency: 0,
      symbol: 'CNY',
      exRate: 1.0,
      settledAmountConverted: 0,
      convertedCurrency: 'CNY',
      documentNo: 'INV-2024-12-002',
      documentType: '发票',
      amount: 20000.0,
      currency: 'CNY',
      documentDate: '2024-12-15',
      dueDate: '2025-01-30'
    },
    {
      id: 'INV-003',
      jobNo: 'QDOS26000003',
      taxInvoiceNo: '',
      billNo: '',
      billingDate: '2024-12-20',
      fee: 'Information Fee',
      originalCurrency: 'CNY',
      originalOutstandingAmount: 10000.0,
      settledAmountOriginalCurrency: 0,
      symbol: 'CNY',
      exRate: 1.0,
      settledAmountConverted: 0,
      convertedCurrency: 'CNY',
      documentNo: 'INV-2024-12-003',
      documentType: '发票',
      amount: 10000.0,
      currency: 'CNY',
      documentDate: '2024-12-20',
      dueDate: '2025-02-05'
    }
  ],
  '2': [
    {
      id: 'INV-004',
      jobNo: 'QDOS26000004',
      taxInvoiceNo: '',
      billNo: '',
      billingDate: '2024-12-01',
      fee: 'Surrended Fee',
      originalCurrency: 'USD',
      originalOutstandingAmount: 12000.0,
      settledAmountOriginalCurrency: 0,
      symbol: 'USD',
      exRate: 7.2,
      settledAmountConverted: 0,
      convertedCurrency: 'CNY',
      documentNo: 'INV-US-001',
      documentType: 'Invoice',
      amount: 12000.0,
      currency: 'USD',
      documentDate: '2024-12-01',
      dueDate: '2025-01-15'
    },
    {
      id: 'INV-005',
      jobNo: 'QDOS26000005',
      taxInvoiceNo: '',
      billNo: '',
      billingDate: '2024-12-10',
      fee: 'Handling Fee',
      originalCurrency: 'USD',
      originalOutstandingAmount: 16000.0,
      settledAmountOriginalCurrency: 0,
      symbol: 'USD',
      exRate: 7.2,
      settledAmountConverted: 0,
      convertedCurrency: 'CNY',
      documentNo: 'INV-US-002',
      documentType: 'Invoice',
      amount: 16000.0,
      currency: 'USD',
      documentDate: '2024-12-10',
      dueDate: '2025-01-25'
    }
  ],
  '3': [
    {
      id: 'INV-006',
      jobNo: 'QDOS26000006',
      taxInvoiceNo: '',
      billNo: '',
      billingDate: '2024-12-01',
      fee: 'Document Fee',
      originalCurrency: 'CNY',
      originalOutstandingAmount: 18000.0,
      settledAmountOriginalCurrency: 0,
      symbol: 'CNY',
      exRate: 1.0,
      settledAmountConverted: 0,
      convertedCurrency: 'CNY',
      documentNo: 'INV-GL-001',
      documentType: '发票',
      amount: 18000.0,
      currency: 'CNY',
      documentDate: '2024-12-01',
      dueDate: '2025-01-20'
    },
    {
      id: 'INV-007',
      jobNo: 'QDOS26000007',
      taxInvoiceNo: '',
      billNo: '',
      billingDate: '2024-12-05',
      fee: 'Storage Fee',
      originalCurrency: 'CNY',
      originalOutstandingAmount: 14000.0,
      settledAmountOriginalCurrency: 0,
      symbol: 'CNY',
      exRate: 1.0,
      settledAmountConverted: 0,
      convertedCurrency: 'CNY',
      documentNo: 'INV-GL-002',
      documentType: '发票',
      amount: 14000.0,
      currency: 'CNY',
      documentDate: '2024-12-05',
      dueDate: '2025-01-28'
    }
  ],
  '4': [
    {
      id: 'INV-008',
      jobNo: 'QDOS26000008',
      taxInvoiceNo: '',
      billNo: '',
      billingDate: '2024-12-01',
      fee: 'Document Fee',
      originalCurrency: 'HKD',
      originalOutstandingAmount: 10000.0,
      settledAmountOriginalCurrency: 0,
      symbol: 'HKD',
      exRate: 0.92,
      settledAmountConverted: 0,
      convertedCurrency: 'CNY',
      documentNo: 'INV-HK-001',
      documentType: 'Invoice',
      amount: 10000.0,
      currency: 'HKD',
      documentDate: '2024-12-01',
      dueDate: '2025-01-18'
    },
    {
      id: 'INV-009',
      jobNo: 'QDOS26000009',
      taxInvoiceNo: '',
      billNo: '',
      billingDate: '2024-12-08',
      fee: 'Handling Fee',
      originalCurrency: 'HKD',
      originalOutstandingAmount: 8000.0,
      settledAmountOriginalCurrency: 0,
      symbol: 'HKD',
      exRate: 0.92,
      settledAmountConverted: 0,
      convertedCurrency: 'CNY',
      documentNo: 'INV-HK-002',
      documentType: 'Invoice',
      amount: 8000.0,
      currency: 'HKD',
      documentDate: '2024-12-08',
      dueDate: '2025-01-22'
    }
  ]
};

// ==================== API 函数 ====================

/**
 * 查询销账列表
 */
export async function queryWriteoffList(params: WriteoffListQueryParams) {
  return request({
    url: '/reconciliation/writeoff/tbl',
    method: 'post',
    data: params
  });
}

/**
 * 查询销账详情
 */
export async function queryWriteoffDetail(apPk: string) {
  return request({
    url: '/reconciliation/writeoff/detail',
    method: 'get',
    params: { apPk }
  });
}

function buildBillingFilters(params: SettlementTransactionQueryParams): Array<{
  key: string;
  op: string;
  val: string;
  start?: string;
  end?: string;
}> {
  const filters: Array<{
    key: string;
    op: string;
    val: string;
    start?: string;
    end?: string;
  }> = [];

  // Date range filter - use ah_invoicedate
  if (params.dateStart || params.dateEnd) {
    filters.push({
      key: 'ah_invoicedate',
      op: 'between',
      val: '',
      start: params.dateStart || '',
      end: params.dateEnd || ''
    });
  }

  // Keyword filter - map to actual field names
  if (params.keywordValue && params.keywordField) {
    const fieldMap: Record<string, string> = {
      creditor_debtor: 'ah_oh',
      creditor_debtor_full_name: 'ah_oh',
      job_number: 'ah_jobnumber',
      transaction_num: 'ah_transactionnum',
      job_invoice_number: 'ah_jobnumber'
    };
    filters.push({
      key: fieldMap[params.keywordField] || params.keywordField,
      op: 'Contain',
      val: params.keywordValue
    });
  }

  // Ledger filter
  if (params.ledger) {
    filters.push({
      key: 'ah_ledger',
      op: 'Equal',
      val: params.ledger
    });
  }

  // Transaction type filter
  if (params.tranType) {
    filters.push({
      key: 'ah_transactiontype',
      op: 'Equal',
      val: params.tranType
    });
  }

  // Branch filter
  if (params.branch) {
    filters.push({
      key: 'ah_systemcreatebranch',
      op: 'Equal',
      val: params.branch
    });
  }

  // Department filter
  if (params.department) {
    filters.push({
      key: 'ah_systemcreatedepartment',
      op: 'Equal',
      val: params.department
    });
  }

  // Canceled filter
  if (params.canceled) {
    filters.push({
      key: 'ah_iscancelled',
      op: 'Equal',
      val: params.canceled === 'Y' ? '1' : '0'
    });
  }

  return filters;
}

function formatDateToYYYYMMDD(isoDate: string | null): string {
  if (!isoDate) return '';
  return isoDate.split('T')[0];
}

function mapBillingRecordToTransaction(item: any): SettlementTransactionRecord {
  if (!item) {
    return {
      pk: '',
      id: '',
      invoice_date: '',
      ledger: '',
      tran_type: '',
      job_invoice_number: '',
      transaction_num: '',
      creditor_debtor: '',
      creditor_debtor_full_name: '',
      invoice_description: '',
      post_date: '',
      due_date: '',
      currency: '',
      trans_amount: 0,
      exchange_rate: 1,
      local_amount: 0,
      branch: '',
      department: '',
      tax_amount: 0,
      outstanding_amount: 0,
      fully_paid_date: '',
      job_number: '',
      canceled: 'N'
    };
  }

  // Map organization fields - check for joined data or use PK fallback
  const creditorDebtorCode = item.oh_e2_oa_address || item.oh_oa_code || item.ah_oh || '';
  const creditorDebtorName = item.oh_e2_companyname || item.oh_oa_name || item.ab_e2_companyname || '';

  // Job invoice number: priority based on field availability
  // AR uses consolidatedinvoiceref, AP uses chequeorreference, fallback to jobnumber or transactionnum
  const jobInvoiceNumber =
    item.ah_consolidatedinvoiceref || item.ah_chequeorreference || item.ah_jobnumber || item.ah_transactionnum || '';

  return {
    pk: item.ah_pk || '',
    id: item.ah_pk || '',
    invoice_date: formatDateToYYYYMMDD(item.ah_invoicedate),
    ledger: item.ah_ledger || '',
    tran_type: item.ah_transactiontype || '',
    job_invoice_number: jobInvoiceNumber,
    transaction_num: item.ah_transactionnum || '',
    creditor_debtor: creditorDebtorCode,
    creditor_debtor_full_name: creditorDebtorName,
    invoice_description: item.ah_desc || '',
    post_date: formatDateToYYYYMMDD(item.ah_postdate),
    due_date: formatDateToYYYYMMDD(item.ah_duedate),
    currency: item.ah_rx_nktransactioncurrency || '',
    trans_amount: item.ah_invoiceamount || 0,
    exchange_rate: item.ah_exchangerate || 1,
    local_amount: item.ah_localtotal || 0,
    branch: item.ah_systemcreatebranch || '',
    department: item.ah_systemcreatedepartment || '',
    tax_amount: item.ah_gstamount || 0,
    outstanding_amount: item.ah_outstandingamount || 0,
    fully_paid_date: formatDateToYYYYMMDD(item.ah_fullypaiddate),
    job_number: item.ah_jobnumber || '',
    canceled: item.ah_iscancelled === 1 ? 'Y' : 'N'
  };
}

export async function queryReceivableTransactions(params: SettlementTransactionQueryParams) {
  const billingParams: BillingTblInput = {
    skipCount: params.skipCount,
    maxResultCount: params.maxResultCount,
    filters: buildBillingFilters(params)
  };

  const response = (await queryArBilling(billingParams)) as any;

  // Transform the response to match SettlementTransactionRecord format
  if (response?.data?.items && Array.isArray(response.data.items)) {
    response.data.items = response.data.items.filter((item: any) => item != null).map(mapBillingRecordToTransaction);
  }

  return response;
}

export async function queryPayableTransactions(params: SettlementTransactionQueryParams) {
  const billingParams: BillingTblInput = {
    skipCount: params.skipCount,
    maxResultCount: params.maxResultCount,
    filters: buildBillingFilters(params)
  };

  const response = (await queryApBilling(billingParams)) as any;

  // Transform the response to match SettlementTransactionRecord format
  if (response?.data?.items && Array.isArray(response.data.items)) {
    response.data.items = response.data.items.filter((item: any) => item != null).map(mapBillingRecordToTransaction);
  }

  return response;
}

/**
 * 获取结欠余额
 * TODO: 待后端对接，替换为真实 API
 */
export async function getOutstandingBalance(companyId: string) {
  // Mock 实现
  return new Promise<OutstandingBalance>(resolve => {
    setTimeout(() => {
      const balance = mockOutstandingBalances[companyId] || {
        companyId,
        companyName: '未知公司',
        balance: 0,
        currency: 'CNY',
        baseCurrencyAmount: 0
      };
      resolve(balance);
    }, 200);
  });

  // 真实 API 调用示例（待后端对接后启用）:
  // return request<OutstandingBalance>({
  //   url: '/api/settlement/outstanding-balance',
  //   method: 'get',
  //   params: { companyId }
  // });
}

/**
 * 获取明细项目列表
 * TODO: 待后端对接，替换为真实 API
 */
export async function getOutstandingItems(companyId: string) {
  // Mock 实现
  return new Promise<OutstandingItem[]>(resolve => {
    setTimeout(() => {
      const items = mockOutstandingItems[companyId] || [];
      resolve(items);
    }, 200);
  });

  // 真实 API 调用示例（待后端对接后启用）:
  // return request<OutstandingItem[]>({
  //   url: '/api/settlement/outstanding-items',
  //   method: 'get',
  //   params: { companyId }
  // });
}

/**
 * 保存销账记录
 * TODO: 待后端对接，替换为真实 API
 */
export async function saveWriteoff(_data: WriteoffCreateRequest) {
  // Mock 实现
  return new Promise<WriteoffCreateResponse>(resolve => {
    setTimeout(() => {
      const writeoffNo = `WFF${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
      resolve({
        writeoffNo,
        success: true,
        message: '销账记录保存成功'
      });
    }, 500);
  });

  // 真实 API 调用示例（待后端对接后启用）:
  // return request<WriteoffCreateResponse>({
  //   url: '/api/settlement/writeoff/save',
  //   method: 'post',
  //   data
  // });
}
