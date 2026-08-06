<script setup lang="ts">
import { computed } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NDataTable, NEmpty } from 'naive-ui';
import { $t } from '@/locales';

const props = defineProps<{ inputData: Record<string, any> }>();

function formatRoutingDate(value: unknown) {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'string' && value.includes('T')) return value.split('T')[0];
  return String(value);
}

const routingColumns: DataTableColumns<any> = [
  { title: $t('page.business.consolidation.routing.consolidationNumber'), key: 'jk_uniqueconsignref', minWidth: 160 },
  { title: $t('page.business.consolidation.routing.routeType'), key: 'jw_transporttype', minWidth: 120 },
  {
    title: $t('page.business.consolidation.routing.vesselName'),
    key: 'jw_vessel',
    minWidth: 160,
    ellipsis: { tooltip: true }
  },
  {
    title: $t('page.business.consolidation.routing.voyageNumber'),
    key: 'jw_voyageflight',
    minWidth: 160,
    ellipsis: { tooltip: true }
  },
  {
    title: $t('page.business.consolidation.routing.portOfLoading'),
    key: 'jw_rl_nkloadport',
    minWidth: 150,
    ellipsis: { tooltip: true }
  },
  {
    title: $t('page.business.consolidation.routing.portOfDischarge'),
    key: 'jw_rl_nkdiscport',
    minWidth: 150,
    ellipsis: { tooltip: true }
  },
  {
    title: $t('page.business.consolidation.routing.etd'),
    key: 'jw_etd',
    minWidth: 120,
    render: row => formatRoutingDate(row.jw_etd)
  },
  {
    title: $t('page.business.consolidation.routing.eta'),
    key: 'jw_eta',
    minWidth: 120,
    render: row => formatRoutingDate(row.jw_eta)
  },
  {
    title: $t('page.business.consolidation.routing.atd'),
    key: 'jw_atd',
    minWidth: 120,
    render: row => formatRoutingDate(row.jw_atd)
  },
  {
    title: $t('page.business.consolidation.routing.ata'),
    key: 'jw_ata',
    minWidth: 120,
    render: row => formatRoutingDate(row.jw_ata)
  },
  {
    title: $t('page.business.consolidation.routing.carrier'),
    key: 'jw_oa_carrieraddress',
    minWidth: 150,
    ellipsis: { tooltip: true }
  }
];

const routingList = computed<any[]>(() => props.inputData.transport_list || []);

function getRoutingRowKey(row: any) {
  return row.pk ?? row.id ?? row.jk_uniqueconsignref ?? row.jw_voyageflight ?? JSON.stringify(row);
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
