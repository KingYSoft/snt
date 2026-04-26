<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { $t } from '@/locales';
import { useMaintainTable } from '@/hooks/common/maintain-table';
import {
  shipmentTbl,
  shipmentExport,
  shipmentDeactivate,
  shipmentReopen,
  shipmentCopy,
  shipmentPdfGenerate
} from '@/service/api/business/shipment';
import { getShipmentColumns } from './modules/columns';
import type { ShipmentActionKey } from './modules/columns';

const router = useRouter();
const checkedRowKeys = ref<Array<number | string>>([]);

// --- ETD date range ---
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function defaultEtdRange(): [number, number] {
  return [addDays(new Date(), -20).getTime(), addDays(new Date(), 20).getTime()];
}

const etdRange = ref<[number, number]>(defaultEtdRange());

function etdRangeToStr(): { start: string; end: string } {
  return {
    start: formatDate(new Date(etdRange.value[0])),
    end: formatDate(new Date(etdRange.value[1]))
  };
}

// --- Search options ---
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

// Use a ref to hold the filters builder, initialized with ETD range so first load carries filters
const buildFiltersRef = ref<() => Array<any>>(() => {
  const filters: Array<any> = [];
  const { start, end } = etdRangeToStr();
  filters.push({ key: 'js_e_dep', op: 'between', val: '', start, end });
  return filters;
});

const { data, loading, columns, pagination, getData, handleSearch, handleReset, searchKey, searchOp, searchVal } =
  useMaintainTable({
    queryFn: async params => {
      const result = await shipmentTbl({
        skipCount: params.skipCount,
        maxResultCount: params.maxResultCount,
        filters: params.filters
      });
      return result;
    },
    deleteFn: async () => Promise.resolve(),
    getColumns: (editCb, deleteCb) => getShipmentColumns(editCb, deleteCb, handleMenuAction, navigateToEdit),
    filters: () => buildFiltersRef.value(),
    defaultSearchKey: 'js_uniqueconsignref'
  });

// Now define buildFilters after searchKey/searchOp/searchVal are available
buildFiltersRef.value = () => {
  const filters: Array<any> = [];
  const { start, end } = etdRangeToStr();
  filters.push({ key: 'js_e_dep', op: 'between', val: '', start, end });
  if (searchVal.value) {
    filters.push({
      key: searchKey.value,
      op: searchOp.value,
      val: searchVal.value
    });
  }
  return filters;
};

const scrollX = computed(() => {
  return columns.value.reduce((acc: number, col: any) => acc + Number(col.width ?? col.minWidth ?? 120), 0);
});

function onSearch() {
  handleSearch();
}

function onReset() {
  etdRange.value = defaultEtdRange();
  handleReset();
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
      window.$message?.warning($t('page.business.shipment.menu.merge') + ' - Coming soon');
      break;
    }
    case 'split': {
      window.$message?.warning($t('page.business.shipment.menu.split') + ' - Coming soon');
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
        window.$message?.error('Copy failed');
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
            window.$message?.error('Deactivate failed');
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
            window.$message?.error('Reopen failed');
          }
        }
      });
      break;
    }
    case 'export': {
      try {
        const response = await shipmentExport({
          skipCount: 0,
          maxResultCount: 1,
          filters: [
            {
              key: 'js_uniqueconsignref',
              op: 'Equal',
              val: row.js_uniqueconsignref
            }
          ]
        });
        if (response.data) {
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `${row.js_uniqueconsignref}.xlsx`);
          document.body.append(link);
          link.click();
          link.remove();
        }
      } catch {
        window.$message?.error($t('page.business.shipment.messages.exportFailed'));
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
        window.$message?.success('PDF generated');
      } catch {
        window.$message?.error('PDF generation failed');
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
  try {
    let filters = buildFiltersRef.value();

    // If rows are selected, export only selected rows
    if (checkedRowKeys.value.length > 0) {
      const selectedFilters = checkedRowKeys.value.map(id => ({
        key: 'id',
        op: 'Equal',
        val: String(id)
      }));
      filters = [{ key: 'js_e_dep', op: 'Or', val: '', or: selectedFilters }];
    }

    const response = await shipmentExport({
      skipCount: 0,
      maxResultCount: checkedRowKeys.value.length || pagination.pageSize || 100,
      filters
    });

    if (response.data) {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Shipments.xlsx');
      document.body.append(link);
      link.click();
      link.remove();
    }
  } catch {
    window.$message?.error($t('page.business.shipment.messages.exportFailed'));
  }
}
</script>

<template>
  <div class="h-full flex-col-stretch gap-16px overflow-hidden">
    <NCard :bordered="false" class="flex-shrink-0">
      <NSpace align="center" :wrap="false">
        <NDatePicker
          v-model:value="etdRange"
          type="daterange"
          clearable
          :placeholder="$t('page.business.shipment.table.etd')"
          style="width: 260px"
        />
        <NSelect v-model:value="searchKey" :options="searchKeyOptions" style="width: 150px" />
        <NSelect v-model:value="searchOp" :options="opOptions" style="width: 120px" />
        <NInput
          v-model:value="searchVal"
          :placeholder="$t('common.keywordSearch')"
          clearable
          style="width: 200px"
          @keyup.enter="onSearch"
        />
        <NButton type="primary" @click="onSearch">
          {{ $t('common.search') }}
        </NButton>
        <NButton @click="onReset">{{ $t('common.reset') }}</NButton>
      </NSpace>
    </NCard>

    <NCard :bordered="false" class="flex-1-hidden overflow-auto">
      <NSpace vertical :size="12">
        <NSpace>
          <NButton type="primary" @click="handleNewShipment">
            {{ $t('common.add') }}
          </NButton>
          <NButton @click="handleBatchExport">
            {{ $t('page.business.shipment.export') }}
          </NButton>
        </NSpace>

        <NDataTable
          v-model:checked-row-keys="checkedRowKeys"
          size="small"
          :columns="columns"
          :data="data"
          :loading="loading"
          :pagination="pagination"
          :row-key="(row: any) => row.id"
          :scroll-x="scrollX"
          @row-click="handleRowClick"
        />
      </NSpace>
    </NCard>
  </div>
</template>
