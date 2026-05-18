<script setup lang="ts">
import { computed } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NDataTable, NEmpty } from 'naive-ui';
import { $t } from '@/locales';

const props = defineProps<{ inputData: Record<string, any> }>();

const containerColumns: DataTableColumns<any> = [
  { title: $t('page.business.consolidation.container.containerType'), key: 'jc_f3_nkpacktype', minWidth: 120 },
  { title: $t('page.business.consolidation.container.count'), key: 'ctr_count', width: 80 },
  { title: $t('page.business.consolidation.container.containerNo'), key: 'jc_containernum', minWidth: 140 },
  { title: $t('page.business.consolidation.container.sealNo'), key: 'jc_sealnum', minWidth: 120 },
  { title: $t('page.business.consolidation.container.soc'), key: 'ctr_is_soc', width: 80 },
  { title: $t('page.business.consolidation.container.commodity'), key: 'pac_commodity', minWidth: 140 },
  { title: $t('page.business.consolidation.container.grossWeight'), key: 'pac_gross_weight', minWidth: 120 },
  { title: $t('page.business.consolidation.container.cbm'), key: 'pac_actual_volume', minWidth: 100 },
  { title: $t('page.business.consolidation.container.packages'), key: 'pac_package_count', minWidth: 100 },
  { title: $t('page.business.consolidation.container.packType'), key: 'pac_pack_type', minWidth: 100 },
  { title: $t('page.business.consolidation.container.description'), key: 'pac_description', minWidth: 160 }
];

const containerList = computed<any[]>(() => props.inputData.containers || []);

function getContainerRowKey(row: any) {
  return row.pk ?? row.id ?? row.ctr_container_num ?? JSON.stringify(row);
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
      :scroll-x="1350"
    />
    <NEmpty v-else />
  </div>
</template>
