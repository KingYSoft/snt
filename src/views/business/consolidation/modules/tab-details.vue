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
    { label: $t('page.business.consolidation.detail.transport'), value: data.jk_transportmode },
    { label: $t('page.business.consolidation.detail.container'), value: data.jk_consolmode },
    { label: $t('page.business.consolidation.detail.consolType'), value: data.jk_releasetype },
    { label: $t('page.business.consolidation.detail.serviceLevel'), value: data.jk_awbservicelevel },
    { label: $t('page.business.consolidation.detail.freightTerms'), value: data.jk_prepaidcollect },
    { label: $t('page.business.consolidation.detail.bolMasterBillNo'), value: data.jk_masterbillnum },
    { label: $t('page.business.consolidation.detail.contractNo'), value: data.jk_carriercontractnumber },
    { label: $t('page.business.consolidation.detail.deliveryMode'), value: data.jk_agenttype }
  ];
});

// --- Routing ---
const routingItems = computed(() => {
  const data = detailData.value || {};
  return [
    { label: $t('page.business.consolidation.detail.origin'), value: data.jk_rl_nkorigin },
    { label: $t('page.business.consolidation.detail.destination'), value: data.jk_rl_nkdestination },
    { label: $t('page.business.consolidation.detail.placeOfReceipt'), value: data.jk_rl_nkplaceofreceipt },
    { label: $t('page.business.consolidation.detail.placeOfDelivery'), value: data.jk_rl_nkplaceofdelivery },
    { label: $t('page.business.consolidation.detail.load'), value: data.jk_rl_nkloadport },
    { label: $t('page.business.consolidation.detail.discharge'), value: data.jk_rl_nkdischargeport },
    { label: $t('page.business.consolidation.detail.vessel'), value: data.jk_vessel },
    { label: $t('page.business.consolidation.detail.voyage'), value: data.jk_voyage }
  ];
});

// --- Schedule & Agents ---
const scheduleItems = computed(() => {
  const data = detailData.value || {};
  return [
    { label: $t('page.business.consolidation.detail.etd'), value: data.jk_e_dep },
    { label: $t('page.business.consolidation.detail.eta'), value: data.jk_e_arv },
    { label: $t('page.business.consolidation.detail.atd'), value: data.jk_actualdeparture },
    { label: $t('page.business.consolidation.detail.ata'), value: data.jk_actualarrival },
    { label: $t('page.business.consolidation.detail.carrier'), value: data.jk_rl_nkcarrier },
    { label: $t('page.business.consolidation.detail.carrierBookingRef'), value: data.jk_bookingreference },
    { label: $t('page.business.consolidation.detail.bookingAgent'), value: data.jk_bookingagent },
    { label: $t('page.business.consolidation.detail.agentRef'), value: data.jk_agentsreference }
  ];
});

// --- Coload & VGM ---
const coloadVgmItems = computed(() => {
  const data = detailData.value || {};
  return [
    { label: $t('page.business.consolidation.detail.coloadAgent'), value: data.jk_coloadagent },
    { label: $t('page.business.consolidation.detail.coloadMbl'), value: data.jk_coloadmasterbill },
    { label: $t('page.business.consolidation.detail.coloadRef'), value: data.jk_coloadbookingreference },
    { label: $t('page.business.consolidation.detail.gateIn'), value: data.jk_gateindate },
    { label: $t('page.business.consolidation.detail.onBoard'), value: data.jk_shippedonboarddate },
    {
      label: $t('page.business.consolidation.detail.vgmData'),
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
  { title: $t('page.business.consolidation.detail.houseBill'), key: 'shp_house_bill', minWidth: 120 },
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
  { title: $t('page.business.consolidation.detail.volumeWeight'), key: 'shp_actual_volume', minWidth: 100 }
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
        <NCard :title="$t('page.business.consolidation.detail.dates')" size="small">
          <NDescriptions label-placement="left" :column="4" bordered>
            <NDescriptionsItem :label="$t('page.business.consolidation.detail.soConfirm')">
              {{ formatValue(detailData.jk_consolcutoffdate) }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.business.consolidation.detail.vgmCutOff')">
              {{ formatValue(detailData.jk_vgmcutoffdate) }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.business.consolidation.detail.docCutOff')">
              {{ formatValue(detailData.jk_doccutoffdate) }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.business.consolidation.detail.portCargoCutOff')">
              {{ formatValue(detailData.jk_portcargocutoffdate) }}
            </NDescriptionsItem>
          </NDescriptions>
        </NCard>
      </NGi>
    </NGrid>

    <!-- Row 2: Transport | Routing | Schedule & Agents | Coload & VGM -->
    <NGrid :cols="4" :x-gap="12">
      <NGi>
        <NCard :title="$t('page.business.consolidation.detail.transport')" size="small">
          <NDescriptions label-placement="left" :column="1" bordered>
            <NDescriptionsItem v-for="item in transportItems" :key="item.label" :label="item.label">
              {{ formatValue(item.value) }}
            </NDescriptionsItem>
          </NDescriptions>
        </NCard>
      </NGi>
      <NGi>
        <NCard :title="$t('page.business.consolidation.tab.routing')" size="small">
          <NDescriptions label-placement="left" :column="1" bordered>
            <NDescriptionsItem v-for="item in routingItems" :key="item.label" :label="item.label">
              {{ formatValue(item.value) }}
            </NDescriptionsItem>
          </NDescriptions>
        </NCard>
      </NGi>
      <NGi>
        <NCard :title="$t('page.business.consolidation.detail.scheduleAgents')" size="small">
          <NDescriptions label-placement="left" :column="1" bordered>
            <NDescriptionsItem v-for="item in scheduleItems" :key="item.label" :label="item.label">
              {{ formatValue(item.value) }}
            </NDescriptionsItem>
          </NDescriptions>
        </NCard>
      </NGi>
      <NGi>
        <NCard :title="$t('page.business.consolidation.detail.coloadVgm')" size="small">
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
          {{ $t('page.business.consolidation.detail.total') }}:
          <strong>{{ shipmentTotals.count }}</strong>
          {{ $t('page.business.consolidation.detail.shipCount') }}
        </span>
        <span>
          {{ $t('page.business.consolidation.detail.packs') }}:
          <strong>{{ shipmentTotals.packs }}</strong>
        </span>
        <span>
          {{ $t('page.business.consolidation.detail.gross') }}:
          <strong>{{ shipmentTotals.gross }}</strong>
          KG
        </span>
        <span>
          {{ $t('page.business.consolidation.detail.volume') }}:
          <strong>{{ shipmentTotals.volume }}</strong>
          M3
        </span>
        <span>
          {{ $t('page.business.consolidation.detail.chargeable') }}:
          <strong>{{ shipmentTotals.chargeable }}</strong>
          KGS
        </span>
      </div>
    </NCard>
  </div>
</template>
