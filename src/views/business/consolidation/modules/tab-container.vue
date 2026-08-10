<script setup lang="ts">
import { computed } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NDataTable, NEmpty } from 'naive-ui';
import { $t } from '@/locales';

const props = defineProps<{ inputData: Record<string, any> }>();

const containerColumns: DataTableColumns<any> = [
  { title: $t('page.business.consolidation.container.containerType'), key: 'container_type_code', minWidth: 120 },
  { title: $t('page.business.consolidation.container.containerNo'), key: 'jc_containernum', minWidth: 140 },
  { title: $t('page.business.consolidation.container.sealNo'), key: 'jc_sealnum', minWidth: 120 },
  { title: $t('page.business.consolidation.container.grossWeight'), key: 'jc_grossweight', minWidth: 120 },
  { title: $t('page.business.consolidation.container.cbm'), key: 'total_volume', minWidth: 100 },
  { title: $t('page.business.consolidation.container.packages'), key: 'pack_count', minWidth: 100 },
  { title: $t('page.business.consolidation.container.packType'), key: 'pack_type', minWidth: 100 },
  { title: $t('page.business.consolidation.container.description'), key: 'goods_description', minWidth: 160 }
];

const containerList = computed<any[]>(() => props.inputData.containers || []);

function getContainerRowKey(row: any) {
  return row.pk ?? row.id ?? row.jc_containernum ?? JSON.stringify(row);
}
</script>

<template>
  <div class="p-4">
    <NDataTable
      v-if="containerList.length > 0"
      :columns="containerColumns"
      :data="containerList"
      :bordered="true"
      size="small"
      :pagination="false"
      :row-key="getContainerRowKey"
      :scroll-x="1100"
    />
    <NEmpty v-else />
  </div>
</template>
