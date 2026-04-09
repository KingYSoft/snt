<script setup lang="ts">
import { computed } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NCard, NDataTable, NDescriptions, NDescriptionsItem, NEmpty, NGrid, NGi } from 'naive-ui';
import { $t } from '@/locales';

type DetailData = Record<string, any>;

const props = defineProps<{ inputData: DetailData }>();
const detailData = computed<DetailData>(() => props.inputData ?? {});

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  return String(value);
}

function formatParty(party: Record<string, any> | undefined) {
  if (!party) return '-';

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
    party.add_email
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' / ') : '-';
}

function getShipmentRowKey(row: any) {
  return row.pk ?? row.id ?? row.shp_consign_no ?? JSON.stringify(row);
}

const basicItems = computed(() => [
  { label: $t('page.business.consolidation.detail.consolidationNo'), value: detailData.value.con_unique_consign_ref },
  { label: $t('page.business.consolidation.detail.consolStatus'), value: detailData.value.con_consol_status },
  { label: $t('page.business.consolidation.detail.phase'), value: detailData.value.con_phase },
  { label: $t('page.business.consolidation.detail.transportMode'), value: detailData.value.con_transport_mode },
  { label: $t('page.business.consolidation.detail.consolMode'), value: detailData.value.con_consol_mode },
  { label: $t('page.business.consolidation.detail.releaseType'), value: detailData.value.con_release_type },
  { label: $t('page.business.consolidation.detail.serviceLevel'), value: detailData.value.con_awb_service_level },
  { label: $t('page.business.consolidation.detail.freightTerms'), value: detailData.value.con_prepaid_collect },
  { label: $t('page.business.consolidation.detail.deliveryMode'), value: detailData.value.con_delivery_mode }
]);

const movementItems = computed(() => [
  { label: $t('page.business.consolidation.detail.origin'), value: detailData.value.con_origin },
  { label: $t('page.business.consolidation.detail.destination'), value: detailData.value.con_destination },
  { label: $t('page.business.consolidation.detail.placeOfReceipt'), value: detailData.value.con_place_of_receipt },
  { label: $t('page.business.consolidation.detail.placeOfDelivery'), value: detailData.value.con_place_of_delivery },
  { label: $t('page.business.consolidation.detail.loadPort'), value: detailData.value.con_load_port },
  { label: $t('page.business.consolidation.detail.dischargePort'), value: detailData.value.con_discharge_port },
  { label: $t('page.business.consolidation.detail.etd'), value: detailData.value.con_etd },
  { label: $t('page.business.consolidation.detail.eta'), value: detailData.value.con_eta },
  { label: $t('page.business.consolidation.detail.atd'), value: detailData.value.con_atd },
  { label: $t('page.business.consolidation.detail.ata'), value: detailData.value.con_ata }
]);

const referenceItems = computed(() => [
  { label: $t('page.business.consolidation.detail.bolMasterBillNo'), value: detailData.value.con_master_bill_num },
  { label: $t('page.business.consolidation.detail.carrierBookingRef'), value: detailData.value.con_booking_reference },
  { label: $t('page.business.consolidation.detail.contractNo'), value: detailData.value.con_carrier_contract_number },
  { label: $t('page.business.consolidation.detail.carrier'), value: detailData.value.con_carrier },
  { label: $t('page.business.consolidation.detail.vessel'), value: detailData.value.con_vessel },
  { label: $t('page.business.consolidation.detail.voyage'), value: detailData.value.con_voyage },
  { label: $t('page.business.consolidation.detail.bookingAgent'), value: detailData.value.con_booking_agent },
  { label: $t('page.business.consolidation.detail.coloadAgent'), value: detailData.value.con_coload_agent },
  { label: $t('page.business.consolidation.detail.coloadMbl'), value: detailData.value.con_co_load_master_bill },
  { label: $t('page.business.consolidation.detail.coloadRef'), value: detailData.value.con_coload_ref },
  { label: $t('page.business.consolidation.detail.agentRef'), value: detailData.value.con_agents_reference }
]);

const dateItems = computed(() => [
  { label: $t('page.business.consolidation.detail.soConfirm'), value: detailData.value.con_booking_confirm_date },
  { label: $t('page.business.consolidation.detail.shippedOnBoard'), value: detailData.value.con_shipped_on_board_date },
  { label: $t('page.business.consolidation.detail.vgmCutOff'), value: detailData.value.con_vgm_cut_off_date },
  { label: $t('page.business.consolidation.detail.docCutOff'), value: detailData.value.con_doc_cut_off_date },
  {
    label: $t('page.business.consolidation.detail.portCargoCutOff'),
    value: detailData.value.con_port_cargo_cut_off_date
  }
]);

const totalItems = computed(() => [
  { label: $t('page.business.consolidation.detail.shipCount'), value: detailData.value.con_total_shipmentcount },
  { label: $t('page.business.consolidation.detail.packs'), value: detailData.value.con_total_packs },
  {
    label: $t('page.business.consolidation.detail.gross'),
    value: detailData.value.con_total_gw,
    unit: $t('page.business.consolidation.detail.unitKg')
  },
  {
    label: $t('page.business.consolidation.detail.volume'),
    value: detailData.value.con_total_cbm,
    unit: $t('page.business.consolidation.detail.unitM3')
  },
  {
    label: $t('page.business.consolidation.detail.chargeable'),
    value: detailData.value.con_consol_chargeable,
    unit: $t('page.business.consolidation.detail.unitM3')
  }
]);

const shipmentList = computed<any[]>(() => detailData.value.shipments || []);

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
