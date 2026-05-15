<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  NButton,
  NCard,
  NDataTable,
  NDatePicker,
  NDivider,
  NGrid,
  NGi,
  NInput,
  NInputNumber,
  NRadio,
  NRadioGroup,
  NSelect,
  NSpace
} from 'naive-ui';
import { getCurrencyList } from '@/service/api/maintain/currency';
import {
  matchTransactionsGetWriteOffBank,
  matchTransactionsQueryOrgAddress,
  matchTransactionsQueryOutstandingInvoices,
  matchTransactionsSaveMatchWriteOff,
  matchTransactionsQueryDraftMatchNumber,
  parseOrgAddressQueryResponse,
  orgAddressRowLabel,
  orgAddressRowSelectValue,
  orgAddressRowBillingParty,
  orgAddressOutstandingBillingParty,
  mapOutstandingInvoiceToTableRow,
  type OrgAddressRow,
  type OutstandingInvoicesParams,
  type WriteOffBankRow
} from '@/service/api/business/match-transactions';
import type { PaginationProps } from 'naive-ui';

defineOptions({ name: 'PageSettlementWriteoffCreate' });

const router = useRouter();
const { t } = useI18n();
const te = (key: string) => t(`page.settlement.matchTransactions.editor.${key}`);

const formatNum = (n: any, digits = 2) => {
  const x = Number(n);
  if (Number.isNaN(x)) return '—';
  return new Intl.NumberFormat(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(x);
};

const formatDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const saving = ref(false);
const editorLocked = ref(false);

const buildEmptyForm = () => ({
  matchNumber: '',
  settleCompany: null as OrgAddressRow | null,
  settleCompanyName: '',
  description: '',
  bankAccount: null as WriteOffBankRow | null,
  bankAccountName: '',
  refNo: '',
  settleAmount: 0,
  balance: 0,
  settleDate: formatDate(new Date()),
  chequeNo: '',
  otherFees: 0,
  exRateMode: 'system'
});
const form = ref(buildEmptyForm());

const lineLedgerScope = ref('AR');
const lineSearch = ref('');
const statementVal = ref('');
const lineCurrency = ref<string | null>(null);
const showMoreFilters = ref(false);
const moreChargeDesc = ref('');
const allLines = ref<any[]>([]);
const checkedLineKeys = ref<Array<string | number>>([]);
const linesLoading = ref(false);

const linePagination = reactive({
  page: 1,
  pageSize: 50,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  prefix: (info: { itemCount: number | undefined }) => `Total: ${info.itemCount ?? 0}`,
  ['onUpdate:page'](page: number) {
    linePagination.page = page;
    void fetchOutstandingLines();
  },
  ['onUpdate:pageSize'](pageSize: number) {
    linePagination.pageSize = pageSize;
    linePagination.page = 1;
    void fetchOutstandingLines();
  }
}) as PaginationProps;

// Company
const companyOptions = ref<Array<{ label: string; value: string; data: OrgAddressRow }>>([]);
const companyLoading = ref(false);

/** 保证选中项在 options 里，远程下拉才能回显标签 */
const companySelectOptions = computed(() => {
  const c = form.value.settleCompany;
  const v = orgAddressRowSelectValue(c);
  const base = companyOptions.value;
  if (!v) return base;
  if (!c) return base;
  if (base.some(o => o.value === v)) return base;
  return [
    {
      label: form.value.settleCompanyName || orgAddressRowLabel(c),
      value: v,
      data: c
    },
    ...base
  ];
});

const companySelectValue = computed(() => {
  const v = orgAddressRowSelectValue(form.value.settleCompany);
  return v || null;
});

const canSearchOutstanding = computed(() => Boolean(orgAddressOutstandingBillingParty(form.value.settleCompany)));

async function handleSearchCompany(query: string) {
  companyLoading.value = true;
  try {
    const res: any = await matchTransactionsQueryOrgAddress({ Query: query ?? '' });
    const raw = parseOrgAddressQueryResponse(res);
    companyOptions.value = raw
      .map((item: OrgAddressRow) => ({
        label: orgAddressRowLabel(item),
        value: orgAddressRowSelectValue(item),
        data: item
      }))
      .filter((o: { value: string }) => o.value);
  } finally {
    companyLoading.value = false;
  }
}

function onCompanyMenuShow(show: boolean) {
  if (show) void nextTick(() => void handleSearchCompany(''));
}

function getCompanyOptionByValue(value: string) {
  const fromList = companyOptions.value.find(c => c.value === value);
  if (fromList) return fromList;
  const c = form.value.settleCompany;
  if (c && orgAddressRowSelectValue(c) === value) {
    return {
      label: form.value.settleCompanyName || orgAddressRowLabel(c),
      value,
      data: c
    };
  }
  return undefined;
}

async function handleSelectCompany(value: string | null) {
  if (editorLocked.value) return;
  if (value == null || value === '') {
    form.value.settleCompany = null;
    form.value.settleCompanyName = '';
    allLines.value = [];
    checkedLineKeys.value = [];
    linePagination.itemCount = 0;
    return;
  }
  const sel = getCompanyOptionByValue(value);
  if (sel?.data) {
    form.value.settleCompany = sel.data;
    form.value.settleCompanyName = sel.data.oH_FullName;
    linePagination.page = 1;
    try {
      await fetchOutstandingLines();
    } catch {
      allLines.value = [];
      checkedLineKeys.value = [];
      linePagination.itemCount = 0;
    }
  }
}

const bankOptions = ref<Array<{ label: string; value: string; data: WriteOffBankRow }>>([]);
const bankLoading = ref(false);

const bankSelectOptions = computed(() => {
  const acc = form.value.bankAccount;
  const base = bankOptions.value;
  if (!acc) return base;
  const code = String(acc.ab_code ?? '').trim();
  if (!code) return base;
  if (base.some(o => o.value === code)) return base;
  return [
    {
      label: String(acc.ab_bankname ?? code),
      value: code,
      data: acc
    },
    ...base
  ];
});

async function handleSearchBank(query: string) {
  const settleCompanyName = String(query ?? '').trim();
  bankLoading.value = true;
  try {
    const res: any = await matchTransactionsGetWriteOffBank({ settleCompanyName });
    const list: WriteOffBankRow[] = Array.isArray(res?.data) ? res.data : [];
    bankOptions.value = list.map((item, i) => {
      const code = String(item.ab_code ?? '').trim() || `row-${i}`;
      return {
        label: String(item.ab_bankname ?? code),
        value: code,
        data: item
      };
    });
  } catch {
    bankOptions.value = [];
  } finally {
    bankLoading.value = false;
  }
}

function onBankMenuShow(show: boolean) {
  if (show) void nextTick(() => void handleSearchBank(''));
}

function getBankOptionByValue(value: string) {
  const fromList = bankOptions.value.find(b => b.value === value);
  if (fromList) return fromList;
  const acc = form.value.bankAccount;
  if (acc && String(acc.ab_code ?? '').trim() === value) {
    return {
      label: String(acc.ab_bankname ?? value),
      value,
      data: acc
    };
  }
  return undefined;
}

function handleSelectBank(value: string | null) {
  if (editorLocked.value) return;
  if (value == null || value === '') {
    form.value.bankAccount = null;
    form.value.bankAccountName = '';
    return;
  }
  const sel = getBankOptionByValue(value);
  if (sel?.data) {
    form.value.bankAccount = sel.data;
    form.value.bankAccountName = sel.data.ab_bankname ?? '';
  }
}

// Currency
const currencyOptions = ref<Array<{ label: string; value: string }>>([]);
async function loadCurrencies() {
  try {
    const r: any = await getCurrencyList();
    const c = Array.isArray(r) ? r : r?.data || r?.result || [];
    currencyOptions.value = c.map((x: any) => ({ label: x.desc ? `${x.code} - ${x.desc}` : x.code, value: x.code }));
  } catch {
    currencyOptions.value = [
      { label: 'CNY', value: 'CNY' },
      { label: 'USD', value: 'USD' }
    ];
  }
}

// Outstanding（接口 data.items 为 camelCase，映射为表格 snake_case）
function buildOutstandingPayload(billingParty: string): OutstandingInvoicesParams {
  const payload: OutstandingInvoicesParams = {
    billingParty,
    ledgerScope: lineLedgerScope.value || 'AR'
  };
  if (lineSearch.value?.trim()) payload.query = lineSearch.value.trim();
  if (statementVal.value?.trim()) payload.statementNo = statementVal.value.trim();
  if (lineCurrency.value) payload.currency = lineCurrency.value;
  if (moreChargeDesc.value?.trim()) payload.chargeDesc = moreChargeDesc.value.trim();
  const page = linePagination.page ?? 1;
  const pageSize = linePagination.pageSize ?? 50;
  payload.pageIndex = Math.max(0, page - 1);
  payload.pageSize = pageSize;
  return payload;
}

async function fetchOutstandingLines() {
  if (editorLocked.value) return;
  const cn = orgAddressOutstandingBillingParty(form.value.settleCompany);
  if (!cn) {
    window.$message?.warning('Select company first.');
    allLines.value = [];
    checkedLineKeys.value = [];
    linePagination.itemCount = 0;
    return;
  }
  linesLoading.value = true;
  try {
    const payload = buildOutstandingPayload(cn);
    const res: any = await matchTransactionsQueryOutstandingInvoices(payload);
    if (res && res.success === false) {
      allLines.value = [];
      checkedLineKeys.value = [];
      linePagination.itemCount = 0;
      window.$message?.error(res.msg || 'Failed to load.');
      return;
    }
    const items = Array.isArray(res?.data?.items) ? res.data.items : [];
    const total = Number(res?.data?.totalCount) || items.length;
    allLines.value = items
      .map((item: Record<string, any>, idx: number) => mapOutstandingInvoiceToTableRow(item, idx))
      .filter(Boolean) as any[];
    checkedLineKeys.value = [];
    linePagination.itemCount = Number.isFinite(total) ? total : items.length;
  } catch {
    window.$message?.error('Failed to load.');
    allLines.value = [];
    checkedLineKeys.value = [];
    linePagination.itemCount = 0;
  } finally {
    linesLoading.value = false;
  }
}

async function onSearchLines() {
  if (editorLocked.value) return;
  const cn = orgAddressOutstandingBillingParty(form.value.settleCompany);
  if (!cn) {
    window.$message?.warning('Select company first.');
    return;
  }
  linePagination.page = 1;
  try {
    await fetchOutstandingLines();
  } catch {
    window.$message?.error('Failed to load.');
  }
}

// Summary
const selectedLines = computed(() => {
  const s = new Set(checkedLineKeys.value.map(String));
  return allLines.value.filter((r: any) => s.has(String(r.id ?? '')));
});
const selectedOutstandingTotal = computed(() =>
  selectedLines.value.reduce((a: number, r: any) => a + (Number(r.outstanding) || 0), 0)
);
const summaryRows = computed(() => {
  const map = new Map<string, any>();
  for (const row of selectedLines.value as any[]) {
    const cur = String(row.currency ?? ''),
      rate = Number(row.ex_rate ?? 1);
    const key = `${cur}__${rate}`;
    const c = map.get(key) ?? { key, currency: cur, exRate: rate, osAmount: 0, settledAmount: 0, homeAmount: 0 };
    c.osAmount += Number(row.outstanding) || 0;
    c.settledAmount += Number(row.settlement_amount_original) || 0;
    c.homeAmount += Number(row.settlement_amount_home) || 0;
    map.set(key, c);
  }
  return Array.from(map.values());
});
const summaryTotalHomeAmount = computed(() =>
  summaryRows.value.reduce((a: number, r: any) => a + (Number(r.homeAmount) || 0), 0)
);
watch(
  () => [selectedOutstandingTotal.value, form.value.settleAmount],
  () => {
    form.value.balance = (Number(form.value.settleAmount) || 0) - selectedOutstandingTotal.value;
  },
  { immediate: true }
);

watch(lineLedgerScope, () => {
  if (editorLocked.value) return;
  if (!orgAddressOutstandingBillingParty(form.value.settleCompany)) return;
  linePagination.page = 1;
  void fetchOutstandingLines();
});

// Line columns
const lineColumns = [
  { type: 'selection' as const },
  { key: 'index', title: '#', width: 50, align: 'center' as const, render: (_: any, i: number) => i + 1 },
  { key: 'ledger', title: 'Ledger', width: 80, align: 'center' as const },
  { key: 'job_no', title: 'Job No.', width: 120, ellipsis: { tooltip: true } },
  { key: 'tax_invoice_no', title: 'Tax Invoice No.', width: 140, ellipsis: { tooltip: true } },
  { key: 'invoice_number', title: 'Invoice Number', width: 140, ellipsis: { tooltip: true } },
  { key: 'billing_date', title: 'Billing Date', width: 120 },
  { key: 'charge_desc', title: 'Charge Desc.', width: 140, ellipsis: { tooltip: true } },
  {
    key: 'outstanding',
    title: 'Outstanding',
    width: 120,
    align: 'right' as const,
    render: (r: any) => formatNum(r.outstanding)
  },
  {
    key: 'settlement_amount_original',
    title: 'Settled (Original)',
    width: 200,
    align: 'right' as const,
    render: (r: any) => formatNum(r.settlement_amount_original)
  },
  { key: 'currency', title: 'Currency', width: 80, align: 'center' as const },
  {
    key: 'ex_rate',
    title: 'Ex. Rate',
    width: 100,
    align: 'right' as const,
    render: (r: any) => formatNum(r.ex_rate, 6)
  },
  {
    key: 'settlement_amount_home',
    title: 'Settled (Home)',
    width: 180,
    align: 'right' as const,
    render: (r: any) => formatNum(r.settlement_amount_home)
  }
];

// Save
function toIso(val: string) {
  if (!val) return new Date().toISOString();
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return new Date(`${val}T00:00:00`).toISOString();
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}
async function handleSave() {
  if (editorLocked.value || saving.value) return;
  if (!selectedLines.value.length) {
    window.$message?.warning('Select at least one line.');
    return;
  }
  if (!form.value.settleCompany) {
    window.$message?.warning('Select company.');
    return;
  }
  const billingPartyForSave = orgAddressRowBillingParty(form.value.settleCompany);
  if (!billingPartyForSave) {
    window.$message?.warning('Select company.');
    return;
  }
  if (!form.value.bankAccount) {
    window.$message?.warning('Select bank account.');
    return;
  }
  const amt = Number(form.value.settleAmount) || 0;
  if (amt <= 0) {
    window.$message?.warning('Amount > 0 required.');
    return;
  }

  const sorted = [...selectedLines.value].sort(
    (a: any, b: any) => (Number(a.outstanding) || 0) - (Number(b.outstanding) || 0)
  );
  let rem = amt;
  const wMap = new Map<number, number>();
  for (const item of sorted) {
    const os = Math.max(Number((item as any).outstanding) || 0, 0);
    const w = Math.min(rem, os);
    wMap.set(allLines.value.indexOf(item), w);
    rem -= w;
    if (rem <= 0) rem = 0;
  }
  const lines = selectedLines.value.map((row: any) => {
    const idx = allLines.value.indexOf(row),
      os = Math.max(Number(row.outstanding) || 0, 0),
      ex = Number(row.ex_rate) || 1,
      wo = wMap.get(idx) ?? 0;
    return {
      tthPk: String(row.tth_pk ?? row.id ?? ''),
      ledger: row.ledger ?? '',
      jobNo: row.job_no ?? '',
      invoiceNumber: row.invoice_number ?? '',
      writeOffAmountOriginal: wo,
      writeOffAmountHome: wo * ex,
      currentOutstandingOriginal: Math.max(os - wo, 0),
      currentOutstandingHome: Math.max(os - wo, 0) * ex
    };
  });
  saving.value = true;
  try {
    const res: any = await matchTransactionsSaveMatchWriteOff({
      matchNumber: form.value.matchNumber,
      mode: lineLedgerScope.value === 'AR' ? 'receipt' : 'payment',
      billingParty: billingPartyForSave,
      billingPartyName: form.value.settleCompanyName,
      description: form.value.description,
      bankAccountId: String(form.value.bankAccount?.ab_code ?? ''),
      bankAccountName: form.value.bankAccountName,
      settleDate: toIso(form.value.settleDate),
      refNo: form.value.refNo,
      chequeNo: form.value.chequeNo,
      settleAmount: amt,
      exRateMode: form.value.exRateMode,
      lines
    });
    if (res?.success === false) {
      window.$message?.error(res.msg || 'Save failed.');
      return;
    }
    const mn = res?.data?.matchNumber ?? res?.data?.match_number ?? '';
    if (mn) form.value.matchNumber = String(mn);
    editorLocked.value = true;
    window.$message?.success('Saved.');
  } catch {
    window.$message?.error('Failed to save.');
  } finally {
    saving.value = false;
  }
}

function handleBack() {
  router.push({ name: 'settlement_writeoff' });
}
function handleReset() {
  const sc = form.value.settleCompany,
    scn = form.value.settleCompanyName,
    ba = form.value.bankAccount,
    ban = form.value.bankAccountName;
  form.value = buildEmptyForm();
  form.value.settleCompany = sc;
  form.value.settleCompanyName = scn;
  form.value.bankAccount = ba;
  form.value.bankAccountName = ban;
  lineLedgerScope.value = 'AR';
  lineSearch.value = '';
  statementVal.value = '';
  lineCurrency.value = null;
  showMoreFilters.value = false;
  moreChargeDesc.value = '';
  allLines.value = [];
  checkedLineKeys.value = [];
  editorLocked.value = false;
  // matchTransactionsQueryDraftMatchNumber({ mode: 'receipt' })
  //   .then((r: any) => {
  //     if (r?.data) form.value.matchNumber = String(r.data);
  //   })
  //   .catch(() => { });
  const cn = orgAddressOutstandingBillingParty(sc);
  if (cn) {
    linePagination.page = 1;
    fetchOutstandingLines().catch(() => {});
  }
}

loadCurrencies();
// matchTransactionsQueryDraftMatchNumber({ mode: 'receipt' })
//   .then((r: any) => {
//     if (r?.data) form.value.matchNumber = String(r.data);
//   })
//   .catch(() => { });
</script>

<template>
  <div class="h-full overflow-auto p-16px">
    <NCard title="New Receipt" :bordered="false">
      <template #header-extra>
        <NSpace>
          <NButton @click="handleReset">{{ t('common.reset') }}</NButton>
          <NButton type="primary" :loading="saving" :disabled="editorLocked" @click="handleSave">
            {{ t('common.save') }}
          </NButton>
          <NButton @click="handleBack">{{ t('common.cancel') }}</NButton>
        </NSpace>
      </template>

      <NGrid :cols="24" :x-gap="12" :y-gap="12" class="mb-12px">
        <NGi :span="6">
          <NSpace vertical>
            <div class="flex items-center gap-8px">
              <span class="shrink-0 w-80px text-right text-12px">{{ te('settleCompany') }}:</span>
              <NSelect
                :value="companySelectValue"
                :options="companySelectOptions"
                :loading="companyLoading"
                filterable
                remote
                clearable
                :placeholder="te('pleaseSelect')"
                :disabled="editorLocked"
                class="flex-1"
                @search="handleSearchCompany"
                @update:show="onCompanyMenuShow"
                @update:value="handleSelectCompany"
              />
            </div>
            <NInput
              v-model:value="form.description"
              type="textarea"
              :rows="6"
              :disabled="editorLocked"
              :placeholder="te('pleaseInput')"
            >
              <template #prefix>{{ te('description') }}:</template>
            </NInput>
          </NSpace>
        </NGi>
        <NGi :span="12">
          <NCard size="small" :bordered="true">
            <template #header>{{ te('bankTransactionRecord') }}</template>
            <NGrid :cols="2" :x-gap="12" :y-gap="8">
              <NGi>
                <div class="flex items-center gap-8px">
                  <span class="shrink-0 w-80px text-right text-12px">{{ te('bankAccount') }}:</span>
                  <NSelect
                    :value="form.bankAccount?.ab_code ?? null"
                    :options="bankSelectOptions"
                    :loading="bankLoading"
                    filterable
                    remote
                    clearable
                    :placeholder="te('pleaseSelect')"
                    :disabled="editorLocked"
                    class="flex-1"
                    @search="handleSearchBank"
                    @update:show="onBankMenuShow"
                    @update:value="handleSelectBank"
                  />
                </div>
              </NGi>
              <NGi>
                <div class="flex items-center gap-8px">
                  <span class="shrink-0 w-80px text-right text-12px">{{ te('settleDate') }}:</span>
                  <NDatePicker
                    v-model:formatted-value="form.settleDate"
                    type="date"
                    value-format="yyyy-MM-dd"
                    :disabled="editorLocked"
                    clearable
                    class="flex-1"
                  />
                </div>
              </NGi>
              <NGi>
                <NInput v-model:value="form.refNo" :disabled="editorLocked" :placeholder="te('pleaseInput')">
                  <template #prefix>{{ te('refNo') }}:</template>
                </NInput>
              </NGi>
              <NGi>
                <NInput v-model:value="form.chequeNo" :disabled="editorLocked" :placeholder="te('pleaseInput')">
                  <template #prefix>{{ te('chequeNo') }}:</template>
                </NInput>
              </NGi>
              <NGi>
                <NInputNumber
                  v-model:value="form.settleAmount"
                  :disabled="editorLocked"
                  class="w-full"
                  :show-button="false"
                >
                  <template #prefix>{{ te('settleAmount') }}:</template>
                </NInputNumber>
              </NGi>
              <NGi>
                <NInput
                  :value="formatNum(form.balance)"
                  readonly
                  @click="
                    () => {
                      if (!editorLocked) form.settleAmount = selectedOutstandingTotal;
                    }
                  "
                >
                  <template #prefix>{{ te('balance') }}:</template>
                </NInput>
              </NGi>
            </NGrid>
          </NCard>
        </NGi>
        <NGi :span="6">
          <NCard size="small" :bordered="true">
            <NRadioGroup v-model:value="form.exRateMode" :disabled="editorLocked" size="small">
              <NRadio value="system" size="small">{{ te('systemExRate') }}</NRadio>
            </NRadioGroup>
            <div class="mt-8px">
              <table class="w-full text-12px">
                <thead>
                  <tr>
                    <th class="text-right pa-4px">{{ te('osAmount') }}</th>
                    <th class="text-right pa-4px">{{ te('settledAmount') }}</th>
                    <th class="text-right pa-4px">{{ te('exRate') }}</th>
                    <th class="text-right pa-4px">{{ te('homeAmount') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in summaryRows" :key="r.key">
                    <td class="text-right pa-4px">{{ formatNum(r.osAmount) }}</td>
                    <td class="text-right pa-4px">{{ formatNum(r.settledAmount) }}</td>
                    <td class="text-right pa-4px">{{ r.currency }} {{ formatNum(r.exRate, 6) }}</td>
                    <td class="text-right pa-4px">{{ formatNum(r.homeAmount) }}</td>
                  </tr>
                  <tr class="font-bold">
                    <td class="text-right pa-4px" colspan="3">{{ te('total') }}</td>
                    <td class="text-right pa-4px">{{ formatNum(summaryTotalHomeAmount) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </NCard>
        </NGi>
      </NGrid>

      <NDivider style="margin: 8px 0" />
      <NSpace align="center" class="mb-8px py-8px" :wrap="true">
        <NRadioGroup v-model:value="lineLedgerScope" :disabled="editorLocked || !canSearchOutstanding" size="small">
          <NRadio value="AR" size="small">AR</NRadio>
          <NRadio value="AP" size="small">AP</NRadio>
        </NRadioGroup>
        <NInput
          v-model:value="lineSearch"
          :disabled="editorLocked || !canSearchOutstanding"
          clearable
          :placeholder="te('pleaseInput')"
          style="width: 200px"
        />
        <NInput
          v-model:value="statementVal"
          :disabled="editorLocked || !canSearchOutstanding"
          clearable
          :placeholder="te('pleaseInput')"
          style="width: 180px"
        >
          <template #prefix>{{ te('statementNo') }}:</template>
        </NInput>
        <NSelect
          v-model:value="lineCurrency"
          :options="currencyOptions"
          clearable
          :disabled="editorLocked || !canSearchOutstanding"
          :placeholder="te('currency')"
          style="width: 140px"
        />
        <NButton type="primary" :disabled="editorLocked || !canSearchOutstanding" size="small" @click="onSearchLines">
          {{ t('common.search') }}
        </NButton>
        <NButton size="small" :disabled="editorLocked" @click="showMoreFilters = !showMoreFilters">
          {{ showMoreFilters ? 'Hide' : 'More' }}
        </NButton>
      </NSpace>
      <NSpace v-if="showMoreFilters" class="mb-8px">
        <NInput v-model:value="moreChargeDesc" :disabled="editorLocked || !canSearchOutstanding" style="width: 240px">
          <template #prefix>{{ te('chargeDescFilter') }}:</template>
        </NInput>
      </NSpace>
      <NDivider style="margin: 8px 0" />
      <NDataTable
        v-model:checked-row-keys="checkedLineKeys"
        :columns="lineColumns as any"
        :data="allLines as any"
        :bordered="false"
        striped
        :pagination="canSearchOutstanding ? linePagination : false"
        :loading="linesLoading"
        size="small"
        :scroll-x="1700"
        :row-key="(r: any) => r.id"
        :disabled="editorLocked"
      />
    </NCard>
  </div>
</template>

<style scoped>
table {
  border-collapse: collapse;
}
</style>
