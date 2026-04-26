<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { $t } from '@/locales';
import { useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { sjcTransform, buildSjcPaginationParams } from '@/utils/maintain/transform';
import { queryOrganizationPage, deleteOrganization } from '@/service/api/maintain/organization';
import { getOrganizationColumns } from './modules/columns';

defineOptions({ name: 'PageMaintainOrganization' });

const router = useRouter();

const searchKey = ref('code');
const searchOp = ref('Contain');
const searchVal = ref('');

const searchKeyOptions = [
  { label: 'Code', value: 'code' },
  { label: 'Name', value: 'name' }
];
const opOptions = [
  { label: () => $t('common.op.equal'), value: 'Equal' },
  { label: () => $t('common.op.notEqual'), value: 'NotEqual' },
  { label: () => $t('common.op.contain'), value: 'Contain' },
  { label: () => $t('common.op.notContain'), value: 'NotContain' }
];

const pageRef = ref(1);
const pageSizeRef = ref(20);

function buildFilters() {
  return searchVal.value
    ? [{ key: searchKey.value, op: searchOp.value, val: searchVal.value }]
    : [];
}

const deleteRef = ref<(row: any) => void>(() => {});

const { data, loading, columns, pagination, getData, getDataByPage } = useNaivePaginatedTable<any, any>({
  api: async () => {
    return queryOrganizationPage({
      ...buildSjcPaginationParams(pageRef.value, pageSizeRef.value),
      filters: buildFilters()
    });
  },
  columns: () =>
    getOrganizationColumns(
      (row: any) => {
        router.push({
          name: 'maintain_organization-edit',
          params: { pk: row.pk },
          query: { id: row.id, org_code: row.org_code }
        });
      },
      (row: any) => deleteRef.value(row),
      (row: any) =>
        router.push({
          name: 'maintain_organization-detail',
          query: { pk: row.pk, id: row.id }
        })
    ),
  transform: response => sjcTransform(response, { page: pageRef.value, pageSize: pageSizeRef.value }),
  paginationProps: {
    pageSize: 20,
    pageSizes: [10, 20, 50, 100]
  },
  onPaginationParamsChange: params => {
    pageRef.value = params.page ?? 1;
    pageSizeRef.value = params.pageSize ?? 20;
  }
});

const { onDeleted } = useTableOperate<any>(data as any, 'pk' as any, getData);

const deleteLoading = ref(false);

async function handleDelete(row: any) {
  deleteLoading.value = true;
  try {
    await deleteOrganization(row.id);
    window.$message?.success($t('common.deleteSuccess'));
    await onDeleted();
  } finally {
    deleteLoading.value = false;
  }
}

deleteRef.value = handleDelete;

function handleAdd() {
  router.push({ name: 'maintain_organization-new' });
}

function handleSearch() {
  getDataByPage(1);
}

function handleReset() {
  searchVal.value = '';
  searchOp.value = 'Contain';
  getDataByPage(1);
}
</script>

<template>
  <div class="h-full flex-col-stretch gap-16px overflow-hidden">
    <NCard :title="$t('route.maintain_organization')" :bordered="false" class="flex-shrink-0">
      <NSpace align="center" :wrap="false">
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

    <NCard :bordered="false" class="flex-1-hidden overflow-auto">
      <NSpace vertical :size="12">
        <NButton type="primary" @click="handleAdd">
          {{ $t('common.add') }}
        </NButton>

        <NDataTable
          :columns="(columns as any)"
          :data="data"
          :loading="loading || deleteLoading"
          :pagination="pagination"
          :row-key="(row: any) => row.pk"
          remote
          striped
        />
      </NSpace>
    </NCard>
  </div>
</template>
