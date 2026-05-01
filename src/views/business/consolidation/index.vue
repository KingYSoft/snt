<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { $t } from '@/locales';
import { useNaivePaginatedTable } from '@/hooks/common/table';
import { sjcTransform, buildSjcPaginationParams } from '@/utils/maintain/transform';
import {
  consolidationQueryPage,
  consolidationExport,
  type ConsolidationFilter
} from '@/service/api/business/consolidation';
import { getConsolidationColumns, type ConsolidationActionKey } from './modules/columns';

defineOptions({
  name: 'BusinessConsolidation'
});

const router = useRouter();
const showMore = ref(false);

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
const { data, loading, columns, pagination, getDataByPage } = useNaivePaginatedTable<any, any>({
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

async function handleExport(filters: ConsolidationFilter[], fileName: string, maxResultCount?: number) {
  const response = await consolidationExport({
    SkipCount: 0,
    MaxResultCount: maxResultCount ?? (pagination.pageSize || 100),
    filters
  });

  if (response.data) {
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.append(link);
    link.click();
    link.remove();
  }
}

async function handleMenuAction(key: ConsolidationActionKey, row: any) {
  if (key !== 'export') return;

  try {
    await handleExport(
      [{ key: 'jk_pk', op: '=', val: row.jk_pk }],
      `Consol_${row.jk_uniqueconsignref || row.jk_pk}.xlsx`,
      1
    );
  } catch {
    window.$message?.error($t('page.business.shipment.messages.exportFailed'));
  }
}

async function handleBatchExport() {
  try {
    await handleExport(buildFilters(), 'Consols.xlsx', pagination.pageSize || 100);
  } catch {
    window.$message?.error($t('page.business.shipment.messages.exportFailed'));
  }
}
</script>

<template>
  <div class="h-full flex-col-stretch gap-16px overflow-hidden">
    <NCard :bordered="false" class="flex-shrink-0">
      <div class="flex-col-stretch gap-16px">
        <NSpace align="center" :wrap="false">
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
          :columns="columns as any"
          :data="data"
          :loading="loading"
          :pagination="pagination"
          :row-key="(row: any) => row.id"
          remote
          striped
        />
      </NSpace>
    </NCard>
  </div>
</template>
