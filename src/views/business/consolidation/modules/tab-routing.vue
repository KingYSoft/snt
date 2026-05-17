<script setup lang="ts">
import { computed } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NDataTable, NEmpty } from 'naive-ui';
import { $t } from '@/locales';

const props = defineProps<{ inputData: Record<string, any> }>();

const routingColumns: DataTableColumns<any> = [
  { title: $t('page.business.consolidation.routing.consolidationNumber'), key: 'consolidation_number', minWidth: 160 },
  { title: $t('page.business.consolidation.routing.routeType'), key: 'route_type', minWidth: 120 },
  { title: $t('page.business.consolidation.routing.vesselName'), key: 'vessel_name', minWidth: 160 },
  { title: $t('page.business.consolidation.routing.voyageNumber'), key: 'voyage_number', minWidth: 160 },
  { title: $t('page.business.consolidation.routing.portOfLoading'), key: 'port_of_loading', minWidth: 150 },
  { title: $t('page.business.consolidation.routing.portOfDischarge'), key: 'port_of_discharge', minWidth: 150 },
  { title: $t('page.business.consolidation.routing.etd'), key: 'jw_etd', minWidth: 120 },
  { title: $t('page.business.consolidation.routing.eta'), key: 'jw_eta', minWidth: 120 },
  { title: $t('page.business.consolidation.routing.atd'), key: 'jw_atd', minWidth: 120 },
  { title: $t('page.business.consolidation.routing.ata'), key: 'jw_ata', minWidth: 120 },
  { title: $t('page.business.consolidation.routing.carrier'), key: 'carrier', minWidth: 150 }
];

const routingList = computed<any[]>(() => props.inputData.transport_list || []);

function getRoutingRowKey(row: any) {
  return row.pk ?? row.id ?? row.consolidation_number ?? row.voyage_number ?? JSON.stringify(row);
}
</script>

<template>
  <div class="p-4">
    <NDataTable
      v-if="routingList.length > 0"
      :columns="routingColumns"
      :data="routingList"
      :bordered="true"
      size="small"
      :pagination="false"
      :row-key="getRoutingRowKey"
      :scroll-x="1550"
    />
    <NEmpty v-else />
  </div>
</template>
