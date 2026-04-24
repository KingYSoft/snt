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
  return String(value);
}

function formatParty(party: Record<string, any> | undefined) {
  if (!party || typeof party !== 'object') return '-';

  const parts = [
    party.add_address_name,
    party.add_contact,
    party.add_address1,
    party.add_address2,
    party.add_address3,
    party.add_city,
    party.add_state,
    party.add_postal_code,
    party.add_country_code,
    party.add_phone,
    party.add_email,
    party.e2_companyname,
    party.e2_contact
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' / ') : '-';
}

function getShipmentRowKey(row: any) {
  if (!row) return Math.random().toString(36);
  return row.pk ?? row.id ?? row.shp_consign_no ?? row.js_uniqueconsignref ?? JSON.stringify(row);
}

const basicItems = computed(() => {
  const data = detailData.value || {};
  return [
    { label: $t('page.business.consolidation.detail.consolidationNo'), value: data.jk_uniqueconsignref },
    { label: $t('page.business.consolidation.detail.consolStatus'), value: data.jk_consolstatus },
    { label: $t('page.business.consolidation.detail.phase'), value: data.jk_phase },
    { label: $t('page.business.consolidation.detail.transportMode'), value: data.jk_transportmode },
    { label: $t('page.business.consolidation.detail.consolMode'), value: data.jk_consolmode },
    { label: $t('page.business.consolidation.detail.releaseType'), value: data.jk_releasetype },
    { label: $t('page.business.consolidation.detail.serviceLevel'), value: data.jk_awbservicelevel },
    { label: $t('page.business.consolidation.detail.freightTerms'), value: data.jk_prepaidcollect },
    { label: $t('page.business.consolidation.detail.deliveryMode'), value: data.jk_agenttype }
  ];
});

const movementItems = computed(() => {
  const data = detailData.value || {};
  return [
    { label: $t('page.business.consolidation.detail.loadPort'), value: data.jk_rl_nkloadport },
    { label: $t('page.business.consolidation.detail.dischargePort'), value: data.jk_rl_nkdischargeport },
    { label: 'First Foreign Port', value: data.jk_rl_nkfirstforeignport },
    { label: 'Last Foreign Port', value: data.jk_rl_nklastforeignport },
    { label: 'Port of First Arrival', value: data.jk_rl_nkportoffirstarrival }
  ];
});

const referenceItems = computed(() => {
  const data = detailData.value || {};
  return [
    { label: $t('page.business.consolidation.detail.bolMasterBillNo'), value: data.jk_masterbillnum },
    { label: $t('page.business.consolidation.detail.carrierBookingRef'), value: data.jk_bookingreference },
    { label: $t('page.business.consolidation.detail.contractNo'), value: data.jk_carriercontractnumber },
    { label: 'Carrier Booking Office', value: data.jk_rl_nkcarrierbookingoffice },
    { label: $t('page.business.consolidation.detail.agentRef'), value: data.jk_agentsreference },
    { label: 'Co-load Booking Ref', value: data.jk_coloadbookingreference },
    { label: $t('page.business.consolidation.detail.coloadMbl'), value: data.jk_coloadmasterbill }
  ];
});

const dateItems = computed(() => {
  const data = detailData.value || {};
  return [
    { label: $t('page.business.consolidation.detail.shippedOnBoard'), value: data.jk_shippedonboarddate },
    { label: 'Master Bill Issue Date', value: data.jk_masterbillissuedate },
    { label: 'Consol Cut Off Date', value: data.jk_consolcutoffdate }
  ];
});

const totalItems = computed(() => {
  const data = detailData.value || {};
  return [
    { label: 'Consol Chargeable', value: data.jk_consolchargeable, unit: data.jk_consolchargeableunit || '' },
    { label: 'Corrected Weight', value: data.jk_correctedconsolweight, unit: data.jk_correctedconsolweightunit || '' },
    { label: 'Corrected Volume', value: data.jk_correctedconsolvolume, unit: data.jk_correctedconsolvolumeunit || '' }
  ];
});

const shipmentList = computed<any[]>(() => detailData.value?.shipments || []);

const shipmentColumns: DataTableColumns<any> = [
  { title: $t('page.business.consolidation.detail.shipmentNo'), key: 'shp_consign_no', minWidth: 140 },
  { title: $t('page.business.consolidation.detail.shipperName'), key: 'shipper_name', minWidth: 160 },
  { title: $t('page.business.consolidation.detail.consigneeName'), key: 'consignee_name', minWidth: 160 },
  { title: $t('page.business.consolidation.detail.origin'), key: 'shp_origin', minWidth: 120 },
  { title: $t('page.business.consolidation.detail.destination'), key: 'shp_destination', minWidth: 120 },
  { title: $t('page.business.consolidation.detail.packages'), key: 'shp_total_package_count', minWidth: 100 },
  { title: $t('page.business.consolidation.detail.grossWeight'), key: 'shp_actual_weight', minWidth: 120 },
  { title: $t('page.business.consolidation.detail.cbm'), key: 'shp_actual_volume', minWidth: 100 }
];
</script>

<template>
  <div class="flex-col-stretch gap-12px p-4">
    <NCard :title="$t('page.business.consolidation.section.basic')" size="small">
      <NDescriptions label-placement="left" :column="3" bordered>
        <NDescriptionsItem v-for="item in basicItems" :key="item.label" :label="item.label">
          {{ formatValue(item.value) }}
        </NDescriptionsItem>
      </NDescriptions>
    </NCard>

    <NCard :title="$t('page.business.consolidation.section.movement')" size="small">
      <NDescriptions label-placement="left" :column="3" bordered>
        <NDescriptionsItem v-for="item in movementItems" :key="item.label" :label="item.label">
          {{ formatValue(item.value) }}
        </NDescriptionsItem>
      </NDescriptions>
    </NCard>

    <NCard :title="$t('page.business.consolidation.section.references')" size="small">
      <NDescriptions label-placement="left" :column="3" bordered>
        <NDescriptionsItem v-for="item in referenceItems" :key="item.label" :label="item.label">
          {{ formatValue(item.value) }}
        </NDescriptionsItem>
      </NDescriptions>
    </NCard>

    <NCard :title="$t('page.business.consolidation.section.dates')" size="small">
      <NDescriptions label-placement="left" :column="3" bordered>
        <NDescriptionsItem v-for="item in dateItems" :key="item.label" :label="item.label">
          {{ formatValue(item.value) }}
        </NDescriptionsItem>
      </NDescriptions>
    </NCard>

    <NCard :title="$t('page.business.consolidation.section.parties')" size="small">
      <NDescriptions label-placement="left" :column="1" bordered>
        <NDescriptionsItem :label="$t('page.business.consolidation.detail.shipper')">
          {{ formatParty(detailData.shipper) }}
        </NDescriptionsItem>
        <NDescriptionsItem :label="$t('page.business.consolidation.detail.consignee')">
          {{ formatParty(detailData.consignee) }}
        </NDescriptionsItem>
        <NDescriptionsItem :label="$t('page.business.consolidation.detail.notifyParty')">
          {{ formatParty(detailData.notify_party) }}
        </NDescriptionsItem>
        <NDescriptionsItem :label="$t('page.business.consolidation.detail.overseasAgent')">
          {{ formatParty(detailData.overseas_agent) }}
        </NDescriptionsItem>
      </NDescriptions>
    </NCard>

    <NCard :title="$t('page.business.consolidation.section.totals')" size="small">
      <NGrid :cols="5" :x-gap="12">
        <NGi v-for="item in totalItems" :key="item.label">
          <div class="rounded-8px border border-[#e5e7eb] px-12px py-10px text-center">
            <div class="text-12px text-gray-500">{{ item.label }}</div>
            <div class="mt-6px text-18px font-600">
              {{ formatValue(item.value) }}
              <span v-if="item.unit" class="ml-4px text-12px text-gray-500">{{ item.unit }}</span>
            </div>
          </div>
        </NGi>
      </NGrid>
    </NCard>

    <NCard :title="$t('page.business.consolidation.section.shipments')" size="small">
      <NDataTable
        v-if="shipmentList.length > 0"
        :columns="shipmentColumns"
        :data="shipmentList"
        :bordered="true"
        size="small"
        :pagination="false"
        :row-key="getShipmentRowKey"
        :scroll-x="1000"
      />
      <NEmpty v-else />
    </NCard>
  </div>
</template>
