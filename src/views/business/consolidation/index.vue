<script setup lang="ts">
import { ref, watch } from 'vue';
import type { DataTableRowKey } from 'naive-ui';
import { useRouter } from 'vue-router';
import { $t } from '@/locales';
import { useNaivePaginatedTable } from '@/hooks/common/table';
import { sjcTransform, buildSjcPaginationParams } from '@/utils/maintain/transform';
import { consolidationQueryPage, type ConsolidationFilter } from '@/service/api/business/consolidation';
import { getConsolidationColumns, type ConsolidationActionKey } from './modules/columns';

type ConsolidationRow = Record<string, any>;

defineOptions({
  name: 'BusinessConsolidation'
});

const router = useRouter();
const showMore = ref(false);
const checkedRowKeys = ref<DataTableRowKey[]>([]);
const selectedRowsByPk = ref(new Map<string, ConsolidationRow>());

// --- ETD date range（与货运列表一致，默认 2026-01-01～今天） ---
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function defaultEtdRange(): [number, number] {
  const start = new Date('2026-01-01');
  const end = new Date();
  return [start.getTime(), end.getTime()];
}

const etdRange = ref<[number, number]>(defaultEtdRange());

function etdRangeToStr(): { start: string; end: string } {
  return {
    start: formatDate(new Date(etdRange.value[0])),
    end: formatDate(new Date(etdRange.value[1]))
  };
}

// --- Search state ---
const searchKey = ref('jk_masterbillnum');
const searchVal = ref('');
const transportModeOp = ref('=');
const transportMode = ref('');
const consolModeOp = ref('=');
const consolMode = ref('');
const cancelledOp = ref('=');
const cancelled = ref('');

const searchKeyOptions = [
  {
    label: $t('page.business.consolidation.search.masterBillNo'),
    value: 'jk_masterbillnum'
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
  const { start, end } = etdRangeToStr();
  filters.push({ key: 'js_e_dep', op: 'between', val: '', start, end });

  if (searchVal.value) {
    filters.push({ key: searchKey.value, op: 'Contain', val: searchVal.value });
  }

  if (transportMode.value) {
    filters.push({
      key: 'jk_transportmode',
      op: transportModeOp.value,
      val: transportMode.value
    });
  }

  if (consolMode.value) {
    filters.push({
      key: 'jk_consolmode',
      op: consolModeOp.value,
      val: consolMode.value
    });
  }

  if (cancelled.value) {
    filters.push({
      key: 'jk_iscancelled',
      op: cancelledOp.value,
      val: cancelled.value
    });
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

function csvCell(value: unknown) {
  if (value === null || value === undefined) {
    return '';
  }
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function formatShippedOnBoard(row: ConsolidationRow) {
  const date = row.jk_shippedonboarddate as string | null | undefined;
  if (!date) return '';
  const dateObj = new Date(date);
  if (Number.isNaN(dateObj.getTime())) return '';
  return dateObj.toISOString().split('T')[0];
}

function formatCancelledCell(row: ConsolidationRow) {
  const normalized = String(row.jk_iscancelled ?? '').toLowerCase();
  const isCancelledRow = normalized === '1' || normalized === 'true' || normalized === 'y' || normalized === 'yes';
  return isCancelledRow ? $t('common.yesOrNo.yes') : $t('common.yesOrNo.no');
}

function buildConsolidationCsv(items: ConsolidationRow[]) {
  const header = [
    $t('page.business.consolidation.table.consolidationNo'),
    $t('page.business.consolidation.table.masterBillNo'),
    $t('page.business.consolidation.table.bookingReference'),
    $t('page.business.consolidation.table.consolStatus'),
    $t('page.business.consolidation.table.phase'),
    $t('page.business.consolidation.table.transportMode'),
    $t('page.business.consolidation.table.loadPort'),
    $t('page.business.consolidation.table.dischargePort'),
    $t('page.business.consolidation.table.shippedOnBoardDate'),
    $t('page.business.consolidation.table.consolChargeable'),
    $t('page.business.consolidation.table.cancelled')
  ].join(',');

  const lines = items.map(item =>
    [
      csvCell(item.jk_uniqueconsignref),
      csvCell(item.jk_masterbillnum),
      csvCell(item.jk_bookingreference),
      csvCell(item.jk_consolstatus),
      csvCell(item.jk_phase),
      csvCell(item.jk_transportmode),
      csvCell(item.jk_rl_nkloadport),
      csvCell(item.jk_rl_nkdischargeport),
      csvCell(formatShippedOnBoard(item)),
      csvCell(item.jk_consolchargeable),
      csvCell(formatCancelledCell(item))
    ].join(',')
  );

  return `${header}\n${lines.join('\n')}`;
}

function downloadCsv(csv: string, fileName: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.append(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function handleSearch() {
  getDataByPage(1);
}

function handleReset() {
  searchKey.value = 'jk_masterbillnum';
  searchVal.value = '';
  transportModeOp.value = '=';
  transportMode.value = '';
  consolModeOp.value = '=';
  consolMode.value = '';
  cancelledOp.value = '=';
  cancelled.value = '';
  etdRange.value = defaultEtdRange();
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

function handleMenuAction(key: ConsolidationActionKey, row: ConsolidationRow) {
  if (key !== 'export') return;

  downloadCsv(buildConsolidationCsv([row]), `Consol_${row.jk_uniqueconsignref || row.jk_pk}.csv`);
  window.$message?.success($t('page.settlement.transactions.exportSuccess'));
}

function handleBatchExport() {
  if (checkedRowKeys.value.length === 0) {
    window.$message?.warning($t('page.settlement.transactions.exportSelectFirst'));
    return;
  }
  const items = checkedRowKeys.value
    .map(k => selectedRowsByPk.value.get(String(k)))
    .filter((r): r is ConsolidationRow => r != null);
  if (items.length === 0) {
    window.$message?.warning($t('page.settlement.transactions.exportSelectFirst'));
    return;
  }
  if (items.length < checkedRowKeys.value.length) {
    window.$message?.warning(
      $t('page.settlement.transactions.exportPartialSkipped', {
        exported: items.length,
        selected: checkedRowKeys.value.length
      })
    );
  }
  downloadCsv(buildConsolidationCsv(items), 'Consols.csv');
  window.$message?.success($t('page.settlement.transactions.exportSuccess'));
}
</script>

<template>
  <div class="h-full flex-col-stretch gap-16px overflow-hidden">
    <NCard :bordered="false" class="flex-shrink-0">
      <div class="flex-col-stretch gap-16px">
        <NSpace align="center" :wrap="false">
          <NDatePicker
            v-model:value="etdRange"
            type="daterange"
            clearable
            :placeholder="$t('page.business.shipment.table.etd')"
            style="width: 260px"
          />
          <NSelect v-model:value="searchKey" :options="searchKeyOptions" style="width: 180px" />
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
          <NButton @click="showMore = !showMore">
            <template #icon>
              <icon-mdi-chevron-up v-if="showMore" />
              <icon-mdi-chevron-down v-else />
            </template>
            {{ $t('page.business.consolidation.search.more') }}
          </NButton>
        </NSpace>

        <div v-if="showMore" class="flex-col-stretch gap-14px">
          <NGrid :cols="2" :x-gap="24" :y-gap="14">
            <NGi>
              <NSpace align="center" :wrap="false">
                <div class="w-150px text-right">{{ $t('page.business.consolidation.search.transportMode') }}:</div>
                <NSelect v-model:value="transportModeOp" :options="operatorOptions" style="width: 100px" />
                <NInput v-model:value="transportMode" clearable />
              </NSpace>
            </NGi>
            <NGi>
              <NSpace align="center" :wrap="false">
                <div class="w-150px text-right">{{ $t('page.business.consolidation.search.consolMode') }}:</div>
                <NSelect v-model:value="consolModeOp" :options="operatorOptions" style="width: 100px" />
                <NInput v-model:value="consolMode" clearable />
              </NSpace>
            </NGi>
            <NGi>
              <NSpace align="center" :wrap="false">
                <div class="w-150px text-right">{{ $t('page.business.consolidation.search.cancelled') }}:</div>
                <NSelect v-model:value="cancelledOp" :options="operatorOptions" style="width: 100px" />
                <NInput v-model:value="cancelled" clearable />
              </NSpace>
            </NGi>
          </NGrid>

          <div>
            <NButton ghost type="primary" @click="handleReset">
              {{ $t('page.business.consolidation.search.clear') }}
            </NButton>
          </div>
        </div>
      </div>
    </NCard>

    <NCard :bordered="false" class="flex-1-hidden overflow-auto">
      <NSpace vertical :size="12">
        <NSpace>
          <NButton @click="handleBatchExport">
            {{ $t('page.business.shipment.export') }}
          </NButton>
        </NSpace>

        <NDataTable
          :checked-row-keys="checkedRowKeys"
          :columns="columns as any"
          :data="tableRows"
          :loading="loading"
          :pagination="pagination"
          :row-key="(row: any) => row.jk_pk"
          remote
          striped
          @update:checked-row-keys="handleCheckedRowKeysUpdate"
        />
      </NSpace>
    </NCard>
  </div>
</template>
