<script setup lang="ts">
import { onMounted } from 'vue';
import { $t } from '@/locales';
import { useMaintainTable } from '@/hooks/common/maintain-table';
import { queryShippingLinesPage, deleteShippingLines } from '@/service/api/maintain/shipping-lines';
import { getShippingLinesColumns } from './modules/columns';
import EditDrawer from './modules/edit-drawer.vue';

defineOptions({ name: 'PageMaintainShippingLines' });

const {
  data,
  loading,
  columns,
  pagination,
  getData,
  drawerVisible,
  operateType,
  editingData,
  handleAdd,
  deleteLoading,
  searchKey,
  searchOp,
  searchVal,
  handleSearch,
  handleReset
} = useMaintainTable({
  queryFn: params => queryShippingLinesPage(params),
  deleteFn: deleteShippingLines,
  getColumns: (editCb, deleteCb) => getShippingLinesColumns(editCb, deleteCb),
  defaultSearchKey: 'code'
});

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

onMounted(() => {
  getData();
});
</script>

<template>
  <div class="h-full flex-col-stretch gap-16px overflow-hidden">
    <NCard :title="$t('route.maintain_shipping-lines')" :bordered="false" class="flex-shrink-0">
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
          :row-key="(row: any) => row.id"
          :scroll-x="1900"
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
