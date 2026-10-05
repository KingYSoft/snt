<script setup lang="ts">
import { ref } from 'vue';
import { $t } from '@/locales';
import { useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { sjcTransform, buildSjcPaginationParams } from '@/utils/maintain/transform';
import { querySystemCompanyPage, deleteSystemCompany } from '@/service/api/system/company';
import { getCompanyColumns } from './modules/columns';
import EditDrawer from './modules/edit-drawer.vue';

defineOptions({ name: 'SystemCompany' });

const searchKey = ref('code');
const searchOp = ref('Equal');
const searchVal = ref('');

const searchKeyOptions = [
  { label: () => $t('page.system.company.code'), value: 'code' },
  { label: () => $t('page.system.company.name'), value: 'name' },
  { label: () => $t('page.system.company.businessRegNo'), value: 'business_reg_no' },
  { label: () => $t('page.system.company.city'), value: 'city' },
  { label: () => $t('page.system.company.countryCode'), value: 'country_code' },
  { label: () => $t('page.system.company.phone'), value: 'phone' },
  { label: () => $t('page.system.company.email'), value: 'email' },
  { label: () => $t('page.system.company.homeCurrency'), value: 'home_currency' }
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
  return searchVal.value ? [{ key: searchKey.value, op: searchOp.value, val: searchVal.value }] : [];
}

const editRef = ref<(id: any) => void>(() => {});
const deleteRef = ref<(row: any) => void>(() => {});

const { data, loading, columns, pagination, getData, getDataByPage } = useNaivePaginatedTable<any, any>({
  api: async () => {
    return querySystemCompanyPage({
      ...buildSjcPaginationParams(pageRef.value, pageSizeRef.value),
      filters: buildFilters()
    });
  },
  columns: () =>
    getCompanyColumns(
      (id: any) => editRef.value(id),
      (row: any) => deleteRef.value(row)
    ),
  transform: response => sjcTransform(response, { page: pageRef.value, pageSize: pageSizeRef.value }),
  paginationProps: { pageSize: 20, pageSizes: [10, 20, 50, 100] },
  onPaginationParamsChange: params => {
    pageRef.value = params.page ?? 1;
    pageSizeRef.value = params.pageSize ?? 20;
  }
});

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, onDeleted } = useTableOperate<any>(
  data as any,
  'pk' as any,
  getData
);

const deleteLoading = ref(false);
editRef.value = handleEdit;

async function handleDelete(row: any) {
  const pk = String(row.pk ?? '').trim();
  if (!pk) return;
  deleteLoading.value = true;
  try {
    await deleteSystemCompany(pk);
    window.$message?.success($t('common.deleteSuccess'));
    await onDeleted();
  } finally {
    deleteLoading.value = false;
  }
}

deleteRef.value = handleDelete;

function handleSearch() {
  getDataByPage(1);
}

function handleReset() {
  searchVal.value = '';
  searchOp.value = 'Equal';
  getDataByPage(1);
}
</script>

<template>
  <div class="h-full flex-col-stretch gap-16px overflow-hidden">
    <NCard :title="$t('route.system_company')" :bordered="false" class="flex-shrink-0">
      <NSpace align="center" :wrap="false">
        <NSelect v-model:value="searchKey" :options="searchKeyOptions" style="width: 160px" />
        <NSelect v-model:value="searchOp" :options="opOptions" style="width: 120px" />
        <NInput
          v-model:value="searchVal"
          :placeholder="$t('common.keywordSearch')"
          clearable
          style="width: 200px"
          @keyup.enter="handleSearch"
        />
        <NButton type="primary" :loading="loading" @click="handleSearch">{{ $t('common.search') }}</NButton>
        <NButton @click="handleReset">{{ $t('common.reset') }}</NButton>
      </NSpace>
    </NCard>

    <NCard :bordered="false" class="flex-1-hidden overflow-auto">
      <NSpace vertical :size="12">
        <NButton type="primary" @click="handleAdd">{{ $t('common.add') }}</NButton>
        <NDataTable
          :columns="columns as any"
          :data="data"
          :loading="loading || deleteLoading"
          :pagination="pagination"
          :row-key="(row: any) => row.pk"
          :scroll-x="1300"
          remote
          striped
        />
      </NSpace>
    </NCard>

    <EditDrawer
      v-model:visible="drawerVisible"
      :operate-type="operateType"
      :editing-data="editingData"
      @submitted="getData"
    />
  </div>
</template>
