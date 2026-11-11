<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue';
import type { DataTableRowKey, SelectOption } from 'naive-ui';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useNaivePaginatedTable } from '@/hooks/common/table';
import { sjcTransform } from '@/utils/maintain/transform';
import {
  mapWriteOffBankRow,
  matchTransactionsCurrencyOptions,
  matchTransactionsExport,
  matchTransactionsGetWriteOffBank,
  matchTransactionsQueryOrgAddress,
  matchTransactionsQueryPage,
  normalizeMatchTransactionRecord,
  orgAddressRowLabel,
  orgAddressRowSelectValue,
  parseMatchTransactionsCurrencyOptions,
  parseOrgAddressQueryResponse,
  type MatchTransactionRecord,
  type MatchTransactionQueryParams,
  type OrgAddressRow,
  type WriteOffBankRow
} from '@/service/api/business/match-transactions';
import { downloadBlob } from '@/utils/download';
import { getExportColumns } from '@/utils/export-columns';
import { getMatchTransactionColumns, type MatchTransactionActionKey } from '../modules/match-transaction-columns';

defineOptions({ name: 'PageSettlementWriteoff' });

const router = useRouter();
const { t } = useI18n();

const formatDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const today = new Date();
const defaultStart = formatDate(new Date('2026-01-01'));
const defaultEnd = formatDate(today);

interface FilterState {
  field1: { key: string; start: string; end: string };
  field2: { key: string; value: string };
  settleCompany: string;
  currency: string | null;
  writeOffBank: string | null;
  writeOffUser: string;
}

function createDefaultFilters(): FilterState {
  return {
    field1: { key: 'etd', start: defaultStart, end: defaultEnd },
    field2: { key: 'job_number', value: '' },
    settleCompany: '',
    currency: null,
    writeOffBank: null,
    writeOffUser: ''
  };
}

const filters = reactive<FilterState>(createDefaultFilters());
const showMoreFilters = ref(true);
const checkedRowKeys = ref<DataTableRowKey[]>([]);
const selectedRowsByPk = ref(new Map<string, MatchTransactionRecord>());
const exportLoading = ref(false);

const field1KeyOptions = computed(() => [
  { label: t('page.settlement.matchTransactions.etd'), value: 'etd' },
  { label: t('page.settlement.matchTransactions.paymentDate'), value: 'payment_date' }
]);
const field2KeyOptions = computed(() => [
  { label: t('page.settlement.matchTransactions.jobNumber'), value: 'job_number' },
  { label: t('page.business.shipment.table.shipperName'), value: 'shipper' },
  { label: t('page.settlement.matchTransactions.billingParty'), value: 'billing_party' },
  { label: t('page.settlement.matchTransactions.editor.matchNumber'), value: 'match_number' },
  { label: t('page.settlement.matchTransactions.description'), value: 'description' }
]);

const settleCompanyName = ref('');
const companyOptions = ref<Array<{ label: string; value: string; data: OrgAddressRow }>>([]);
const companyLoading = ref(false);
const currencyOptions = ref<SelectOption[]>([]);
const currencyLoading = ref(false);
const bankOptions = ref<Array<{ label: string; value: string; data: WriteOffBankRow }>>([]);
const bankLoading = ref(false);

async function handleSearchCompany(query: string) {
  companyLoading.value = true;
  try {
    const res: any = await matchTransactionsQueryOrgAddress({ Query: query ?? '' });
    companyOptions.value = parseOrgAddressQueryResponse(res)
      .map(item => ({
        label: orgAddressRowLabel(item),
        value: orgAddressRowSelectValue(item),
        data: item
      }))
      .filter(option => option.value);
  } catch {
    companyOptions.value = [];
  } finally {
    companyLoading.value = false;
  }
}

function onCompanyMenuShow(show: boolean) {
  if (show) void nextTick(() => void handleSearchCompany(''));
}

function handleSelectCompany(value: string | null) {
  filters.settleCompany = value ?? '';
  settleCompanyName.value = '';
  filters.writeOffBank = null;
  if (value) {
    const selected = companyOptions.value.find(item => item.value === value);
    settleCompanyName.value = selected?.data?.oH_FullName?.trim() || selected?.label || '';
  }
  void loadWriteOffBanks();
}

async function loadCurrencyOptions() {
  currencyLoading.value = true;
  try {
    currencyOptions.value = parseMatchTransactionsCurrencyOptions(await matchTransactionsCurrencyOptions());
  } catch {
    currencyOptions.value = [];
  } finally {
    currencyLoading.value = false;
  }
}

async function loadWriteOffBanks() {
  bankLoading.value = true;
  try {
    const res: any = await matchTransactionsGetWriteOffBank({ settleCompanyName: settleCompanyName.value.trim() });
    const list: WriteOffBankRow[] = Array.isArray(res?.data) ? res.data : [];
    bankOptions.value = list
      .map(mapWriteOffBankRow)
      .filter((row): row is WriteOffBankRow => Boolean(row))
      .map(row => ({
        label: [row.ab_code, row.ab_bankname].filter(Boolean).join(' ') || row.ab_pk,
        value: row.ab_bankname || row.ab_code || row.ab_pk,
        data: row
      }));
  } catch {
    bankOptions.value = [];
  } finally {
    bankLoading.value = false;
  }
}

function onBankMenuShow(show: boolean) {
  if (show) void loadWriteOffBanks();
}

const pageRef = ref(1);
const pageSizeRef = ref(50);

function buildQueryParams(override?: { SkipCount?: number; MaxResultCount?: number }): MatchTransactionQueryParams {
  const f = filters;
  const JobNumber = f.field2.key === 'job_number' ? f.field2.value.trim() : '';
  const fromField2Shipper = f.field2.key === 'shipper' || f.field2.key === 'billing_party' ? f.field2.value.trim() : '';
  const fromField2Match = f.field2.key === 'match_number' ? f.field2.value.trim() : '';
  const fromField2Description = f.field2.key === 'description' ? f.field2.value.trim() : '';
  const Shipper = fromField2Shipper;
  const MatchNumber = fromField2Match;
  const Description = fromField2Description;
  const SettleCompany = f.settleCompany ? settleCompanyName.value.trim() || f.settleCompany.trim() : '';
  const Currency = (f.currency ?? '').trim();
  const WriteOffBank = (f.writeOffBank ?? '').trim();
  const WriteOffUser = f.writeOffUser.trim();
  const pg = override ?? {
    SkipCount: (pageRef.value - 1) * pageSizeRef.value,
    MaxResultCount: pageSizeRef.value
  };
  const q: MatchTransactionQueryParams = {
    SkipCount: Number(pg.SkipCount) || 0,
    MaxResultCount: Number(pg.MaxResultCount) || 0
  };
  if (Shipper) q.Shipper = Shipper;
  if (JobNumber) q.JobNumber = JobNumber;
  if (MatchNumber) q.MatchNumber = MatchNumber;
  if (Description) q.Description = Description;
  if (SettleCompany) q.SettleCompany = SettleCompany;
  if (Currency) q.Currency = Currency;
  if (WriteOffBank) q.WriteOffBank = WriteOffBank;
  if (WriteOffUser) q.WriteOffUser = WriteOffUser;
  if (f.field1.key === 'etd') {
    if (f.field1.start) q.EtdStart = f.field1.start;
    if (f.field1.end) q.EtdEnd = f.field1.end;
  }
  if (f.field1.key === 'payment_date') {
    if (f.field1.start) q.PaymentDateStart = f.field1.start;
    if (f.field1.end) q.PaymentDateEnd = f.field1.end;
  }
  return q;
}

const {
  data: rows,
  loading,
  columns,
  pagination,
  getData,
  getDataByPage
} = useNaivePaginatedTable<any, MatchTransactionRecord>({
  api: async () => matchTransactionsQueryPage(buildQueryParams()),
  columns: () =>
    getMatchTransactionColumns(
      row =>
        router.push({
          name: 'settlement_writeoff-edit',
          query: { pk: row.pk, no: row.matchNumber || '', jobNumber: row.jobNumber || '' }
        }),
      (key, row) => handleRowAction(key, row)
    ) as any,
  transform: response => {
    const paginated = sjcTransform(response, {
      page: pageRef.value,
      pageSize: pageSizeRef.value
    });
    return {
      ...paginated,
      data: paginated.data.map((item: any, i: number) => normalizeMatchTransactionRecord(item, i + 1))
    };
  },
  paginationProps: { pageSize: 50, pageSizes: [10, 20, 50, 100, 200] },
  onPaginationParamsChange: params => {
    pageRef.value = params.page ?? 1;
    pageSizeRef.value = params.pageSize ?? 50;
  }
});

function handleCheckedRowKeysUpdate(keys: DataTableRowKey[], rowsPayload?: object[]) {
  checkedRowKeys.value = keys;
  const keySet = new Set(keys.map(k => String(k)));
  const map = selectedRowsByPk.value;
  for (const pk of map.keys()) {
    if (!keySet.has(pk)) {
      map.delete(pk);
    }
  }
  if (rowsPayload?.length) {
    keys.forEach((key, i) => {
      const row = rowsPayload[i] as MatchTransactionRecord | undefined;
      if (row != null && typeof row === 'object') {
        map.set(String(key), row);
      }
    });
  }
}

watch(rows, newRows => {
  const keySet = new Set(checkedRowKeys.value.map(k => String(k)));
  const map = selectedRowsByPk.value;
  for (const row of newRows) {
    const id = String(row.pk);
    if (keySet.has(id)) {
      map.set(id, row);
    }
  }
});

async function handleRowAction(key: MatchTransactionActionKey, row: MatchTransactionRecord) {
  if (key === 'export') {
    if (exportLoading.value) return;

    exportLoading.value = true;
    try {
      const blob = await matchTransactionsExport({
        ...buildQueryParams({ SkipCount: 0, MaxResultCount: 0 }),
        MatchNumber: row.matchNumber || '',
        Columns: getExportColumns(columns.value),
        ExportTitle: t('route.settlement_writeoff'),
        CompanyNameLabel: t('common.exportMeta.companyName'),
        ReportPeriodLabel: t('common.exportMeta.reportGeneratedPeriod')
      });
      downloadBlob(blob, `matching_transactions_${row.matchNumber || 'row'}.xlsx`);
      window.$message?.success(t('page.settlement.matchTransactions.exportSuccess'));
    } catch {
      window.$message?.error(t('page.settlement.transactions.exportFailed'));
    } finally {
      exportLoading.value = false;
    }
    return;
  }
  if (key === 'print') {
    window.$message?.info(`Print ${row.matchNumber} (mock)`);
    return;
  }
  router.push({
    name: 'settlement_writeoff-edit',
    query: { pk: row.pk, no: row.matchNumber || '', jobNumber: row.jobNumber || '' }
  });
}

function getRowProps(row: MatchTransactionRecord) {
  return {
    style: 'cursor: pointer;',
    onDblclick: (e: MouseEvent) => {
      if (
        e.target instanceof HTMLElement &&
        e.target.closest('button, a, input, textarea, [role="button"], .n-checkbox, .n-base-selection')
      )
        return;
      router.push({
        name: 'settlement_writeoff-edit',
        query: { pk: row.pk, no: row.matchNumber || '' }
      });
    }
  };
}

async function handleExportSelected() {
  if (exportLoading.value) return;

  exportLoading.value = true;
  try {
    const blob = await matchTransactionsExport({
      ...buildQueryParams({ SkipCount: 0, MaxResultCount: 0 }),
      SelectedPks: [...selectedRowsByPk.value.keys()],
      Columns: getExportColumns(columns.value),
      ExportTitle: t('route.settlement_writeoff'),
      CompanyNameLabel: t('common.exportMeta.companyName'),
      ReportPeriodLabel: t('common.exportMeta.reportGeneratedPeriod')
    });
    downloadBlob(blob, 'matching_transactions.xlsx');
    window.$message?.success(t('page.settlement.matchTransactions.exportSuccess'));
  } catch {
    window.$message?.error(t('page.settlement.transactions.exportFailed'));
  } finally {
    exportLoading.value = false;
  }
}

function resetFiltersAndSearch() {
  Object.assign(filters, createDefaultFilters());
  settleCompanyName.value = '';
  checkedRowKeys.value = [];
  selectedRowsByPk.value = new Map();
  getDataByPage(1);
}

void loadCurrencyOptions();
getData();
</script>

<template>
  <div class="h-full flex-col-stretch gap-16px overflow-hidden">
    <NCard :bordered="false" class="flex-shrink-0">
      <NGrid :cols="24" :x-gap="12" :y-gap="12">
        <NGi :span="8">
          <div class="flex items-center gap-8px">
            <NSelect v-model:value="filters.field1.key" :options="field1KeyOptions" class="w-140px shrink-0" />
            <NDatePicker
              v-model:formatted-value="filters.field1.start"
              type="date"
              value-format="yyyy-MM-dd"
              clearable
              class="min-w-0 flex-1"
            />
            <span class="text-14px text-#999">-</span>
            <NDatePicker
              v-model:formatted-value="filters.field1.end"
              type="date"
              value-format="yyyy-MM-dd"
              clearable
              class="min-w-0 flex-1"
            />
          </div>
        </NGi>
        <NGi :span="10">
          <div class="flex items-center gap-8px">
            <NSelect v-model:value="filters.field2.key" :options="field2KeyOptions" class="w-160px shrink-0" />
            <NInput
              v-model:value="filters.field2.value"
              :placeholder="t('page.settlement.matchTransactions.keywordPlaceholder')"
              clearable
              class="min-w-0 flex-1"
              @keyup.enter="getDataByPage(1)"
            />
          </div>
        </NGi>
        <NGi :span="6">
          <NSpace justify="end" class="w-full">
            <NButton type="primary" :loading="loading" @click="getDataByPage(1)">
              {{ t('common.search') }}
            </NButton>
            <NButton @click="resetFiltersAndSearch">
              {{ t('common.reset') }}
            </NButton>
            <NButton quaternary @click="showMoreFilters = !showMoreFilters">
              {{
                showMoreFilters
                  ? t('page.settlement.matchTransactions.hideMoreFilters')
                  : t('page.settlement.matchTransactions.moreFilters')
              }}
            </NButton>
          </NSpace>
        </NGi>

        <NGi v-if="showMoreFilters" :span="6">
          <NSelect
            :value="filters.settleCompany || null"
            :options="companyOptions"
            :loading="companyLoading"
            filterable
            remote
            clearable
            :placeholder="t('page.settlement.matchTransactions.settleCompany')"
            @search="handleSearchCompany"
            @update:show="onCompanyMenuShow"
            @update:value="handleSelectCompany"
          />
        </NGi>
        <NGi v-if="showMoreFilters" :span="4">
          <NSelect
            v-model:value="filters.currency"
            :options="currencyOptions"
            :loading="currencyLoading"
            filterable
            clearable
            :placeholder="t('page.settlement.matchTransactions.currency')"
          />
        </NGi>
        <NGi v-if="showMoreFilters" :span="6">
          <NSelect
            v-model:value="filters.writeOffBank"
            :options="bankOptions"
            :loading="bankLoading"
            filterable
            clearable
            :placeholder="t('page.settlement.matchTransactions.writeOffBank')"
            @update:show="onBankMenuShow"
          />
        </NGi>
        <NGi v-if="showMoreFilters" :span="4">
          <NInput
            v-model:value="filters.writeOffUser"
            :placeholder="t('page.settlement.matchTransactions.writeOffUser')"
            clearable
          />
        </NGi>
      </NGrid>
    </NCard>
    <NCard :bordered="false" class="h-full flex-1-hidden" content-class="h-full flex flex-col overflow-hidden">
      <NSpace class="mb-12px flex-shrink-0">
        <NButton type="primary" @click="$router.push({ name: 'settlement_writeoff-create' })">
          {{ t('page.settlement.matchTransactions.newReceipt') }}
        </NButton>
        <NButton :loading="exportLoading" @click="handleExportSelected">
          {{ t('page.settlement.matchTransactions.export') }}
        </NButton>
      </NSpace>
      <div class="min-h-0 flex-1 overflow-hidden">
        <NDataTable
          class="h-full"
          flex-height
          :checked-row-keys="checkedRowKeys"
          :columns="columns as any"
          :data="rows"
          :loading="loading || exportLoading"
          :pagination="pagination"
          :row-key="(r: any) => r.pk"
          :row-props="getRowProps"
          :scroll-x="1500"
          remote
          striped
          @update:checked-row-keys="handleCheckedRowKeysUpdate"
        />
      </div>
    </NCard>
  </div>
</template>
