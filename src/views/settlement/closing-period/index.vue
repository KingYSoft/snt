<script setup lang="ts">
import { reactive, ref } from 'vue';
import type { SelectOption } from 'naive-ui';
import { $t } from '@/locales';
import { useNaivePaginatedTable } from '@/hooks/common/table';
import { buildSjcPaginationParams, sjcTransform } from '@/utils/maintain/transform';
import { queryBranchPage, type SysBranch } from '@/service/api/system/branch';
import {
  createClosingPeriodDefaultMonthRange,
  formatClosingPeriodDate,
  formatClosingPeriodMonth,
  queryClosingPeriodPage,
  type ClosingPeriodQueryFilter,
  type ClosingPeriodRecord
} from '@/service/api/settlement/closing-period';
import { getClosingPeriodColumns } from './modules/columns';
import EditModal from './modules/edit-modal.vue';

defineOptions({ name: 'PageSettlementClosingPeriod' });

const defaultRange = createClosingPeriodDefaultMonthRange();

const filters = reactive({
  periodStart: defaultRange.start as string | null,
  periodEnd: defaultRange.end as string | null,
  closingStart: null as string | null,
  closingEnd: null as string | null,
  branchPk: null as string | null
});

const pageRef = ref(1);
const pageSizeRef = ref(50);

const branchOptions = ref<SelectOption[]>([]);
const branchLoading = ref(false);

const modalVisible = ref(false);
const operateType = ref<'add' | 'edit'>('add');
const editingData = ref<ClosingPeriodRecord | null>(null);

function buildFilters(): ClosingPeriodQueryFilter[] {
  const list: ClosingPeriodQueryFilter[] = [];
  if (filters.periodStart || filters.periodEnd) {
    list.push({
      key: 'close_period',
      op: 'between',
      val: '',
      start: formatClosingPeriodMonth(filters.periodStart),
      end: formatClosingPeriodMonth(filters.periodEnd)
    });
  }
  if (filters.closingStart || filters.closingEnd) {
    list.push({
      key: 'closing_date',
      op: 'between',
      val: '',
      start: formatClosingPeriodDate(filters.closingStart),
      end: formatClosingPeriodDate(filters.closingEnd)
    });
  }
  if (filters.branchPk) {
    list.push({ key: 'branch_pk', op: '=', val: filters.branchPk });
  }
  return list;
}

async function loadBranchOptions() {
  branchLoading.value = true;
  try {
    const res = await queryBranchPage({ skipCount: 0, maxResultCount: 1000, filters: [] });
    const rows: SysBranch[] = res?.data?.items ?? [];
    branchOptions.value = rows
      .filter(row => row.pk)
      .map(row => ({
        label: [row.code, row.branch_name].filter(Boolean).join(' - ') || String(row.pk),
        value: String(row.pk)
      }));
  } catch {
    branchOptions.value = [];
  } finally {
    branchLoading.value = false;
  }
}

void loadBranchOptions();

function handleAdd() {
  operateType.value = 'add';
  editingData.value = null;
  modalVisible.value = true;
}

function handleEdit(row: ClosingPeriodRecord) {
  operateType.value = 'edit';
  editingData.value = row;
  modalVisible.value = true;
}

function rowProps(row: ClosingPeriodRecord) {
  return {
    style: 'cursor: pointer',
    onDblclick: () => handleEdit(row)
  };
}

const { data, loading, columns, pagination, getData, getDataByPage } = useNaivePaginatedTable<any, any>({
  api: () =>
    queryClosingPeriodPage({
      ...buildSjcPaginationParams(pageRef.value, pageSizeRef.value),
      filters: buildFilters()
    }),
  columns: () => getClosingPeriodColumns(handleEdit),
  transform: response => sjcTransform(response, { page: pageRef.value, pageSize: pageSizeRef.value }),
  paginationProps: {
    pageSize: 50,
    pageSizes: [20, 50, 100, 200]
  },
  onPaginationParamsChange: params => {
    pageRef.value = params.page ?? 1;
    pageSizeRef.value = params.pageSize ?? 50;
  }
});

function handleSearch() {
  void getDataByPage(1);
}

function handleReset() {
  const range = createClosingPeriodDefaultMonthRange();
  Object.assign(filters, {
    periodStart: range.start,
    periodEnd: range.end,
    closingStart: null,
    closingEnd: null,
    branchPk: null
  });
  void getDataByPage(1);
}
</script>

<template>
  <div class="h-full flex-col-stretch gap-16px overflow-hidden">
    <NCard :title="$t('route.settlement_closing-period')" :bordered="false" class="flex-shrink-0">
      <NGrid :cols="24" :x-gap="12" :y-gap="12">
        <NGi :span="8">
          <div class="flex items-center gap-8px">
            <span class="w-110px shrink-0 whitespace-nowrap text-right text-12px">
              {{ $t('page.settlement.closingPeriod.filter.accountingMonth') }}:
            </span>
            <NDatePicker
              v-model:formatted-value="filters.periodStart"
              type="month"
              value-format="yyyy-MM"
              clearable
              class="flex-1"
            />
            <span class="text-12px">-</span>
            <NDatePicker
              v-model:formatted-value="filters.periodEnd"
              type="month"
              value-format="yyyy-MM"
              clearable
              class="flex-1"
            />
          </div>
        </NGi>
        <NGi :span="9">
          <div class="flex items-center gap-8px">
            <span class="w-110px shrink-0 whitespace-nowrap text-right text-12px">
              {{ $t('page.settlement.closingPeriod.filter.closingDate') }}:
            </span>
            <NDatePicker
              v-model:formatted-value="filters.closingStart"
              type="date"
              value-format="yyyy-MM-dd"
              clearable
              class="flex-1"
            />
            <span class="text-12px">-</span>
            <NDatePicker
              v-model:formatted-value="filters.closingEnd"
              type="date"
              value-format="yyyy-MM-dd"
              clearable
              class="flex-1"
            />
          </div>
        </NGi>
        <NGi :span="7">
          <div class="flex items-center gap-8px">
            <span class="w-110px shrink-0 whitespace-nowrap text-right text-12px">
              {{ $t('page.settlement.closingPeriod.filter.businessUnit') }}:
            </span>
            <NSelect
              v-model:value="filters.branchPk"
              :options="branchOptions"
              :loading="branchLoading"
              filterable
              clearable
              class="flex-1"
              :placeholder="$t('page.settlement.closingPeriod.filter.businessUnit')"
            />
          </div>
        </NGi>
      </NGrid>

      <NSpace class="mt-12px">
        <NButton type="primary" :loading="loading" @click="handleSearch">{{ $t('common.search') }}</NButton>
        <NButton @click="handleReset">{{ $t('common.reset') }}</NButton>
      </NSpace>
    </NCard>

    <NCard :bordered="false" class="h-full flex-1-hidden" content-class="h-full flex flex-col overflow-hidden">
      <NButton class="mb-12px flex-shrink-0 self-start" type="primary" @click="handleAdd">
        {{ $t('page.settlement.closingPeriod.new') }}
      </NButton>
      <div class="min-h-0 flex-1 overflow-hidden">
        <NDataTable
          class="h-full"
          flex-height
          :columns="columns as any"
          :data="data"
          :loading="loading"
          :pagination="pagination"
          :row-key="(row: ClosingPeriodRecord) => row.pk || String(row.id ?? '')"
          :row-props="rowProps"
          :scroll-x="1000"
          remote
          striped
        />
      </div>
    </NCard>

    <EditModal
      v-model:visible="modalVisible"
      :operate-type="operateType"
      :editing-data="editingData"
      @submitted="getData"
    />
  </div>
</template>

<style scoped>
:deep(.n-data-table-th) {
  white-space: nowrap;
}
</style>
