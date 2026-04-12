<script setup lang="ts">
import { computed } from 'vue';
import { NPopover, NInput, NDataTable, NSpin, NPagination } from 'naive-ui';
import { useI18n } from 'vue-i18n';
import type { CompanyOption } from '../composables/useCompanySearch';
import { useCompanyColumns } from '../modules/companyColumns';

defineOptions({ name: 'CompanySelector' });

const { t } = useI18n();

interface Props {
  companyOptions?: CompanyOption[];
  companyLoading?: boolean;
  companyPagination: { page: number; pageSize: number; itemCount: number };
  searchQuery?: string;
}

const props = withDefaults(defineProps<Props>(), {
  companyOptions: () => [],
  companyLoading: false,
  searchQuery: ''
});

const showDropdownModel = defineModel<boolean>('showDropdown', { default: false });

const emit = defineEmits<{
  search: [query: string];
  select: [company: CompanyOption];
  pageChange: [page: number];
}>();

const { columns } = useCompanyColumns();

const tableData = computed(() => {
  return props.companyOptions.map((opt, index) => ({
    index: index + 1,
    id: opt.value,
    name: opt.label,
    nameEnglish: opt.data?.nameEnglish || opt.label,
    abbreviation: opt.data?.abbreviation || '',
    code: opt.data?.code || ''
  }));
});

function getRowProps(row: any) {
  return {
    style: 'cursor: pointer;',
    onClick: () => {
      const company = props.companyOptions.find(c => c.value === row.id);
      if (company) {
        handleSelectCompany(company);
      }
    }
  };
}

function handleSearch(query: string) {
  emit('search', query);
}

function handleSelectCompany(company: CompanyOption) {
  emit('select', company);
  setTimeout(() => {
    showDropdownModel.value = false;
  }, 0);
}

function handlePageChange(page: number) {
  emit('pageChange', page);
}
</script>

<template>
  <NPopover v-model:show="showDropdownModel" trigger="manual" placement="bottom-start" :width="700" :show-arrow="false">
    <template #trigger>
      <NInput
        :value="searchQuery"
        :placeholder="t('page.settlement.writeoff.create.selectCompany')"
        clearable
        @update:value="handleSearch"
        @focus="showDropdownModel = true"
      >
        <template #suffix>
          <span class="text-gray cursor-pointer" @click.stop="showDropdownModel = !showDropdownModel">▼</span>
        </template>
      </NInput>
    </template>
    <div class="company-dropdown">
      <NSpin :show="companyLoading">
        <NDataTable
          :columns="columns"
          :data="tableData"
          :max-height="300"
          :scroll-x="800"
          size="small"
          :row-props="getRowProps"
        />
      </NSpin>
      <div v-if="companyOptions.length === 0 && !companyLoading" class="text-center p-16px text-gray">
        {{ t('page.settlement.writeoff.create.searchCompany') }}
      </div>
      <div v-if="companyPagination.itemCount > 0" class="flex justify-between items-center p-8px border-t">
        <span class="text-sm text-gray">
          {{ t('page.settlement.writeoff.create.totalRecords', { count: companyPagination.itemCount }) }}
        </span>
        <NPagination
          :page="companyPagination.page"
          :page-size="companyPagination.pageSize"
          :item-count="companyPagination.itemCount"
          size="small"
          show-size-picker
          :page-sizes="[10, 20, 50, 100]"
          @update:page="handlePageChange"
        />
      </div>
    </div>
  </NPopover>
</template>
