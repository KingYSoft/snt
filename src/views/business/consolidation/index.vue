<script setup lang="ts">
import { computed, onActivated, onMounted, ref, watch } from 'vue';
import type { DataTableRowKey } from 'naive-ui';
import { useRoute, useRouter } from 'vue-router';
import { $t } from '@/locales';
import { useTabStore } from '@/store/modules/tab';
import { useNaivePaginatedTable } from '@/hooks/common/table';
import { sjcTransform, buildSjcPaginationParams } from '@/utils/maintain/transform';
import {
  consolidationExport,
  consolidationQueryPage,
  type ConsolidationFilter
} from '@/service/api/business/consolidation';
import { downloadBlob } from '@/utils/download';
import { getExportColumns } from '@/utils/export-columns';
import { getConsolidationColumns, type ConsolidationActionKey } from './modules/columns';

type ConsolidationRow = Record<string, any>;

defineOptions({
  name: 'BusinessConsolidation'
});

const route = useRoute();
const router = useRouter();
const tabStore = useTabStore();

function restoreListTabLabel() {
  tabStore.resetTabLabel(tabStore.getTabIdByRoute(route));
}

onMounted(restoreListTabLabel);
onActivated(restoreListTabLabel);

const checkedRowKeys = ref<DataTableRowKey[]>([]);
const selectedRowsByPk = ref(new Map<string, ConsolidationRow>());
const exportLoading = ref(false);

// --- ETD date range（与应收应付一致：起止两个日期；默认当年 3.1–3.31） ---
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function defaultEtdDates() {
  const year = new Date().getFullYear();
  return {
    start: formatDate(new Date(year, 2, 1)),
    end: formatDate(new Date(year, 2, 31))
  };
}

const etdStart = ref<string | null>(defaultEtdDates().start);
const etdEnd = ref<string | null>(defaultEtdDates().end);

// --- Search state ---
const searchKey = ref('jk_masterbillnum');
const searchOp = ref('Contain');
const searchVal = ref('');

const searchKeyOptions = [
  {
    label: $t('page.business.consolidation.search.masterBillNo'),
    value: 'jk_masterbillnum'
  },
  {
    label: $t('page.business.consolidation.search.consolidationNo'),
    value: 'jk_uniqueconsignref'
  },
  {
    label: $t('page.business.consolidation.search.company'),
    value: 'jh_gc'
  },
  {
    label: $t('page.business.consolidation.search.sales'),
    value: 'jh_gs_nkrepsales'
  },
  {
    label: $t('page.business.consolidation.search.ops'),
    value: 'jh_gs_nkrepops'
  },
  {
    label: $t('page.business.consolidation.search.customerService'),
    value: 'customer_service'
  }
];

const operatorOptions = [
  { label: '=', value: '=' },
  { label: $t('page.business.consolidation.search.contain'), value: 'Contain' }
];

// --- Pagination refs synced with useNaivePaginatedTable ---
const pageRef = ref(1);
const pageSizeRef = ref(20);

function buildFilters() {
  const filters: ConsolidationFilter[] = [];
  const start = String(etdStart.value ?? '').trim();
  const end = String(etdEnd.value ?? '').trim();
  if (start && end) {
    filters.push({ key: 'js_e_dep', op: 'between', val: '', start, end });
  }

  if (searchVal.value) {
    filters.push({ key: searchKey.value, op: searchOp.value, val: searchVal.value });
  }

  return filters;
}

// --- Table hook ---
const {
  data: tableRows,
  loading,
  columns,
  pagination,
  getDataByPage
} = useNaivePaginatedTable<any, any>({
  api: async () => {
    const { skipCount, maxResultCount } = buildSjcPaginationParams(pageRef.value, pageSizeRef.value);
    return consolidationQueryPage({
      SkipCount: skipCount,
      MaxResultCount: maxResultCount,
      filters: buildFilters()
    });
  },
  columns: () => getConsolidationColumns<any>(handleMenuAction, navigateToDetail),
  transform: response =>
    sjcTransform(response, {
      page: pageRef.value,
      pageSize: pageSizeRef.value
    }),
  paginationProps: {
    pageSize: 20,
    pageSizes: [10, 20, 50, 100]
  },
  onPaginationParamsChange: params => {
    pageRef.value = params.page ?? 1;
    pageSizeRef.value = params.pageSize ?? 20;
  }
});

const scrollX = computed(() => {
  return columns.value.reduce((acc: number, col: any) => acc + Number(col.width ?? col.minWidth ?? 120), 0);
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
      const row = rowsPayload[i] as ConsolidationRow | undefined;
      if (row != null && typeof row === 'object') {
        map.set(String(key), row);
      }
    });
  }
}

watch(tableRows, newRows => {
  const keySet = new Set(checkedRowKeys.value.map(k => String(k)));
  const map = selectedRowsByPk.value;
  for (const row of newRows) {
    const id = String(row.jk_pk);
    if (keySet.has(id)) {
      map.set(id, row);
    }
  }
});

function handleSearch() {
  getDataByPage(1);
}

function handleReset() {
  searchKey.value = 'jk_masterbillnum';
  searchOp.value = 'Contain';
  searchVal.value = '';
  const dates = defaultEtdDates();
  etdStart.value = dates.start;
  etdEnd.value = dates.end;
  checkedRowKeys.value = [];
  selectedRowsByPk.value = new Map();
  getDataByPage(1);
}

function navigateToDetail(row: any) {
  router.push({
    name: 'business_consolidation-edite',
    params: { pk: row.jk_pk },
    query: {
      id: row.id,
      con_unique_consign_ref: row.jk_uniqueconsignref
    }
  });
}

async function handleMenuAction(key: ConsolidationActionKey, row: ConsolidationRow) {
  if (key !== 'export') return;
  if (exportLoading.value) return;

  exportLoading.value = true;
  try {
    const blob = await consolidationExport({
      SkipCount: 0,
      MaxResultCount: 1,
      filters: [{ key: 'jk_uniqueconsignref', op: '=', val: row.jk_uniqueconsignref || '' }],
      columns: getExportColumns(columns.value),
      exportTitle: $t('route.business_consolidation'),
      companyNameLabel: $t('common.exportMeta.companyName'),
      reportPeriodLabel: $t('common.exportMeta.reportGeneratedPeriod')
    });
    downloadBlob(blob, `Consol_${row.jk_uniqueconsignref || row.jk_pk}.xlsx`);
    window.$message?.success($t('page.settlement.transactions.exportSuccess'));
  } catch {
    window.$message?.error($t('page.settlement.transactions.exportFailed'));
  } finally {
    exportLoading.value = false;
  }
}

async function handleBatchExport() {
  if (exportLoading.value) return;

  exportLoading.value = true;
  try {
    const blob = await consolidationExport({
      SkipCount: 0,
      MaxResultCount: 0,
      filters: buildFilters(),
      selectedPks: [...selectedRowsByPk.value.keys()],
      columns: getExportColumns(columns.value),
      exportTitle: $t('route.business_consolidation'),
      companyNameLabel: $t('common.exportMeta.companyName'),
      reportPeriodLabel: $t('common.exportMeta.reportGeneratedPeriod')
    });
    downloadBlob(blob, 'Consols.xlsx');
    window.$message?.success($t('page.settlement.transactions.exportSuccess'));
  } catch {
    window.$message?.error($t('page.settlement.transactions.exportFailed'));
  } finally {
    exportLoading.value = false;
  }
}
</script>

<template>
  <div class="h-full flex-col-stretch gap-16px overflow-hidden">
    <NCard :bordered="false" class="flex-shrink-0">
      <NSpace align="center" :wrap="false">
        <div class="flex items-center gap-8px">
          <span class="shrink-0 text-14px">{{ $t('page.business.shipment.table.etd') }}</span>
          <NDatePicker
            v-model:formatted-value="etdStart"
            type="date"
            value-format="yyyy-MM-dd"
            clearable
            style="width: 140px"
          />
          <span class="text-14px text-#999">-</span>
          <NDatePicker
            v-model:formatted-value="etdEnd"
            type="date"
            value-format="yyyy-MM-dd"
            clearable
            style="width: 140px"
          />
        </div>
        <NSelect v-model:value="searchKey" :options="searchKeyOptions" style="width: 180px" />
        <NSelect v-model:value="searchOp" :options="operatorOptions" style="width: 100px" />
        <NInput
          v-model:value="searchVal"
          :placeholder="$t('page.business.consolidation.search.placeholder')"
          clearable
          style="width: 260px"
          @keyup.enter="handleSearch"
        />
        <NButton type="primary" :loading="loading" @click="handleSearch">
          {{ $t('common.search') }}
        </NButton>
        <NButton @click="handleReset">{{ $t('common.reset') }}</NButton>
      </NSpace>
    </NCard>

    <NCard :bordered="false" class="h-full flex-1-hidden" content-class="h-full flex flex-col overflow-hidden">
      <NSpace class="mb-12px flex-shrink-0">
        <NButton :loading="exportLoading" @click="handleBatchExport">
          {{ $t('page.business.shipment.export') }}
        </NButton>
      </NSpace>
      <div class="min-h-0 flex-1 overflow-hidden">
        <NDataTable
          class="h-full"
          flex-height
          :checked-row-keys="checkedRowKeys"
          :columns="columns as any"
          :data="tableRows"
          :loading="loading || exportLoading"
          :pagination="pagination"
          :row-key="(row: any) => row.jk_pk"
          :scroll-x="scrollX"
          remote
          striped
          @update:checked-row-keys="handleCheckedRowKeysUpdate"
        />
      </div>
    </NCard>
  </div>
</template>
