<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
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
  matchTransactionsQueryLines,
  matchTransactionsQueryOrgAddress,
  matchTransactionsQueryOutstandingInvoices,
  matchTransactionsSaveMatchWriteOff
} from '@/service/api/business/match-transactions';

defineOptions({ name: 'PageSettlementWriteoffEdit' });

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const te = (key: string) => t(`page.settlement.matchTransactions.editor.${key}`);

const pk = String(route.query.pk ?? '');

const formatNum = (n: any, digits = 2) => {
  const x = Number(n);
  if (Number.isNaN(x)) return '—';
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(x);
};

const formatDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const saving = ref(false);
const editorLocked = ref(false);
const loading = ref(true);

// ==================== Form ====================
const buildEmptyForm = () => ({
  matchNumber: '',
  settleCompany: null as any,
  settleCompanyName: '',
  description: '',
  bankAccount: null as any,
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
const _showMoreFilters = ref(false);
const moreChargeDesc = ref('');

const allLines = ref<any[]>([]);
const checkedLineKeys = ref<Array<string | number>>([]);

// ==================== Company Selector ====================
const companyOptions = ref<Array<{ label: string; value: string; data: any }>>([]);
const companyLoading = ref(false);

async function handleSearchCompany(query: string) {
  if (!query) {
    companyOptions.value = [];
    return;
  }
  companyLoading.value = true;
  try {
    const res: any = await matchTransactionsQueryOrgAddress({
      Query: query,
      SkipCount: 0,
      MaxResultCount: 50
    });
    const items = res?.data?.items ?? res?.items ?? [];
    companyOptions.value = items.map((item: any) => ({
      label: `${item.name ?? item.company_name ?? ''} (${item.code ?? ''})`,
      value: item.pk ?? item.id ?? '',
      data: item
    }));
  } catch (error) {
    console.error(error);
  } finally {
    companyLoading.value = false;
  }
}

async function handleSelectCompany(value: string) {
  if (editorLocked.value) return;
  const selected = companyOptions.value.find(c => c.value === value);
  if (selected?.data) {
    form.value.settleCompany = selected.data;
    form.value.settleCompanyName = selected.data.name ?? selected.data.company_name ?? '';
    const companyName = String(selected.data.company_name ?? '').trim();
    if (companyName) {
      try {
        await queryOutstandingInvoiceLines(companyName);
      } catch (error) {
        console.error(error);
        allLines.value = [];
        checkedLineKeys.value = [];
      }
    }
  }
}

// ==================== Bank Selector ====================
const bankOptions = ref<Array<{ label: string; value: string; data: any }>>([]);
const bankLoading = ref(false);

async function loadBankAccounts() {
  bankLoading.value = true;
  try {
    const res: any = await matchTransactionsGetWriteOffBank({});
    const list = res?.data ?? [];
    bankOptions.value = list.map((item: any, index: number) => ({
      label: item.bankAccount ?? item.account_name ?? `Bank ${index + 1}`,
      value: `${item.bankAccount ?? ''}-${index}`,
      data: item
    }));
  } catch (error) {
    console.error(error);
  } finally {
    bankLoading.value = false;
  }
}

function handleSelectBank(value: string) {
  if (editorLocked.value) return;
  const selected = bankOptions.value.find(b => b.value === value);
  if (selected?.data) {
    form.value.bankAccount = selected.data;
    form.value.bankAccountName = selected.data.bankAccount ?? '';
  }
}

// ==================== Currency ====================
const currencyOptions = ref<Array<{ label: string; value: string }>>([]);

async function loadCurrencies() {
  try {
    const response: any = await getCurrencyList();
    const currencies = Array.isArray(response) ? response : response?.data || response?.result || [];
    currencyOptions.value = currencies.map((c: any) => ({
      label: c.desc ? `${c.code} - ${c.desc}` : c.code,
      value: c.code
    }));
  } catch {
    currencyOptions.value = [
      { label: 'CNY', value: 'CNY' },
      { label: 'USD', value: 'USD' },
      { label: 'HKD', value: 'HKD' }
    ];
  }
}

// ==================== Outstanding Invoices ====================
const mapLine = (raw: any, index: number) => {
  if (!raw || typeof raw !== 'object') return null;
  const rawId = raw.id ?? raw.line_id ?? raw.lineId ?? raw.pk ?? `line-${index}`;
  return {
    id: String(rawId),
    tth_pk: raw.tth_pk ?? raw.pk ?? '',
    ledger: String(raw.ledger ?? raw.line_type ?? '').toUpperCase() || 'AR',
    job_no: raw.job_no ?? raw.jobNo ?? '',
    tax_invoice_no: raw.tax_invoice_no ?? raw.taxInvoiceNo ?? '',
    invoice_number: raw.invoice_number ?? raw.invoiceNumber ?? '',
    billing_date: raw.billing_date ?? raw.billingDate ?? '',
    currency: raw.currency ?? '',
    charge_desc: raw.charge_desc ?? raw.chargeDesc ?? '',
    outstanding: Number(raw.outstanding ?? raw.os_amount ?? 0) || 0,
    settlement_amount_original: Number(raw.settlement_amount_original ?? raw.settlementAmountOriginal ?? 0) || 0,
    ex_rate: Number(raw.ex_rate ?? raw.exRate ?? 1) || 1,
    settlement_amount_home: Number(raw.settlement_amount_home ?? raw.settlementAmountHome ?? 0) || 0
  };
};

async function queryOutstandingInvoiceLines(companyName: string) {
  const billingParty = String(companyName).trim();
  if (!billingParty) {
    allLines.value = [];
    checkedLineKeys.value = [];
    return;
  }
  const payload: any = { billingParty };
  if (lineLedgerScope.value) payload.ledgerScope = lineLedgerScope.value;
  if (lineSearch.value?.trim()) {
    payload.lineSearch = lineSearch.value.trim();
    payload.query = lineSearch.value.trim();
  }
  if (statementVal.value?.trim()) payload.statementNo = statementVal.value.trim();
  if (lineCurrency.value) payload.currency = lineCurrency.value;
  if (moreChargeDesc.value?.trim()) payload.chargeDesc = moreChargeDesc.value.trim();
  const res: any = await matchTransactionsQueryOutstandingInvoices(payload);
  if (res && res.success === false) {
    allLines.value = [];
    checkedLineKeys.value = [];
    return;
  }
  const sourceItems = Array.isArray(res?.data?.items)
    ? res.data.items
    : Array.isArray(res?.data?.list)
      ? res.data.list
      : [];
  allLines.value = sourceItems.map((item: any, idx: number) => mapLine(item, idx)).filter(Boolean);
  checkedLineKeys.value = [];
}

async function onSearchLines() {
  if (editorLocked.value) return;
  const companyName = String(form.value.settleCompany?.company_name ?? '').trim();
  if (!companyName) {
    window.$message?.warning('Please select settlement company first.');
    return;
  }
  try {
    await queryOutstandingInvoiceLines(companyName);
  } catch (error) {
    console.error(error);
    window.$message?.error('Failed to load outstanding invoices.');
  }
}

// ==================== Summary ====================
const selectedLines = computed(() => {
  const keySet = new Set(checkedLineKeys.value.map(String));
  return allLines.value.filter((r: any) => keySet.has(String(r.id ?? '')));
});

const selectedOutstandingTotal = computed(() =>
  selectedLines.value.reduce((acc: number, row: any) => acc + (Number(row.outstanding) || 0), 0)
);

const summaryRows = computed(() => {
  const map = new Map<string, any>();
  for (const row of selectedLines.value as any[]) {
    const currency = String(row.currency ?? '');
    const exRate = Number(row.ex_rate ?? 1);
    if (Number.isNaN(exRate)) continue;
    const key = `${currency}__${exRate}`;
    const cur = map.get(key) ?? {
      key,
      currency,
      exRate: Number.isFinite(exRate) ? exRate : 1,
      osAmount: 0,
      settledAmount: 0,
      homeAmount: 0
    };
    cur.osAmount += Number(row.outstanding) || 0;
    cur.settledAmount += Number(row.settlement_amount_original) || 0;
    cur.homeAmount += Number(row.settlement_amount_home) || 0;
    map.set(key, cur);
  }
  return Array.from(map.values());
});

const summaryTotalHomeAmount = computed(() =>
  summaryRows.value.reduce((acc: number, r: any) => acc + (Number(r.homeAmount) || 0), 0)
);

watch(
  () => [selectedOutstandingTotal.value, form.value.settleAmount],
  ([outstandingTotal, settleAmount]) => {
    form.value.balance = (Number(settleAmount) || 0) - (Number(outstandingTotal) || 0);
  },
  { immediate: true }
);

// ==================== Line Table ====================
const lineColumns = [
  { type: 'selection' as const, fixed: 'left' as const },
  {
    key: 'index',
    title: '#',
    width: 50,
    align: 'center' as const,
    render: (_: any, index: number) => index + 1
  },
  { key: 'ledger', title: 'Ledger', width: 80, align: 'center' as const },
  { key: 'job_no', title: 'Job No.', width: 120, ellipsis: { tooltip: true } },
  {
    key: 'tax_invoice_no',
    title: 'Tax Invoice No.',
    width: 140,
    ellipsis: { tooltip: true }
  },
  {
    key: 'invoice_number',
    title: 'Invoice Number',
    width: 140,
    ellipsis: { tooltip: true }
  },
  { key: 'billing_date', title: 'Billing Date', width: 120 },
  {
    key: 'charge_desc',
    title: 'Charge Desc.',
    width: 140,
    ellipsis: { tooltip: true }
  },
  {
    key: 'outstanding',
    title: 'Outstanding',
    width: 120,
    align: 'right' as const,
    render: (row: any) => formatNum(row.outstanding)
  },
  {
    key: 'settlement_amount_original',
    title: 'Settlement Amount (Original)',
    width: 220,
    align: 'right' as const,
    render: (row: any) => formatNum(row.settlement_amount_original)
  },
  { key: 'currency', title: 'Currency', width: 80, align: 'center' as const },
  {
    key: 'ex_rate',
    title: 'Ex. Rate',
    width: 100,
    align: 'right' as const,
    render: (row: any) => formatNum(row.ex_rate, 6)
  },
  {
    key: 'settlement_amount_home',
    title: 'Settlement Amount (Home)',
    width: 200,
    align: 'right' as const,
    render: (row: any) => formatNum(row.settlement_amount_home)
  }
];

// ==================== Actions ====================
function onBalanceClick() {
  if (editorLocked.value) return;
  form.value.settleAmount = selectedOutstandingTotal.value;
}

function toIsoDateTime(val: string) {
  if (!val) return new Date().toISOString();
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return new Date(`${val}T00:00:00`).toISOString();
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

async function handleSave() {
  if (editorLocked.value || saving.value) return;
  if (selectedLines.value.length === 0) {
    window.$message?.warning('Please select at least one line.');
    return;
  }
  const companyName = String(form.value.settleCompany?.company_name ?? '').trim();
  if (!companyName) {
    window.$message?.warning('Please select a settlement company.');
    return;
  }
  const settleAmount = Number(form.value.settleAmount) || 0;
  if (settleAmount <= 0) {
    window.$message?.warning('Amount must be greater than 0.');
    return;
  }

  const sorted = [...selectedLines.value].sort(
    (a: any, b: any) => (Number(a.outstanding) || 0) - (Number(b.outstanding) || 0)
  );
  let remaining = settleAmount;
  const writeOffMap = new Map<number, number>();
  for (const item of sorted) {
    const os = Math.max(Number((item as any).outstanding) || 0, 0);
    const writeOff = Math.min(remaining, os);
    writeOffMap.set(allLines.value.indexOf(item), writeOff);
    remaining -= writeOff;
    if (remaining <= 0) remaining = 0;
  }

  const lines = selectedLines.value.map((row: any) => {
    const idx = allLines.value.indexOf(row);
    const os = Math.max(Number(row.outstanding) || 0, 0);
    const exRate = Number(row.ex_rate) || 1;
    const writeOffOriginal = writeOffMap.get(idx) ?? 0;
    return {
      tthPk: String(row.tth_pk ?? row.pk ?? row.id ?? ''),
      ledger: String(row.ledger ?? ''),
      jobNo: String(row.job_no ?? ''),
      invoiceNumber: String(row.invoice_number ?? ''),
      writeOffAmountOriginal: writeOffOriginal,
      writeOffAmountHome: writeOffOriginal * exRate,
      currentOutstandingOriginal: Math.max(os - writeOffOriginal, 0),
      currentOutstandingHome: Math.max(os - writeOffOriginal, 0) * exRate
    };
  });

  saving.value = true;
  try {
    const res: any = await matchTransactionsSaveMatchWriteOff({
      matchNumber: form.value.matchNumber,
      mode: lineLedgerScope.value === 'AR' ? 'receipt' : 'payment',
      billingParty: companyName,
      billingPartyName: form.value.settleCompanyName,
      description: form.value.description,
      bankAccountId: String(form.value.bankAccount?.id ?? form.value.bankAccount?.pk ?? ''),
      bankAccountName: form.value.bankAccountName,
      settleDate: toIsoDateTime(form.value.settleDate),
      refNo: form.value.refNo,
      chequeNo: form.value.chequeNo,
      settleAmount,
      exRateMode: form.value.exRateMode,
      lines
    });
    if (res && res.success === false) {
      window.$message?.error(res.msg || 'Save failed.');
      return;
    }
    editorLocked.value = true;
    window.$message?.success('Saved successfully.');
  } catch (error) {
    console.error(error);
    window.$message?.error('Failed to save.');
  } finally {
    saving.value = false;
  }
}

function handleBack() {
  router.push({ name: 'settlement_writeoff' });
}

// ==================== Load existing data ====================
onMounted(async () => {
  if (!pk) {
    loading.value = false;
    return;
  }

  await Promise.all([loadBankAccounts(), loadCurrencies()]);

  try {
    const res: any = await matchTransactionsQueryLines({ apPk: pk });
    const items = Array.isArray(res?.data?.items) ? res.data.items : [];
    allLines.value = items.map((item: any, idx: number) => mapLine(item, idx)).filter(Boolean);
    checkedLineKeys.value = allLines.value.map((r: any) => r.id);

    // Pre-fill form from first line item
    if (items.length > 0) {
      const first = items[0];
      form.value.matchNumber = String(first.matchNumber ?? first.match_number ?? '');
      form.value.settleCompanyName = String(first.tth_billing_party ?? first.billingParty ?? '');
      form.value.description = String(first.tth_desc ?? '');
      form.value.bankAccountName = String(first.tth_bank ?? '');
      form.value.refNo = String(first.tth_reference ?? '');
      form.value.chequeNo = String(first.tth_invoice_payment_reference_code ?? '');
      const dateRaw = first.tth_post_date ?? first.tth_invoice_date ?? '';
      if (dateRaw) {
        const d = new Date(dateRaw);
        form.value.settleDate = Number.isNaN(d.getTime()) ? '' : formatDate(d);
      }
      form.value.settleAmount = items.reduce(
        (s: number, x: any) => s + (Number(x.tth_ts_total ?? x.settlementAmountOriginal ?? 0) || 0),
        0
      );
    }
  } catch (error) {
    console.error(error);
    window.$message?.error('Failed to load match data.');
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="h-full overflow-auto p-16px">
    <NCard :title="`Edit - ${form.matchNumber || pk}`" :bordered="false">
      <template #header-extra>
        <NSpace>
          <NButton type="primary" :loading="saving" :disabled="editorLocked" @click="handleSave">
            {{ t('common.save') }}
          </NButton>
          <NButton @click="handleBack">{{ t('common.cancel') }}</NButton>
        </NSpace>
      </template>

      <NSkeleton v-if="loading" text :row="10" />
      <template v-else>
        <!-- Same form layout as create page -->
        <NGrid :cols="24" :x-gap="12" :y-gap="12" class="mb-12px">
          <NGi :span="6">
            <NSpace vertical>
              <div class="flex items-center gap-8px">
                <span class="shrink-0 w-80px text-right text-12px">{{ te('settleCompany') }}:</span>
                <NSelect
                  :value="form.settleCompany?.pk ?? form.settleCompany?.id ?? ''"
                  :options="companyOptions"
                  :loading="companyLoading"
                  filterable
                  remote
                  clearable
                  :placeholder="te('pleaseSelect')"
                  :disabled="editorLocked"
                  class="flex-1"
                  @search="handleSearchCompany"
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
                      :value="form.bankAccount?.id ?? form.bankAccount?.pk ?? ''"
                      :options="bankOptions"
                      :loading="bankLoading"
                      filterable
                      clearable
                      :placeholder="te('pleaseSelect')"
                      :disabled="editorLocked"
                      class="flex-1"
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
                  <NInput :value="formatNum(form.balance)" readonly @click="onBalanceClick">
                    <template #prefix>{{ te('balance') }}:</template>
                  </NInput>
                </NGi>
              </NGrid>
            </NCard>
          </NGi>
          <NGi :span="6">
            <NCard size="small" :bordered="true">
              <NRadioGroup v-model:value="form.exRateMode" :disabled="editorLocked" size="small">
                <NRadio value="system" size="small">
                  {{ te('systemExRate') }}
                </NRadio>
              </NRadioGroup>
              <div class="mt-8px">
                <table class="w-full text-12px">
                  <thead>
                    <tr>
                      <th class="text-right pa-4px">{{ te('osAmount') }}</th>
                      <th class="text-right pa-4px">
                        {{ te('settledAmount') }}
                      </th>
                      <th class="text-right pa-4px">{{ te('exRate') }}</th>
                      <th class="text-right pa-4px">{{ te('homeAmount') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="r in summaryRows" :key="r.key">
                      <td class="text-right pa-4px">
                        {{ formatNum(r.osAmount) }}
                      </td>
                      <td class="text-right pa-4px">
                        {{ formatNum(r.settledAmount) }}
                      </td>
                      <td class="text-right pa-4px">{{ r.currency }} {{ formatNum(r.exRate, 6) }}</td>
                      <td class="text-right pa-4px">
                        {{ formatNum(r.homeAmount) }}
                      </td>
                    </tr>
                    <tr class="font-bold">
                      <td class="text-right pa-4px" colspan="3">
                        {{ te('total') }}
                      </td>
                      <td class="text-right pa-4px">
                        {{ formatNum(summaryTotalHomeAmount) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </NCard>
          </NGi>
        </NGrid>

        <NDivider style="margin: 8px 0" />

        <NSpace align="center" class="mb-8px py-8px" :wrap="true">
          <NRadioGroup v-model:value="lineLedgerScope" :disabled="editorLocked" size="small">
            <NRadio value="AR" size="small">AR</NRadio>
            <NRadio value="AP" size="small">AP</NRadio>
          </NRadioGroup>
          <NInput
            v-model:value="lineSearch"
            :disabled="editorLocked"
            clearable
            :placeholder="te('pleaseInput')"
            style="width: 200px"
          />
          <NInput
            v-model:value="statementVal"
            :disabled="editorLocked"
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
            :disabled="editorLocked"
            :placeholder="te('currency')"
            style="width: 140px"
          />
          <NButton type="primary" :disabled="editorLocked" size="small" @click="onSearchLines">
            {{ t('common.search') }}
          </NButton>
        </NSpace>

        <NDivider style="margin: 8px 0" />

        <NDataTable
          v-model:checked-row-keys="checkedLineKeys"
          :columns="lineColumns as any"
          :data="allLines as any"
          :bordered="false"
          striped
          :pagination="false"
          size="small"
          :scroll-x="1700"
          :row-key="(row: any) => row.id"
          :disabled="editorLocked"
        />
      </template>
    </NCard>
  </div>
</template>

<style scoped>
table {
  border-collapse: collapse;
}
</style>
