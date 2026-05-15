<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
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
  matchTransactionsGetDetail,
  matchTransactionsGetWriteOffBank,
  matchTransactionsQueryOrgAddress,
  matchTransactionsQueryOutstandingInvoices,
  normalizeWriteoffDetailResponse,
  parseOrgAddressQueryResponse,
  orgAddressRowLabel,
  orgAddressRowSelectValue,
  orgAddressOutstandingBillingParty,
  mapOutstandingInvoiceToTableRow,
  type OrgAddressRow,
  type OutstandingInvoicesParams,
  type WriteOffBankRow
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

const editorLocked = ref(true);
const loading = ref(true);

// ==================== Form ====================
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
const _showMoreFilters = ref(false);
const moreChargeDesc = ref('');

const allLines = ref<any[]>([]);
const checkedLineKeys = ref<Array<string | number>>([]);

// ==================== Company Selector ====================
const companyOptions = ref<Array<{ label: string; value: string; data: OrgAddressRow }>>([]);
const companyLoading = ref(false);

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
  } catch (error) {
    console.error(error);
  } finally {
    companyLoading.value = false;
  }
}

function onCompanyMenuShow(show: boolean) {
  if (show) void nextTick(() => void handleSearchCompany(''));
}

async function handleSelectCompany(value: string | null) {
  if (editorLocked.value) return;
  if (value == null || value === '') {
    form.value.settleCompany = null;
    form.value.settleCompanyName = '';
    allLines.value = [];
    checkedLineKeys.value = [];
    return;
  }
  const selected = getCompanyOptionByValue(value);
  if (selected?.data) {
    form.value.settleCompany = selected.data;
    form.value.settleCompanyName = selected.data.oH_FullName;
    const billingPartyAh = orgAddressOutstandingBillingParty(selected.data);
    if (billingPartyAh) {
      try {
        await queryOutstandingInvoiceLines(billingPartyAh);
      } catch (error) {
        console.error(error);
        allLines.value = [];
        checkedLineKeys.value = [];
      }
    }
  }
}

// ==================== Bank Selector ====================
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
    bankOptions.value = list.map((item, index) => {
      const code = String(item.ab_code ?? '').trim() || `row-${index}`;
      return {
        label: String(item.ab_bankname ?? code),
        value: code,
        data: item
      };
    });
  } catch (error) {
    console.error(error);
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
  const selected = getBankOptionByValue(value);
  if (selected?.data) {
    form.value.bankAccount = selected.data;
    form.value.bankAccountName = selected.data.ab_bankname ?? '';
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
async function queryOutstandingInvoiceLines(billingPartyAhOh: string) {
  const billingParty = String(billingPartyAhOh).trim();
  if (!billingParty) {
    allLines.value = [];
    checkedLineKeys.value = [];
    return;
  }
  const payload: OutstandingInvoicesParams = {
    billingParty,
    ledgerScope: lineLedgerScope.value || 'AR',
    pageIndex: 0,
    pageSize: 50000
  };
  if (lineSearch.value?.trim()) payload.query = lineSearch.value.trim();
  if (statementVal.value?.trim()) payload.statementNo = statementVal.value.trim();
  if (lineCurrency.value) payload.currency = lineCurrency.value;
  if (moreChargeDesc.value?.trim()) payload.chargeDesc = moreChargeDesc.value.trim();
  const res: any = await matchTransactionsQueryOutstandingInvoices(payload);
  if (res && res.success === false) {
    allLines.value = [];
    checkedLineKeys.value = [];
    return;
  }
  const sourceItems = Array.isArray(res?.data?.items) ? res.data.items : [];
  allLines.value = sourceItems
    .map((item: Record<string, any>, idx: number) => mapOutstandingInvoiceToTableRow(item, idx))
    .filter(Boolean) as any[];
  checkedLineKeys.value = [];
}

async function onSearchLines() {
  if (editorLocked.value) return;
  const billingPartyAh = orgAddressOutstandingBillingParty(form.value.settleCompany);
  if (!billingPartyAh) {
    window.$message?.warning('Please select settlement company first.');
    return;
  }
  try {
    await queryOutstandingInvoiceLines(billingPartyAh);
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
  return;
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

  try {
    const { data: rawDetail, error } = await matchTransactionsGetDetail({ Pk: pk });
    if (error) {
      window.$message?.error('Failed to load match data.');
      return;
    }
    const { matchLink, header, transactionLines, bank } = normalizeWriteoffDetailResponse(
      rawDetail as Record<string, any>
    );
    const h = header;

    form.value.matchNumber = String(matchLink.ap_matchgroupnum ?? h.ah_transactionnum ?? '');

    const ahOh = String(h.ah_oh ?? h.aH_OH ?? '').trim();
    const nameFromHeader = String(h.oh_fullname ?? h.oH_FullName ?? h.companyName ?? h.billingPartyName ?? '').trim();
    const nameFallback = String(h.ah_desc ?? h.ah_jobnumber ?? h.ah_consolidatedinvoiceref ?? '').trim();
    const legacyBp = String(h.billingParty ?? '').trim();
    const ohCode = String(
      h.oH_Code ?? h.oh_code ?? legacyBp ?? h.ah_originaltransactionnum ?? h.ah_jobnumber ?? ahOh
    ).trim();

    form.value.settleCompanyName = nameFromHeader || nameFallback || ohCode;
    if (ahOh || ohCode || form.value.settleCompanyName) {
      form.value.settleCompany = {
        aH_OH: ahOh || ohCode,
        oH_FullName: form.value.settleCompanyName || ohCode,
        oH_Code: ohCode || ahOh
      };
    } else {
      form.value.settleCompany = null;
    }

    form.value.description = String(h.ah_desc ?? '');
    form.value.settleAmount = Number(h.ah_invoiceamount ?? h.ah_ostotal ?? 0);
    lineLedgerScope.value = String(h.ah_ledger ?? 'AR').toUpperCase();

    form.value.refNo = String(h.ah_chequeorreference ?? h.ah_transactionreference ?? h.refNo ?? '');
    form.value.chequeNo = String(h.ah_chequedrawer ?? h.chequeNo ?? '');

    const dateRaw = matchLink.ap_matchdate ?? h.ah_fullypaiddate ?? h.ah_invoicedate ?? '';
    if (dateRaw) {
      const d = new Date(dateRaw);
      form.value.settleDate = Number.isNaN(d.getTime()) ? formatDate(new Date()) : formatDate(d);
    }

    if (bank) {
      const code = String(bank.ab_code ?? bank.ab_Code ?? '').trim();
      const bname = String(bank.ab_bankname ?? bank.ab_BankName ?? '').trim();
      if (code) {
        const row: WriteOffBankRow = { ab_code: code, ab_bankname: bname };
        form.value.bankAccount = row;
        form.value.bankAccountName = bname;
        bankOptions.value = [{ label: bname || code, value: code, data: row }];
      }
    } else {
      form.value.bankAccount = null;
      form.value.bankAccountName = '';
    }

    allLines.value = transactionLines
      .map((item: Record<string, any>, idx: number) => mapOutstandingInvoiceToTableRow(item, idx))
      .filter(Boolean) as any[];
    checkedLineKeys.value = allLines.value.map((r: any) => r.id);
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
    <NCard
      :title="`${t('page.settlement.matchTransactions.detailTitle')} - ${form.matchNumber || pk}`"
      :bordered="false"
    >
      <template #header-extra>
        <NSpace>
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
