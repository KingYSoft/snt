<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useNaivePaginatedTable } from '@/hooks/common/table';
import { sjcTransform, buildSjcPaginationParams } from '@/utils/maintain/transform';
import { queryWriteoffList } from '@/service/api/business/settlement';
import { getWriteoffColumns } from './modules/columns';
import type { WriteoffRecord } from '@/service/api/business/settlement';

const router = useRouter();
defineOptions({ name: 'PageSettlementWriteoff' });

const { t } = useI18n();

const searchKey = ref('ah_transactionnum');
const searchOp = ref('Contain');
const searchVal = ref('');

const pageRef = ref(1);
const pageSizeRef = ref(20);

function buildFilters() {
  return searchVal.value ? [{ key: searchKey.value, op: searchOp.value, val: searchVal.value }] : [];
}

const { data, loading, columns, pagination, getData, getDataByPage } = useNaivePaginatedTable<any, any>({
  api: async () => {
    return queryWriteoffList({
      ...buildSjcPaginationParams(pageRef.value, pageSizeRef.value),
      filters: buildFilters()
    });
  },
  columns: () => getWriteoffColumns(handleViewDetail),
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

async function handleViewDetail(row: WriteoffRecord) {
  router.push({
    name: 'settlement_writeoff-detail',
    query: { apPk: row.ap_pk }
  });
}

function handleSearch() {
  getDataByPage(1);
}

function handleReset() {
  searchVal.value = '';
  searchOp.value = 'Contain';
  getDataByPage(1);
}

const searchKeyOptions = [
  {
    label: () => t('page.settlement.writeoff.transactionNum'),
    value: 'ah_transactionnum'
  },
  {
    label: () => t('page.settlement.writeoff.companyName'),
    value: 'companyName'
  },
  {
    label: () => t('page.settlement.writeoff.status'),
    value: 'ah_matchstatus'
  }
];

const opOptions = [
  { label: () => t('common.op.equal'), value: 'Equal' },
  { label: () => t('common.op.notEqual'), value: 'NotEqual' },
  { label: () => t('common.op.contain'), value: 'Contain' },
  { label: () => t('common.op.notContain'), value: 'NotContain' }
];

const matchColumns = [
  { title: 'Amount', key: 'ap_amount', width: 120, align: 'right' as const },
  { title: 'GST', key: 'ap_gstrealised', width: 100, align: 'right' as const },
  {
    title: 'Match Date',
    key: 'ap_matchdate',
    width: 120,
    align: 'center' as const,
    render: (row: any) => (row.ap_matchdate ? row.ap_matchdate.split('T')[0] : '-')
  },
  {
    title: 'OS Amount',
    key: 'ap_osamount',
    width: 120,
    align: 'right' as const
  },
  { title: 'Reason', key: 'ap_reason', minWidth: 120 },
  { title: 'Created By', key: 'ap_systemcreateuser', width: 120 },
  {
    title: 'Created Time',
    key: 'ap_systemcreatetimeutc',
    width: 160,
    render: (row: any) =>
      row.ap_systemcreatetimeutc ? row.ap_systemcreatetimeutc.replace('T', ' ').split('.')[0] : '-'
  }
];
</script>

<template>
  <div class="h-full flex-col-stretch gap-16px overflow-hidden">
    <NCard :title="t('page.settlement.writeoff.title')" :bordered="false" class="flex-shrink-0">
      <NSpace align="center" :wrap="false">
        <NSelect v-model:value="searchKey" :options="searchKeyOptions" style="width: 150px" />
        <NSelect v-model:value="searchOp" :options="opOptions" style="width: 120px" />
        <NInput
          v-model:value="searchVal"
          :placeholder="t('common.keywordSearch')"
          clearable
          style="width: 200px"
          @keyup.enter="handleSearch"
        />
        <NButton type="primary" :loading="loading" @click="handleSearch">
          {{ t('common.search') }}
        </NButton>
        <NButton @click="handleReset">{{ t('common.reset') }}</NButton>
      </NSpace>
    </NCard>

    <NCard :bordered="false" class="flex-1-hidden overflow-auto">
      <NSpace vertical :size="12">
        <NButton type="primary" @click="$router.push({ name: 'settlement_writeoff-create' })">
          {{ t('page.settlement.writeoff.addWriteoff') }}
        </NButton>

        <NDataTable
          :columns="columns as any"
          :data="data"
          :loading="loading"
          :pagination="pagination"
          :row-key="(row: any) => row.ap_pk"
          remote
          striped
        />
      </NSpace>
    </NCard>
  </div>
</template>
