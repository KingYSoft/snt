<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NDataTable, NEmpty, NSpin } from 'naive-ui';
import { $t } from '@/locales';
import { shipmentQueryConsolTransport, type ShipmentConsolTransportDto } from '@/service/api/business/shipment';

const props = defineProps<{ inputData: Record<string, any> }>();

const loading = ref(false);
const routingList = ref<ShipmentConsolTransportDto[]>([]);
const emptyKey = ref<'noData' | 'pkRequired' | 'empty' | 'loadFailed'>('noData');

function formatRoutingDate(value: unknown) {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'string' && value.includes('T')) return value.split('T')[0];
  return String(value);
}

const routingColumns = computed<DataTableColumns<ShipmentConsolTransportDto>>(() => [
  {
    title: $t('page.business.shipment.routing.consolidationNumber'),
    key: 'jk_uniqueconsignref',
    minWidth: 160,
    ellipsis: { tooltip: true }
  },
  { title: $t('page.business.shipment.routing.routeType'), key: 'jw_transporttype', minWidth: 120 },
  {
    title: $t('page.business.shipment.routing.vesselName'),
    key: 'jw_vessel',
    minWidth: 160,
    ellipsis: { tooltip: true }
  },
  {
    title: $t('page.business.shipment.routing.voyageNumber'),
    key: 'jw_voyageflight',
    minWidth: 140,
    ellipsis: { tooltip: true }
  },
  {
    title: $t('page.business.shipment.routing.portOfLoading'),
    key: 'jw_rl_nkloadport',
    minWidth: 150,
    ellipsis: { tooltip: true }
  },
  {
    title: $t('page.business.shipment.routing.portOfDischarge'),
    key: 'jw_rl_nkdiscport',
    minWidth: 150,
    ellipsis: { tooltip: true }
  },
  {
    title: $t('page.business.shipment.routing.etd'),
    key: 'jw_etd',
    minWidth: 120,
    render: row => formatRoutingDate(row.jw_etd)
  },
  {
    title: $t('page.business.shipment.routing.eta'),
    key: 'jw_eta',
    minWidth: 120,
    render: row => formatRoutingDate(row.jw_eta)
  },
  {
    title: $t('page.business.shipment.routing.atd'),
    key: 'jw_atd',
    minWidth: 120,
    render: row => formatRoutingDate(row.jw_atd)
  },
  {
    title: $t('page.business.shipment.routing.ata'),
    key: 'jw_ata',
    minWidth: 120,
    render: row => formatRoutingDate(row.jw_ata)
  },
  {
    title: $t('page.business.shipment.routing.carrier'),
    key: 'jw_oa_carrieraddressName',
    minWidth: 160,
    ellipsis: { tooltip: true }
  }
]);

async function loadRouting() {
  const shpPk = String(props.inputData.pk ?? '').trim();
  if (!shpPk) {
    routingList.value = [];
    emptyKey.value = 'pkRequired';
    return;
  }

  loading.value = true;
  emptyKey.value = 'noData';
  try {
    const { data } = await shipmentQueryConsolTransport({ shp_pk: shpPk });
    routingList.value = data?.list ?? [];
    if (!routingList.value.length) {
      emptyKey.value = 'empty';
    }
  } catch {
    routingList.value = [];
    emptyKey.value = 'loadFailed';
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.inputData.pk,
  () => {
    void loadRouting();
  },
  { immediate: true }
);

const hasRows = computed(() => routingList.value.length > 0);
const emptyDescription = computed(() => $t(`page.business.shipment.routing.${emptyKey.value}`));

function getRoutingRowKey(row: ShipmentConsolTransportDto) {
  return row.jw_pk || row.id || `${row.jk_uniqueconsignref ?? ''}-${row.jw_legorder ?? ''}`;
}

defineExpose({ loadRouting });
</script>

<template>
  <div class="p-4">
    <NSpin :show="loading">
      <NDataTable
        v-if="hasRows"
        :columns="routingColumns"
        :data="routingList"
        :bordered="true"
        size="small"
        :pagination="false"
        :row-key="getRoutingRowKey"
        :scroll-x="1550"
        striped
      />
      <NEmpty v-else :description="emptyDescription" />
    </NSpin>
  </div>
</template>
