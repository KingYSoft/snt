<script setup lang="ts">
import { computed, onActivated, onMounted, ref, watch } from 'vue';
import type { DataTableRowKey } from 'naive-ui';
import { useRoute, useRouter } from 'vue-router';
import { $t } from '@/locales';
import { useTabStore } from '@/store/modules/tab';
import { useNaivePaginatedTable } from '@/hooks/common/table';
import { sjcTransform, buildSjcPaginationParams } from '@/utils/maintain/transform';
import {
  shipmentTbl,
  shipmentExport,
  shipmentDeactivate,
  shipmentReopen,
  shipmentCopy,
  shipmentPdfGenerate
} from '@/service/api/business/shipment';
import type { ShipmentListItem } from '@/service/api/business/shipment';
import { downloadBlob } from '@/utils/download';
import { getExportColumns } from '@/utils/export-columns';
import { getShipmentColumns } from './modules/columns';
import type { ShipmentActionKey } from './modules/columns';

defineOptions({
  name: 'BusinessShipment'
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
const selectedRowsById = ref(new Map<string, ShipmentListItem>());
const exportLoading = ref(false);

/** 接口部分行 `id` 为空；row-key 不能为 null，否则 naive-ui 勾选报错 */
function shipmentRowKey(row: ShipmentListItem) {
  const k = row.id ?? row.js_pk ?? row.js_uniqueconsignref;
  if (k != null && String(k).trim() !== '') {
    return String(k);
  }
  return `__shipment_${String(row.js_pk ?? '')}_${String(row.js_uniqueconsignref ?? '')}`.replace(/_{2,}/g, '_');
}

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
const searchKey = ref('js_uniqueconsignref');
const searchOp = ref('Contain');
const searchVal = ref('');

const searchKeyOptions = [
  {
    label: () => $t('page.business.shipment.table.shipmentNo'),
    value: 'js_uniqueconsignref'
  },
  {
    label: () => $t('page.business.shipment.table.housebill'),
    value: 'js_housebill'
  },
  {
    label: () => $t('page.business.shipment.table.destination'),
    value: 'js_rl_nkdestination'
  }
];

const opOptions = [
  { label: () => $t('common.op.equal'), value: 'Equal' },
  { label: () => $t('common.op.notEqual'), value: 'NotEqual' },
  { label: () => $t('common.op.contain'), value: 'Contain' },
  { label: () => $t('common.op.notContain'), value: 'NotContain' },
  { label: () => $t('common.op.startsWith'), value: 'StartWith' },
  { label: () => $t('common.op.endsWith'), value: 'EndWith' }
];

// --- Pagination refs synced with useNaivePaginatedTable ---
const pageRef = ref(1);
const pageSizeRef = ref(20);

function buildFilters() {
  const filters: Array<any> = [];
  const start = String(etdStart.value ?? '').trim();
  const end = String(etdEnd.value ?? '').trim();
  if (start && end) {
    filters.push({ key: 'js_e_dep', op: 'between', val: '', start, end });
  }
  if (searchVal.value) {
    filters.push({
      key: searchKey.value,
      op: searchOp.value,
      val: searchVal.value
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
  getData,
  getDataByPage
} = useNaivePaginatedTable<any, any>({
  api: async () => {
    return shipmentTbl({
      ...buildSjcPaginationParams(pageRef.value, pageSizeRef.value),
      filters: buildFilters()
    });
  },
  columns: () =>
    getShipmentColumns(
      () => {},
      () => {},
      handleMenuAction,
      navigateToEdit
    ),
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
  const map = selectedRowsById.value;
  for (const id of map.keys()) {
    if (!keySet.has(id)) {
      map.delete(id);
    }
  }
  if (rowsPayload?.length) {
    keys.forEach((key, i) => {
      const row = rowsPayload[i] as ShipmentListItem | undefined;
      if (row != null && typeof row === 'object') {
        map.set(String(key), row);
      }
    });
  }
}

watch(tableRows, newRows => {
  const keySet = new Set(checkedRowKeys.value.map(k => String(k)));
  const map = selectedRowsById.value;
  for (const row of newRows) {
    const id = shipmentRowKey(row);
    if (keySet.has(id)) {
      map.set(id, row);
    }
  }
});

const scrollX = computed(() => {
  return columns.value.reduce((acc: number, col: any) => acc + Number(col.width ?? col.minWidth ?? 120), 0);
});

function handleSearch() {
  getDataByPage(1);
}

function handleReset() {
  searchVal.value = '';
  searchOp.value = 'Contain';
  const dates = defaultEtdDates();
  etdStart.value = dates.start;
  etdEnd.value = dates.end;
  checkedRowKeys.value = [];
  selectedRowsById.value = new Map();
  getDataByPage(1);
}

// --- Row actions ---
function navigateToEdit(row: any) {
  router.push({
    name: 'business_shipment-edit',
    params: { pk: row.js_pk }
  });
}

async function handleMenuAction(key: ShipmentActionKey, row: any) {
  switch (key) {
    case 'edit': {
      navigateToEdit(row);
      break;
    }
    case 'merge': {
      window.$message?.warning(`${$t('page.business.shipment.menu.merge')} - ${$t('common.lookForward')}`);
      break;
    }
    case 'split': {
      window.$message?.warning(`${$t('page.business.shipment.menu.split')} - ${$t('common.lookForward')}`);
      break;
    }
    case 'copy': {
      try {
        const res = await shipmentCopy(row.id);
        if (res) {
          window.$message?.success($t('common.addSuccess'));
          getData();
        }
      } catch {
        window.$message?.error($t('page.business.shipment.messages.copyFailed'));
      }
      break;
    }
    case 'deactivate': {
      window.$dialog?.warning({
        title: $t('common.confirm'),
        content: `${$t('page.business.shipment.menu.deactivate')}: ${row.js_uniqueconsignref}?`,
        positiveText: $t('common.confirm'),
        negativeText: $t('common.cancel'),
        onPositiveClick: async () => {
          try {
            await shipmentDeactivate(row.id);
            window.$message?.success($t('common.modifySuccess'));
            getData();
          } catch {
            window.$message?.error($t('page.business.shipment.messages.deactivateFailed'));
          }
        }
      });
      break;
    }
    case 'reopen': {
      window.$dialog?.warning({
        title: $t('common.confirm'),
        content: `${$t('page.business.shipment.menu.reopen')}: ${row.js_uniqueconsignref}?`,
        positiveText: $t('common.confirm'),
        negativeText: $t('common.cancel'),
        onPositiveClick: async () => {
          try {
            await shipmentReopen(row.id);
            window.$message?.success($t('common.modifySuccess'));
            getData();
          } catch {
            window.$message?.error($t('page.business.shipment.messages.reopenFailed'));
          }
        }
      });
      break;
    }
    case 'export': {
      if (exportLoading.value) return;
      exportLoading.value = true;
      try {
        const blob = await shipmentExport({
          skipCount: 0,
          maxResultCount: 1,
          filters: [{ key: 'js_uniqueconsignref', op: '=', val: row.js_uniqueconsignref || '' }],
          columns: getExportColumns(columns.value),
          exportTitle: $t('route.business_shipment'),
          companyNameLabel: $t('common.exportMeta.companyName'),
          reportPeriodLabel: $t('common.exportMeta.reportGeneratedPeriod')
        });
        downloadBlob(blob, `${row.js_uniqueconsignref || row.id}.xlsx`);
        window.$message?.success($t('page.settlement.transactions.exportSuccess'));
      } catch {
        window.$message?.error($t('page.settlement.transactions.exportFailed'));
      } finally {
        exportLoading.value = false;
      }
      break;
    }
    case 'batchprint': {
      try {
        await shipmentPdfGenerate({
          business_id: row.id,
          business_pk: row.pk,
          template_code: 'SHIPMENT',
          version_no: '1.0'
        });
        window.$message?.success($t('page.business.shipment.messages.pdfGenerated'));
      } catch {
        window.$message?.error($t('page.business.shipment.messages.pdfFailed'));
      }
      break;
    }
  }
}

// --- Top actions ---
function handleNewShipment() {
  router.push({ name: 'business_shipment-new' });
}

function handleRowClick(row: any) {
  navigateToEdit(row);
}

async function handleBatchExport() {
  if (exportLoading.value) return;
  exportLoading.value = true;
  try {
    const blob = await shipmentExport({
      skipCount: 0,
      maxResultCount: 0,
      filters: buildFilters(),
      columns: getExportColumns(columns.value),
      exportTitle: $t('route.business_shipment'),
      companyNameLabel: $t('common.exportMeta.companyName'),
      reportPeriodLabel: $t('common.exportMeta.reportGeneratedPeriod')
    });
    downloadBlob(blob, 'Shipments.xlsx');
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
        <NSelect v-model:value="searchKey" :options="searchKeyOptions" style="width: 150px" />
        <NSelect v-model:value="searchOp" :options="opOptions" style="width: 120px" />
        <NInput
          v-model:value="searchVal"
          :placeholder="$t('common.keywordSearch')"
          clearable
          style="width: 200px"
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
        <NButton type="primary" @click="handleNewShipment">
          {{ $t('common.add') }}
        </NButton>
        <NButton :loading="exportLoading" @click="handleBatchExport">
          {{ $t('page.business.shipment.export') }}
        </NButton>
      </NSpace>

      <div class="min-h-0 flex-1 overflow-hidden">
        <NDataTable
          class="h-full"
          flex-height
          :checked-row-keys="checkedRowKeys"
          size="small"
          :columns="columns as any"
          :data="tableRows"
          :loading="loading || exportLoading"
          :pagination="pagination"
          :row-key="(row: ShipmentListItem) => shipmentRowKey(row)"
          :scroll-x="scrollX"
          remote
          striped
          @update:checked-row-keys="handleCheckedRowKeysUpdate"
          @row-click="handleRowClick"
        />
      </div>
    </NCard>
  </div>
</template>
