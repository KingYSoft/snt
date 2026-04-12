/**
 * 结算模块 API 服务
 * TODO: 待后端对接后，替换 Mock 实现为真实 API 调用
 */

// import { request } from '@/service/request'; // TODO: 待后端对接后启用

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
  /** 销账单号 */
  writeoffNo: string;
  /** 公司 ID */
  companyId: string;
  /** 公司名称 */
  companyName: string;
  /** 销账金额 */
  amount: number;
  /** 币种 */
  currency: string;
  /** 销账日期 */
  writeoffDate: string;
  /** 状态: draft-草稿, submitted-已提交, approved-已批准, rejected-已拒绝 */
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  /** 创建时间 */
  createdAt: string;
  /** 备注 */
  remark?: string;
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
const mockWriteoffList: WriteoffRecord[] = [
  {
    writeoffNo: 'WFF20250101001',
    companyId: '1',
    companyName: 'ABC 贸易公司',
    amount: 15000.0,
    currency: 'CNY',
    writeoffDate: '2025-01-15',
    status: 'approved',
    createdAt: '2025-01-15T10:30:00',
    remark: '月度结算'
  },
  {
    writeoffNo: 'WFF20250102001',
    companyId: '2',
    companyName: 'XYZ 物流有限公司',
    amount: 8500.5,
    currency: 'USD',
    writeoffDate: '2025-01-16',
    status: 'submitted',
    createdAt: '2025-01-16T14:20:00',
    remark: ''
  },
  {
    writeoffNo: 'WFF20250103001',
    companyId: '3',
    companyName: '全球供应链公司',
    amount: 25000.0,
    currency: 'CNY',
    writeoffDate: '2025-01-17',
    status: 'draft',
    createdAt: '2025-01-17T09:15:00',
    remark: '待审核'
  },
  {
    writeoffNo: 'WFF20250104001',
    companyId: '1',
    companyName: 'ABC 贸易公司',
    amount: 5000.0,
    currency: 'CNY',
    writeoffDate: '2025-01-18',
    status: 'approved',
    createdAt: '2025-01-18T16:45:00'
  },
  {
    writeoffNo: 'WFF20250105001',
    companyId: '4',
    companyName: '太平洋货运代理',
    amount: 12500.0,
    currency: 'HKD',
    writeoffDate: '2025-01-19',
    status: 'submitted',
    createdAt: '2025-01-19T11:30:00',
    remark: '港币结算'
  }
];

const mockReceivableTransactions: SettlementTransactionRecord[] = [
  {
    pk: '2634001505',
    id: '2634001505',
    invoice_date: '2024-03-31',
    ledger: 'AR',
    tran_type: 'CRD',
    job_invoice_number: 'SRU235008880A',
    transaction_num: '2634001505',
    creditor_debtor: 'TIANWUF SN',
    creditor_debtor_full_name: 'TIANJIN WUFANG NEW MATERIAL CO LTD',
    invoice_description: '费用推关于 2634001505 -',
    post_date: '2024-03-31',
    due_date: '2024-03-30',
    currency: 'CNY',
    trans_amount: -2850,
    exchange_rate: 1,
    local_amount: -2850,
    branch: 'SHA',
    department: 'FES',
    tax_amount: 0,
    outstanding_amount: 0,
    fully_paid_date: '2024-03-31',
    job_number: 'SRU235008880',
    canceled: 'Y'
  },
  {
    pk: '2634001506',
    id: '2634001506',
    invoice_date: '2024-04-01',
    ledger: 'AR',
    tran_type: 'INV',
    job_invoice_number: 'SB0226002200',
    transaction_num: '2634001506',
    creditor_debtor: 'SHANGHAI01',
    creditor_debtor_full_name: 'SHANGHAI SAMPLE TRADING CO LTD',
    invoice_description: 'Freight charges SB0226002200',
    post_date: '2024-04-01',
    due_date: '2024-04-30',
    currency: 'CNY',
    trans_amount: 5600.5,
    exchange_rate: 1,
    local_amount: 5600.5,
    branch: 'CKG',
    department: 'FIA',
    tax_amount: 0,
    outstanding_amount: 1200,
    fully_paid_date: '',
    job_number: 'SB0226002200',
    canceled: 'N'
  },
  {
    pk: '2634001507',
    id: '2634001507',
    invoice_date: '2024-04-02',
    ledger: 'AR',
    tran_type: 'INV',
    job_invoice_number: 'NGB24040012',
    transaction_num: '2634001507',
    creditor_debtor: 'NINGBOFX',
    creditor_debtor_full_name: 'NINGBO FORWARDING EXPRESS LTD',
    invoice_description: 'Handling fee NGB24040012',
    post_date: '2024-04-02',
    due_date: '2024-05-02',
    currency: 'CNY',
    trans_amount: 890.25,
    exchange_rate: 1,
    local_amount: 890.25,
    branch: 'NGB',
    department: 'FES',
    tax_amount: 0,
    outstanding_amount: 890.25,
    fully_paid_date: '',
    job_number: 'NGB24040012',
    canceled: 'N'
  },
  {
    pk: '2634001544',
    id: '2634001544',
    invoice_date: '2024-04-03',
    ledger: 'AR',
    tran_type: 'INV',
    job_invoice_number: 'SB0226002334',
    transaction_num: '2634001544',
    creditor_debtor: 'WENTILNGB',
    creditor_debtor_full_name: 'WENZHOU TILING TOOLS IMPORT AND EXPORT CO. LTD',
    invoice_description: 'SB0226002334',
    post_date: '2024-04-03',
    due_date: '2024-04-03',
    currency: 'CNY',
    trans_amount: 3112.33,
    exchange_rate: 1,
    local_amount: 3112.33,
    branch: 'NGB',
    department: 'FES',
    tax_amount: 0,
    outstanding_amount: 3112.33,
    fully_paid_date: '',
    job_number: 'SB0226002334',
    canceled: 'N'
  },
  {
    pk: '2634001545',
    id: '2634001545',
    invoice_date: '2024-04-03',
    ledger: 'AR',
    tran_type: 'INV',
    job_invoice_number: 'SB0226002334',
    transaction_num: '2634001545',
    creditor_debtor: 'WENTILNGB',
    creditor_debtor_full_name: 'WENZHOU TILING TOOLS IMPORT AND EXPORT CO. LTD',
    invoice_description: 'SB0226002334 (line 2)',
    post_date: '2024-04-03',
    due_date: '2024-04-03',
    currency: 'CNY',
    trans_amount: 1200,
    exchange_rate: 1,
    local_amount: 1200,
    branch: 'NGB',
    department: 'FES',
    tax_amount: 0,
    outstanding_amount: 1200,
    fully_paid_date: '',
    job_number: 'SB0226002334',
    canceled: 'N'
  },
  {
    pk: '2634001546',
    id: '2634001546',
    invoice_date: '2024-04-03',
    ledger: 'AR',
    tran_type: 'CRD',
    job_invoice_number: 'SB0226002334',
    transaction_num: '2634001546',
    creditor_debtor: 'WENTILNGB',
    creditor_debtor_full_name: 'WENZHOU TILING TOOLS IMPORT AND EXPORT CO. LTD',
    invoice_description: 'SB0226002334 (credit)',
    post_date: '2024-04-03',
    due_date: '2024-04-03',
    currency: 'CNY',
    trans_amount: -200,
    exchange_rate: 1,
    local_amount: -200,
    branch: 'NGB',
    department: 'FES',
    tax_amount: 0,
    outstanding_amount: 0,
    fully_paid_date: '2024-04-03',
    job_number: 'SB0226002334',
    canceled: 'N'
  },
  {
    pk: '2634001600',
    id: '2634001600',
    invoice_date: '2024-04-05',
    ledger: 'AR',
    tran_type: 'CRD',
    job_invoice_number: 'SHA24040501',
    transaction_num: '2634001600',
    creditor_debtor: 'SHAEXAMPLE',
    creditor_debtor_full_name: 'SHANGHAI EXAMPLE LOGISTICS CO LTD',
    invoice_description: 'Credit adjustment SHA24040501',
    post_date: '2024-04-05',
    due_date: '2024-04-05',
    currency: 'CNY',
    trans_amount: -500,
    exchange_rate: 1,
    local_amount: -500,
    branch: 'SHA',
    department: 'FES',
    tax_amount: 0,
    outstanding_amount: 0,
    fully_paid_date: '2024-04-05',
    job_number: 'SHA240405',
    canceled: 'Y'
  }
];

const mockPayableTransactions: SettlementTransactionRecord[] = [
  {
    pk: 'ap-1001',
    id: 'ap-1001',
    invoice_date: '2026-03-23',
    ledger: 'AP',
    tran_type: 'INV',
    job_invoice_number: 'APBILL-202603-001',
    transaction_num: 'ap-1001',
    creditor_debtor: 'SUPPLIER01',
    creditor_debtor_full_name: 'SAMPLE SUPPLIER CO LTD',
    invoice_description: 'AP invoice APBILL-202603-001',
    post_date: '2026-03-23',
    due_date: '2026-04-22',
    currency: 'CNY',
    trans_amount: 360,
    exchange_rate: 1,
    local_amount: 360,
    branch: 'SHA',
    department: 'FES',
    tax_amount: 0,
    outstanding_amount: 360,
    fully_paid_date: '',
    job_number: 'JOB-AP-001',
    canceled: 'N'
  },
  {
    pk: 'ap-1002',
    id: 'ap-1002',
    invoice_date: '2026-03-30',
    ledger: 'AP',
    tran_type: 'INV',
    job_invoice_number: 'APBILL-202603-002',
    transaction_num: 'ap-1002',
    creditor_debtor: 'SUPPLIER02',
    creditor_debtor_full_name: 'ANOTHER SUPPLIER INC',
    invoice_description: 'AP invoice APBILL-202603-002',
    post_date: '2026-03-30',
    due_date: '2026-04-29',
    currency: 'GBP',
    trans_amount: 456,
    exchange_rate: 9.12,
    local_amount: 4158.72,
    branch: 'NGB',
    department: 'FES',
    tax_amount: 0,
    outstanding_amount: 0,
    fully_paid_date: '2026-04-05',
    job_number: 'JOB-AP-002',
    canceled: 'N'
  }
];

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
 * TODO: 待后端对接，替换为真实 API
 */
export async function queryWriteoffList(params: WriteoffListQueryParams) {
  // Mock 实现
  return new Promise<any>(resolve => {
    setTimeout(() => {
      let filteredList = [...mockWriteoffList];

      // 应用过滤器
      if (params.filters && params.filters.length > 0) {
        filteredList = mockWriteoffList.filter(item => {
          return params.filters!.every(filter => {
            const value = String(item[filter.key as keyof WriteoffRecord] || '').toLowerCase();
            const filterVal = filter.val.toLowerCase();
            switch (filter.op) {
              case 'Equal':
                return value === filterVal;
              case 'NotEqual':
                return value !== filterVal;
              case 'Contain':
                return value.includes(filterVal);
              case 'NotContain':
                return !value.includes(filterVal);
              default:
                return true;
            }
          });
        });
      }

      // 分页
      const start = params.skipCount;
      const end = start + params.maxResultCount;
      const paginatedList = filteredList.slice(start, end);

      // 返回符合 sjcTransform 格式的响应
      resolve({
        data: {
          items: paginatedList,
          totalCount: filteredList.length
        },
        error: null
      });
    }, 300);
  });

  // 真实 API 调用示例（待后端对接后启用）:
  // return request<WriteoffListResponse>({
  //   url: '/api/settlement/writeoff/list',
  //   method: 'get',
  //   params
  // });
}

function parseDateString(value?: string) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function filterSettlementTransactions(items: SettlementTransactionRecord[], params: SettlementTransactionQueryParams) {
  const start = parseDateString(params.dateStart);
  const end = parseDateString(params.dateEnd);
  const keywordField = params.keywordField || 'creditor_debtor';
  const keywordValue = params.keywordValue?.trim().toLowerCase();

  return items.filter(item => {
    const invoiceDate = parseDateString(item.invoice_date);

    if (start && invoiceDate && invoiceDate < start) {
      return false;
    }

    if (end && invoiceDate && invoiceDate > end) {
      return false;
    }

    if (keywordValue) {
      const value = String(item[keywordField as keyof SettlementTransactionRecord] || '').toLowerCase();

      if (!value.includes(keywordValue)) {
        return false;
      }
    }

    const simpleFilters: Array<[string | undefined, string]> = [
      [params.ledger, item.ledger],
      [params.tranType, item.tran_type],
      [params.branch, item.branch],
      [params.department, item.department],
      [params.canceled, item.canceled]
    ];

    return simpleFilters.every(([filterValue, actualValue]) => {
      if (!filterValue) {
        return true;
      }

      return actualValue.toLowerCase().includes(filterValue.trim().toLowerCase());
    });
  });
}

async function querySettlementTransactions(
  source: SettlementTransactionRecord[],
  params: SettlementTransactionQueryParams
) {
  return new Promise<any>(resolve => {
    setTimeout(() => {
      const filteredList = filterSettlementTransactions(source, params);
      const start = params.skipCount;
      const end = start + params.maxResultCount;

      resolve({
        data: {
          items: filteredList.slice(start, end),
          totalCount: filteredList.length
        },
        error: null
      });
    }, 180);
  });
}

export async function queryReceivableTransactions(params: SettlementTransactionQueryParams) {
  return querySettlementTransactions(mockReceivableTransactions, params);
}

export async function queryPayableTransactions(params: SettlementTransactionQueryParams) {
  return querySettlementTransactions(mockPayableTransactions, params);
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
