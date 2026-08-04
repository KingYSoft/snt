<script setup lang="ts">
import { ref, watch } from 'vue';
import { NDataTable, NEmpty } from 'naive-ui';
import { edocSearch } from '@/service/api/business/shipment';
import { $t } from '@/locales';

const props = defineProps<{ inputData: Record<string, any> }>();

const loading = ref(false);
const docList = ref<any[]>([]);

const columns = [
  { title: $t('page.business.consolidation.edoc.fileName'), key: 'file_name', minWidth: 220 },
  { title: $t('page.business.consolidation.edoc.fileType'), key: 'file_type', minWidth: 120 },
  { title: $t('page.business.consolidation.edoc.refNo'), key: 'ref_no', minWidth: 160 },
  { title: $t('page.business.consolidation.edoc.receivedTime'), key: 'received_time', minWidth: 180 }
];

function getDocRowKey(row: any) {
  return row.id ?? row.pk ?? row.file_name ?? row.ref_no ?? JSON.stringify(row);
}

async function loadDocs() {
  if (!props.inputData.pk) return;

  loading.value = true;
  try {
    const { data } = await edocSearch({
      parent_table: 'CON',
      related_key: props.inputData.pk
    });
    docList.value = data?.items ?? data?.list ?? [];
  } catch {
    docList.value = [];
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.inputData.pk,
  pk => {
    if (pk) {
      loadDocs();
    } else {
      docList.value = [];
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="p-4">
    <NDataTable
      v-if="docList.length > 0"
      :columns="columns"
      :data="docList"
      :bordered="true"
      size="small"
      :loading="loading"
      :pagination="false"
      :row-key="getDocRowKey"
    />
    <NEmpty v-else />
  </div>
</template>
