<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import type { SelectOption } from 'naive-ui';
import { $t } from '@/locales';
import { useAppStore } from '@/store/modules/app';
import {
  normalizeExchangeRateRecord,
  queryExchangeRateList,
  type ExchangeRateQueryParams,
  type ExchangeRateRecord
} from '@/service/api/maintain/exchange-rate';
import { getExchangeRateColumns } from './modules/columns';

defineOptions({ name: 'PageMaintainExchangeRate' });

type FilterKey = keyof ExchangeRateQueryParams;

const appStore = useAppStore();

const filterKey = ref<FilterKey>('currencyFrom');
const filterValue = ref('');

const filterKeyOptions = computed<SelectOption[]>(() => [
  { label: $t('page.maintain.exchangeRate.filterCurrencyFrom'), value: 'currencyFrom' },
  { label: $t('page.maintain.exchangeRate.filterCurrencyTo'), value: 'currencyTo' },
  { label: $t('page.maintain.exchangeRate.filterPeriod'), value: 'period' }
]);

const columns = computed(() => getExchangeRateColumns(appStore.locale));

const rows = ref<ExchangeRateRecord[]>([]);
const loading = ref(false);

const pagination = reactive({
  pageSize: 50,
  showSizePicker: true,
  pageSizes: [20, 50, 100, 200]
});

async function queryData(showError = false) {
  loading.value = true;
  try {
    const params: ExchangeRateQueryParams = {
      currencyFrom: '',
      currencyTo: '',
      period: ''
    };
    params[filterKey.value] = filterValue.value.trim();
    const res = await queryExchangeRateList(params);
    const list = Array.isArray(res?.data) ? res.data : [];
    rows.value = list.map((item: Record<string, any>, index: number) => normalizeExchangeRateRecord(item, index + 1));
  } catch {
    rows.value = [];
    if (showError) {
      window.$message?.error($t('page.maintain.exchangeRate.queryFailed'));
    }
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  void queryData(true);
}

function handleReset() {
  filterKey.value = 'currencyFrom';
  filterValue.value = '';
  void queryData(true);
}

void queryData();
</script>

<template>
  <div class="h-full flex-col-stretch gap-16px overflow-hidden">
    <NCard :title="$t('route.maintain_exchange-rate')" :bordered="false" class="flex-shrink-0">
      <NSpace align="center" :wrap="false">
        <NSelect v-model:value="filterKey" :options="filterKeyOptions" class="w-160px" />
        <NInput
          v-model:value="filterValue"
          :placeholder="$t('page.maintain.exchangeRate.filterPlaceholder')"
          clearable
          class="w-240px"
          @keyup.enter="handleSearch"
        />
        <NButton type="primary" :loading="loading" @click="handleSearch">
          {{ $t('common.search') }}
        </NButton>
        <NButton @click="handleReset">{{ $t('common.reset') }}</NButton>
      </NSpace>
    </NCard>

    <NCard :bordered="false" class="h-full flex-1-hidden" content-class="h-full flex flex-col overflow-hidden">
      <div class="min-h-0 flex-1 overflow-hidden">
        <NDataTable
          class="h-full"
          flex-height
          :columns="columns"
          :data="rows"
          :loading="loading"
          :pagination="pagination"
          :row-key="(row: ExchangeRateRecord) => row.index ?? 0"
          :scroll-x="1000"
          striped
        />
      </div>
    </NCard>
  </div>
</template>
