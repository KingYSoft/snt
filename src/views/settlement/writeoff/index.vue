<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { DataTableRowKey } from 'naive-ui';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useNaivePaginatedTable } from '@/hooks/common/table';
import { sjcTransform } from '@/utils/maintain/transform';
import {
  matchTransactionsQueryPage,
  normalizeMatchTransactionRecord,
  type MatchTransactionRecord,
  type MatchTransactionQueryParams
} from '@/service/api/business/match-transactions';
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
  match_number: string;
  billing_party: string;
}

function createDefaultFilters(): FilterState {
  return {
    field1: { key: 'etd', start: defaultStart, end: defaultEnd },
    field2: { key: 'job_number', value: '' },
    match_number: '',
    billing_party: ''
  };
}

const filters = reactive<FilterState>(createDefaultFilters());
const showMoreFilters = ref(true);
const checkedRowKeys = ref<DataTableRowKey[]>([]);
const selectedRowsByPk = ref(new Map<string, MatchTransactionRecord>());

const field1KeyOptions = computed(() => [
  { label: 'ETD', value: 'etd' },
  { label: 'Payment Date', value: 'payment_date' }
]);
const field2KeyOptions = computed(() => [
  { label: 'Job Number', value: 'job_number' },
  { label: 'Shipper', value: 'shipper' },
  { label: 'Match Number', value: 'match_number' },
  { label: 'Description', value: 'description' }
]);

const pageRef = ref(1);
const pageSizeRef = ref(50);

function buildQueryParams(override?: { SkipCount?: number; MaxResultCount?: number }): MatchTransactionQueryParams {
  const f = filters;
  const JobNumber = f.field2.key === 'job_number' ? f.field2.value.trim() : '';
  const fromField2Shipper = f.field2.key === 'shipper' ? f.field2.value.trim() : '';
  const fromField2Match = f.field2.key === 'match_number' ? f.field2.value.trim() : '';
  const Shipper = f.billing_party.trim() || fromField2Shipper;
  const MatchNumber = f.match_number.trim() || fromField2Match;
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
          query: { pk: row.pk }
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

function handleRowAction(key: MatchTransactionActionKey, row: MatchTransactionRecord) {
  if (key === 'export') {
    const csv = buildCsv([row]);
    downloadCsv(csv, `writeoff_${row.matchNumber || 'row'}.csv`);
    window.$message?.success(`Exported ${row.matchNumber}`);
    return;
  }
  if (key === 'print') {
    window.$message?.info(`Print ${row.matchNumber} (mock)`);
    return;
  }
  router.push({ name: 'settlement_writeoff-edit', query: { pk: row.pk } });
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
        query: { pk: row.pk }
      });
    }
  };
}

function csvCell(v: unknown) {
  if (v == null) return '';
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function buildCsv(items: MatchTransactionRecord[]) {
  const h = '#,Ledger,Transaction No.,Company,Currency,Amount,Payment Date,Description';
  return (
    h +
    '\n' +
    items
      .map((r, i) =>
        [
          csvCell(i + 1),
          csvCell(r.ledger),
          csvCell(r.matchNumber),
          csvCell(r.billingPartyName?.trim() || r.billingParty),
          csvCell(r.currency),
          csvCell(r.settledAmount),
          csvCell(r.paymentDate ? String(r.paymentDate).split('T')[0] : ''),
          csvCell(r.description)
        ].join(',')
      )
      .join('\n')
  );
}
function downloadCsv(csv: string, name: string) {
  const b = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const u = URL.createObjectURL(b);
  const a = Object.assign(document.createElement('a'), { href: u });
  a.setAttribute('download', name);
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(u);
}

function handleExportSelected() {
  if (checkedRowKeys.value.length === 0) {
    window.$message?.warning(t('page.settlement.transactions.exportSelectFirst'));
    return;
  }
  const items = checkedRowKeys.value
    .map(k => selectedRowsByPk.value.get(String(k)))
    .filter((r): r is MatchTransactionRecord => r != null);
  if (items.length === 0) {
    window.$message?.warning(t('page.settlement.transactions.exportSelectFirst'));
    return;
  }
  if (items.length < checkedRowKeys.value.length) {
    window.$message?.warning(
      t('page.settlement.transactions.exportPartialSkipped', {
        exported: items.length,
        selected: checkedRowKeys.value.length
      })
    );
  }
  downloadCsv(buildCsv(items), 'matching_transactions.csv');
  window.$message?.success(t('page.settlement.matchTransactions.exportSuccess'));
}

function resetFiltersAndSearch() {
  Object.assign(filters, createDefaultFilters());
  checkedRowKeys.value = [];
  selectedRowsByPk.value = new Map();
  getDataByPage(1);
}

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
              placeholder="Job No. / Shipper / Match No."
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
              {{ showMoreFilters ? 'Hide' : 'More' }}
            </NButton>
          </NSpace>
        </NGi>
        <NGi v-if="showMoreFilters" :span="4">
          <NInput v-model:value="filters.match_number" placeholder="Match Number" clearable />
        </NGi>
        <NGi v-if="showMoreFilters" :span="4">
          <NInput v-model:value="filters.billing_party" placeholder="Billing Party" clearable />
        </NGi>
      </NGrid>
    </NCard>
    <NCard :bordered="false" class="flex-1-hidden overflow-auto">
      <NSpace vertical :size="12">
        <NSpace>
          <NButton type="primary" @click="$router.push({ name: 'settlement_writeoff-create' })">New Receipt</NButton>
          <NButton @click="handleExportSelected">Export</NButton>
        </NSpace>
        <NDataTable
          :checked-row-keys="checkedRowKeys"
          :columns="columns as any"
          :data="rows"
          :loading="loading"
          :pagination="pagination"
          :row-key="(r: any) => r.pk"
          :row-props="getRowProps"
          :scroll-x="1200"
          remote
          striped
          @update:checked-row-keys="handleCheckedRowKeysUpdate"
        />
      </NSpace>
    </NCard>
  </div>
</template>
