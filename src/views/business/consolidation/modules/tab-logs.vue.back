<script setup lang="ts">
import { ref, watch } from 'vue';
import { NDataTable, NEmpty, NPagination } from 'naive-ui';
import { logsSearch } from '@/service/api/business/shipment';
import { $t } from '@/locales';

const props = defineProps<{ inputData: Record<string, any> }>();

const loading = ref(false);
const page = ref(1);
const pageSize = ref(50);
const total = ref(0);
const logList = ref<any[]>([]);

const columns = [
  { title: $t('page.business.consolidation.logs.eventCode'), key: 'event_code', width: 120 },
  { title: $t('page.business.consolidation.logs.eventTime'), key: 'event_time', width: 180 },
  { title: $t('page.business.consolidation.logs.postedTime'), key: 'posted_time', width: 180 },
  { title: $t('page.business.consolidation.logs.eventName'), key: 'event_name', minWidth: 150 },
  { title: $t('page.business.consolidation.logs.reference'), key: 'reference', width: 150 },
  { title: $t('page.business.consolidation.logs.eventDetails'), key: 'event_details', minWidth: 220 },
  { title: $t('page.business.consolidation.logs.createdBy'), key: 'created_by', width: 120 }
];

function getLogRowKey(row: any) {
  return row.id ?? row.pk ?? row.event_code ?? row.event_time ?? JSON.stringify(row);
}

async function loadLogs() {
  if (!props.inputData.pk) return;

  loading.value = true;
  try {
    const { data } = await logsSearch({
      SkipCount: (page.value - 1) * pageSize.value,
      MaxResultCount: pageSize.value,
      parent_table: 'CON',
      related_key: props.inputData.pk
    });
    logList.value = data?.items ?? [];
    total.value = data?.totalCount ?? 0;
  } catch {
    logList.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.inputData.pk,
  pk => {
    page.value = 1;
    if (pk) {
      loadLogs();
    } else {
      logList.value = [];
      total.value = 0;
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="p-4">
    <NDataTable
      v-if="logList.length > 0"
      :columns="columns"
      :data="logList"
      :bordered="true"
      size="small"
      :loading="loading"
      :pagination="false"
      :row-key="getLogRowKey"
    />
    <NEmpty v-else />
    <div v-if="total > pageSize" class="mt-12px flex justify-end">
      <NPagination v-model:page="page" v-model:page-size="pageSize" :item-count="total" @update:page="loadLogs" />
    </div>
  </div>
</template>
