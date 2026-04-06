<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { $t } from '@/locales';
import { useMaintainTable } from '@/hooks/common/maintain-table';
import { queryOrganizationPage, deleteOrganization } from '@/service/api/maintain/organization';
import { getOrganizationColumns } from './modules/columns';

defineOptions({ name: 'PageMaintainOrganization' });

const router = useRouter();

const {
  data,
  loading,
  columns,
  pagination,
  getData,
  deleteLoading,
  searchKey,
  searchOp,
  searchVal,
  handleSearch,
  handleReset
} = useMaintainTable({
  queryFn: params => queryOrganizationPage(params),
  deleteFn: deleteOrganization,
  getColumns: (_editCb, deleteCb) =>
    getOrganizationColumns((row: any) => {
      router.push({
        name: 'maintain_organization-edit',
        params: { pk: row.pk },
        query: { id: row.id, org_code: row.org_code }
      });
    }, deleteCb),
  defaultSearchKey: 'code'
});

function handleAdd() {
  router.push({ name: 'maintain_organization-new' });
}

function handleRowClick(row: any) {
  router.push({
    name: 'maintain_organization-detail',
    query: { pk: row.pk, id: row.id }
  });
}

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
function rowProps(row: any) {
  return {
    style: 'cursor: pointer;',
    onClick: () => {
      handleRowClick(row);
    }
  };
}
onMounted(() => {
  getData();
});
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
        <NButton type="primary" @click="handleSearch">
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
          :columns="columns"
          :data="data"
          :loading="loading || deleteLoading"
          :pagination="pagination"
          :row-key="(row: any) => row.pk"
          :row-props="rowProps"
        />
      </NSpace>
    </NCard>
  </div>
</template>
