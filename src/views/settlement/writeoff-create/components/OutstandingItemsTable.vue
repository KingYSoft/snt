<script setup lang="ts">
import { NButton, NSpace, NSelect, NInput, NDataTable, NSpin } from 'naive-ui';
import { useI18n } from 'vue-i18n';
import type { OutstandingItem } from '@/service/api/business/settlement';
import { useOutstandingColumns } from '../modules/outstandingColumns';

defineOptions({ name: 'OutstandingItemsTable' });

const { t } = useI18n();

interface Props {
  items: OutstandingItem[];
  loading: boolean;
  checkedKeys: Array<string | number>;
  searchKey: string;
  searchValue: string;
  feeCurrencyFilter: string;
  currencyOptions: Array<{ label: string; value: string }>;
}

defineProps<Props>();

const emit = defineEmits<{
  'update:checkedKeys': [keys: Array<string | number>];
  'update:searchKey': [key: string];
  'update:searchValue': [value: string];
  'update:feeCurrencyFilter': [value: string];
  search: [];
  reset: [];
  verification: [];
  autoMatch: [];
  setValue: [];
  toggleShowCheckedOnly: [];
}>();

const { columns } = useOutstandingColumns();

const searchFieldOptions = [
  { label: t('page.settlement.writeoff.create.jobNo'), value: 'jobNo' },
  { label: t('page.settlement.writeoff.create.taxInvoiceNo'), value: 'taxInvoiceNo' },
  { label: t('page.settlement.writeoff.create.billNo'), value: 'billNo' },
  { label: t('page.settlement.writeoff.create.fee'), value: 'fee' }
];

function handleCheck(rowKeys: Array<string | number>) {
  emit('update:checkedKeys', rowKeys);
}
</script>

<template>
  <NSpace vertical :size="12" class="w-full mb-8px">
    <!-- 搜索和操作栏 -->
    <NSpace :size="8">
      <NSelect
        :value="searchKey"
        :options="searchFieldOptions"
        style="width: 150px"
        @update:value="$emit('update:searchKey', $event)"
      />
      <NInput
        :value="searchValue"
        :placeholder="t('page.settlement.writeoff.create.pleaseInput')"
        clearable
        style="width: 200px"
        @keyup.enter="$emit('search')"
        @update:value="$emit('update:searchValue', $event)"
      />
      <NSelect
        :value="feeCurrencyFilter"
        :options="currencyOptions"
        :placeholder="t('page.settlement.writeoff.create.feeCurrency')"
        clearable
        style="width: 150px"
        @update:value="$emit('update:feeCurrencyFilter', $event)"
      />
      <NButton @click="$emit('search')">{{ t('page.settlement.writeoff.create.search') }}</NButton>
      <NButton @click="$emit('reset')">{{ t('page.settlement.writeoff.create.reset') }}</NButton>
      <NButton @click="$emit('toggleShowCheckedOnly')">
        {{ t('page.settlement.writeoff.create.showCheckedOnly') }}
      </NButton>
    </NSpace>
    <NSpace :size="8">
      <NButton type="primary" ghost @click="$emit('verification')">
        {{ t('page.settlement.writeoff.create.verificationByFeeDetails') }}
      </NButton>
      <NButton @click="$emit('autoMatch')">{{ t('page.settlement.writeoff.create.autoMatch') }}</NButton>
      <NButton @click="$emit('setValue')">{{ t('page.settlement.writeoff.create.setValue') }}</NButton>
    </NSpace>
  </NSpace>

  <!-- 表格 -->
  <NSpin :show="loading">
    <NDataTable
      :columns="columns"
      :data="items"
      :row-key="(row: OutstandingItem) => row.id"
      :checked-row-keys="checkedKeys"
      :max-height="250"
      :scroll-x="1400"
      @update:checked-row-keys="handleCheck"
    />
  </NSpin>
</template>
