<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { $t } from '@/locales';
import { useMaintainTable } from '@/hooks/common/maintain-table';
import { queryWriteoffList } from '@/service/api/business/settlement';
import { getWriteoffColumns } from './modules/columns';

defineOptions({ name: 'PageSettlementWriteoff' });

const router = useRouter();

// 搜索状态
const searchKey = ref('writeoffNo');
const searchOp = ref('Contain');
const searchVal = ref('');
const currentFilters = ref<Array<{ key: string; op: string; val: string }>>([]);

// 使用 refs 打破循环类型推断
const pageRef = ref(1);
const pageSizeRef = ref(20);
const deleteLoading = ref(false);

// 分页参数构建函数
function buildPaginationParams(page: number, pageSize: number) {
  return {
    skipCount: (page - 1) * pageSize,
    maxResultCount: pageSize,
    filters: currentFilters.value
  };
}

// 获取数据
const { data, loading, columns, pagination, getData } = useMaintainTable<any>({
  queryFn: async () => {
    const params = buildPaginationParams(pageRef.value, pageSizeRef.value);
    const result = await queryWriteoffList(params);
    console.log(result);
    return result;
  },
  deleteFn: async () => ({ success: true }), // 占位符，暂不支持删除
  getColumns: () => getWriteoffColumns(),
  defaultSearchKey: 'writeoffNo',
  filters: () => currentFilters.value
});

function handleSearch() {
  currentFilters.value = searchVal.value ? [{ key: searchKey.value, op: searchOp.value, val: searchVal.value }] : [];
  pageRef.value = 1;
  pagination.page = 1;
  getData();
}

function handleReset() {
  searchVal.value = '';
  searchOp.value = 'Contain';
  currentFilters.value = [];
  pageRef.value = 1;
  pagination.page = 1;
  getData();
}

// 新增销账
function handleAdd() {
  router.push({ name: 'settlement_writeoff-create' });
}

// 搜索选项
const searchKeyOptions = [
  { label: '销账单号', value: 'writeoffNo' },
  { label: '公司名称', value: 'companyName' },
  { label: '状态', value: 'status' }
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
    <NCard title="销账列表" :bordered="false" class="flex-shrink-0">
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
        <NButton type="primary" @click="handleAdd">新增销账</NButton>

        <NDataTable
          :columns="columns"
          :data="data"
          :loading="loading || deleteLoading"
          :pagination="pagination"
          :row-key="(row: any) => row.writeoffNo"
          :scroll-x="1400"
        />
      </NSpace>
    </NCard>
  </div>
</template>
