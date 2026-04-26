<script setup lang="ts">
import { computed } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NCard, NDataTable, NDescriptions, NDescriptionsItem, NEmpty, NGrid, NGi } from 'naive-ui';
import { $t } from '@/locales';

type DetailData = Record<string, any>;

const props = defineProps<{ inputData: DetailData }>();
const detailData = computed<DetailData>(() => props.inputData || {});

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  if (typeof value === 'string' && value.includes('T')) {
    return value.split('T')[0];
  }
  return String(value);
}

function getShipmentRowKey(row: any) {
  if (!row) return Math.random().toString(36);
  return row.pk ?? row.id ?? row.shp_consign_no ?? row.js_uniqueconsignref ?? JSON.stringify(row);
}

// --- Transport ---
const transportItems = computed(() => {
  const data = detailData.value || {};
  return [
    { label: 'Transport', value: data.jk_transportmode },
    { label: 'Container', value: data.jk_consolmode },
    { label: 'Consol Type', value: data.jk_releasetype },
    { label: 'Service Level', value: data.jk_awbservicelevel },
    { label: 'Freight Terms', value: data.jk_prepaidcollect },
    { label: 'BOL', value: data.jk_masterbillnum },
    { label: 'Contract No', value: data.jk_carriercontractnumber },
    { label: 'Delivery Mode', value: data.jk_agenttype }
  ];
});

// --- Routing ---
const routingItems = computed(() => {
  const data = detailData.value || {};
  return [
    { label: 'Origin', value: data.jk_rl_nkorigin },
    { label: 'Destination', value: data.jk_rl_nkdestination },
    { label: 'Place of Receipt', value: data.jk_rl_nkplaceofreceipt },
    { label: 'Place of Delivery', value: data.jk_rl_nkplaceofdelivery },
    { label: 'Load', value: data.jk_rl_nkloadport },
    { label: 'Discharge', value: data.jk_rl_nkdischargeport },
    { label: 'Vessel', value: data.jk_vessel },
    { label: 'Voyage', value: data.jk_voyage }
  ];
});

// --- Schedule & Agents ---
const scheduleItems = computed(() => {
  const data = detailData.value || {};
  return [
    { label: 'ETD', value: data.jk_e_dep },
    { label: 'ETA', value: data.jk_e_arv },
    { label: 'ATD', value: data.jk_actualdeparture },
    { label: 'ATA', value: data.jk_actualarrival },
    { label: 'Carrier', value: data.jk_rl_nkcarrier },
    { label: 'Carrier Bkg Ref', value: data.jk_bookingreference },
    { label: 'Booking Agent', value: data.jk_bookingagent },
    { label: 'Agent Ref', value: data.jk_agentsreference }
  ];
});

// --- Coload & VGM ---
const coloadVgmItems = computed(() => {
  const data = detailData.value || {};
  return [
    { label: 'Coload Agent', value: data.jk_coloadagent },
    { label: 'Coload MBL', value: data.jk_coloadmasterbill },
    { label: 'Coload Ref.', value: data.jk_coloadbookingreference },
    { label: 'Gate In', value: data.jk_gateindate },
    { label: 'On Board', value: data.jk_shippedonboarddate },
    {
      label: 'VGM Data',
      value: data.jk_vgmweight ? `${data.jk_vgmweight} ${data.jk_vgmweightunit || 'KG'}` : '-'
    }
  ];
});

// --- Shipments ---
const shipmentList = computed<any[]>(() => detailData.value?.shipments || []);

const shipmentColumns: DataTableColumns<any> = [
  {
    title: $t('page.business.consolidation.detail.shipmentNo'),
    key: 'shp_consign_no',
    minWidth: 140
  },
  {
    title: $t('page.business.consolidation.detail.origin'),
    key: 'shp_origin',
    minWidth: 100
  },
  {
    title: $t('page.business.consolidation.detail.destination'),
    key: 'shp_destination',
    minWidth: 100
  },
  { title: 'House Bill', key: 'shp_house_bill', minWidth: 120 },
  {
    title: $t('page.business.consolidation.detail.packages'),
    key: 'shp_total_package_count',
    minWidth: 100
  },
  {
    title: $t('page.business.consolidation.detail.shipperName'),
    key: 'shipperName',
    minWidth: 160
  },
  {
    title: $t('page.business.consolidation.detail.consigneeName'),
    key: 'consigneeName',
    minWidth: 160
  },
  {
    title: $t('page.business.consolidation.detail.grossWeight'),
    key: 'shp_actual_weight',
    minWidth: 120
  },
  { title: 'Volume Weight', key: 'shp_actual_volume', minWidth: 100 }
];

const shipmentTotals = computed(() => {
  const list = shipmentList.value;
  const data = detailData.value || {};
  return {
    count: list.length,
    packs: list.reduce((sum, r) => sum + (Number(r.shp_total_package_count) || 0), 0),
    gross: list.reduce((sum, r) => sum + (Number(r.shp_actual_weight) || 0), 0),
    volume: list.reduce((sum, r) => sum + (Number(r.shp_actual_volume) || 0), 0),
    chargeable: data.jk_consolchargeable || 0
  };
});
</script>

<template>
  <div class="flex-col-stretch gap-12px p-4">
    <!-- Row 1: Local Agent | Overseas Agent | Dates -->
    <NGrid :cols="1" :x-gap="12">
      <NGi>
        <NCard title="Dates" size="small">
          <NDescriptions label-placement="left" :column="4" bordered>
            <NDescriptionsItem label="SO Confirm">
              {{ formatValue(detailData.jk_consolcutoffdate) }}
            </NDescriptionsItem>
            <NDescriptionsItem label="VGM Cut-Off">
              {{ formatValue(detailData.jk_vgmcutoffdate) }}
            </NDescriptionsItem>
            <NDescriptionsItem label="Doc Cut-Off">
              {{ formatValue(detailData.jk_doccutoffdate) }}
            </NDescriptionsItem>
            <NDescriptionsItem label="Port Cargo Cut-Off">
              {{ formatValue(detailData.jk_portcargocutoffdate) }}
            </NDescriptionsItem>
          </NDescriptions>
        </NCard>
      </NGi>
    </NGrid>

    <!-- Row 2: Transport | Routing | Schedule & Agents | Coload & VGM -->
    <NGrid :cols="4" :x-gap="12">
      <NGi>
        <NCard title="Transport" size="small">
          <NDescriptions label-placement="left" :column="1" bordered>
            <NDescriptionsItem v-for="item in transportItems" :key="item.label" :label="item.label">
              {{ formatValue(item.value) }}
            </NDescriptionsItem>
          </NDescriptions>
        </NCard>
      </NGi>
      <NGi>
        <NCard title="Routing" size="small">
          <NDescriptions label-placement="left" :column="1" bordered>
            <NDescriptionsItem v-for="item in routingItems" :key="item.label" :label="item.label">
              {{ formatValue(item.value) }}
            </NDescriptionsItem>
          </NDescriptions>
        </NCard>
      </NGi>
      <NGi>
        <NCard title="Schedule & Agents" size="small">
          <NDescriptions label-placement="left" :column="1" bordered>
            <NDescriptionsItem v-for="item in scheduleItems" :key="item.label" :label="item.label">
              {{ formatValue(item.value) }}
            </NDescriptionsItem>
          </NDescriptions>
        </NCard>
      </NGi>
      <NGi>
        <NCard title="Coload & VGM" size="small">
          <NDescriptions label-placement="left" :column="1" bordered>
            <NDescriptionsItem v-for="item in coloadVgmItems" :key="item.label" :label="item.label">
              {{ formatValue(item.value) }}
            </NDescriptionsItem>
          </NDescriptions>
        </NCard>
      </NGi>
    </NGrid>

    <!-- Shipments Table -->
    <NCard :title="$t('page.business.consolidation.section.shipments')" size="small">
      <NDataTable
        v-if="shipmentList.length > 0"
        :columns="shipmentColumns"
        :data="shipmentList"
        :bordered="true"
        size="small"
        :pagination="false"
        :row-key="getShipmentRowKey"
        :scroll-x="1100"
      />
      <NEmpty v-else />
      <!-- Totals Summary -->
      <div v-if="shipmentList.length > 0" class="mt-8px flex gap-24px border-t border-[#e5e7eb] pt-8px text-14px">
        <span>
          Total:
          <strong>{{ shipmentTotals.count }}</strong>
          Ship.
        </span>
        <span>
          Packs:
          <strong>{{ shipmentTotals.packs }}</strong>
        </span>
        <span>
          Gross:
          <strong>{{ shipmentTotals.gross }}</strong>
          KG
        </span>
        <span>
          Volume:
          <strong>{{ shipmentTotals.volume }}</strong>
          M3
        </span>
        <span>
          Chargeable:
          <strong>{{ shipmentTotals.chargeable }}</strong>
          KGS
        </span>
      </div>
    </NCard>
  </div>
</template>
