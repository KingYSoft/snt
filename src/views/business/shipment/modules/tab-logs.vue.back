<script setup lang="ts">
import { ref, watch } from 'vue';
import { NDataTable, NPagination } from 'naive-ui';
import { logsSearch } from '@/service/api/business/shipment';

const props = defineProps<{ inputData: Record<string, any> }>();

const logList = ref<any[]>([]);
const loading = ref(false);
const page = ref(1);
const pageSize = ref(50);
const total = ref(0);

const columns = [
  { title: 'Event Code', key: 'event_code', width: 120 },
  { title: 'Event Time', key: 'event_time', width: 180 },
  { title: 'Posted Time', key: 'posted_time', width: 180 },
  { title: 'Event Name', key: 'event_name', minWidth: 150 },
  { title: 'Reference', key: 'reference', width: 150 },
  { title: 'Event Details', key: 'event_details', minWidth: 200 },
  { title: 'Created By', key: 'created_by', width: 120 }
];

async function loadLogs() {
  if (!props.inputData.pk) return;
  try {
    loading.value = true;
    const { data } = await logsSearch({
      SkipCount: (page.value - 1) * pageSize.value,
      MaxResultCount: pageSize.value,
      parent_table: 'SHP',
      related_key: props.inputData.pk
    });
    if (data) {
      logList.value = data.items ?? [];
      total.value = data.totalCount ?? 0;
    }
  } catch {
    // ignore
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.inputData.pk,
  pk => {
    if (pk) loadLogs();
  },
  { immediate: true }
);
</script>

<template>
  <div class="p-4">
    <NDataTable
      :columns="columns"
      :data="logList"
      :bordered="true"
      size="small"
      :loading="loading"
      :row-key="(row: any) => row.id"
    />
    <div class="mt-12px flex justify-end">
      <NPagination v-model:page="page" v-model:page-size="pageSize" :item-count="total" @update:page="loadLogs" />
    </div>
  </div>
</template>
