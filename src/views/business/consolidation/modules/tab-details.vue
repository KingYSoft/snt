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

function formatFlag(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  return Number(value) === 1 ? 'Yes' : 'No';
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
    { label: 'Master Bill No. (No SCAC)', value: data.jk_masterbillnumnoscac },
    { label: $t('page.business.consolidation.detail.carrierBookingRef'), value: data.jk_bookingreference },
    { label: $t('page.business.consolidation.detail.contractNo'), value: data.jk_carriercontractnumber },
    { label: 'Carrier Booking Office', value: data.jk_rl_nkcarrierbookingoffice },
    { label: $t('page.business.consolidation.detail.agentRef'), value: data.jk_agentsreference },
    { label: 'Customs Ref', value: data.jk_customsreference },
    { label: 'Master Bill Issue Place', value: data.jk_rl_nkmasterbillissueplace },
    { label: 'Shipping Line Address', value: data.jk_oa_shippinglineaddress },
    { label: 'Allocation Line', value: data.jk_rca_allocationline },
    { label: 'Co-load Booking Ref', value: data.jk_coloadbookingreference },
    { label: $t('page.business.consolidation.detail.coloadMbl'), value: data.jk_coloadmasterbill }
  ];
});

const dateItems = computed(() => {
  const data = detailData.value || {};
  return [
    { label: $t('page.business.consolidation.detail.shippedOnBoard'), value: data.jk_shippedonboarddate },
    { label: 'Master Bill Issue Date', value: data.jk_masterbillissuedate },
    { label: 'Consol Cut Off Date', value: data.jk_consolcutoffdate },
    { label: 'Date First Foreign Port', value: data.jk_datefirstforeignport },
    { label: 'Date Last Foreign Port', value: data.jk_datelastforeignport },
    { label: 'Date Port of First Arrival', value: data.jk_dateportoffirstarrival },
    { label: 'Pack Depot Dispatch Requested', value: data.jk_packdepotdispatchrequested },
    { label: 'Pack Depot Receipt Requested', value: data.jk_packdepotreceiptrequested },
    { label: 'Unpack Depot Dispatch Requested', value: data.jk_unpackdepotdispatchrequested },
    { label: 'Unpack Depot Receipt Requested', value: data.jk_unpackdepotreceiptrequested }
  ];
});

const totalItems = computed(() => {
  const data = detailData.value || {};
  return [
    { label: 'Consol Chargeable', value: data.jk_consolchargeable, unit: data.jk_totalshipmentchargeableunit || '' },
    { label: 'Corrected Weight', value: data.jk_correctedconsolweight, unit: data.jk_correctedconsolweightunit || '' },
    { label: 'Corrected Volume', value: data.jk_correctedconsolvolume, unit: data.jk_correctedconsolvolumeunit || '' },
    { label: 'Total Shipment Count Check', value: formatFlag(data.jk_totalshipmentcountcheck) },
    { label: 'Total Shipment Gross Wt Check', value: formatFlag(data.jk_totalshipmentactweightcheck) },
    { label: 'Total Shipment Volume Check', value: formatFlag(data.jk_totalshipmentactvolumecheck) }
  ];
});

const controlItems = computed(() => {
  const data = detailData.value || {};
  return [
    { label: 'Screening Status', value: data.jk_screeningstatus },
    { label: 'Hazardous', value: formatFlag(data.jk_ishazardous) },
    { label: 'Requires Temperature Control', value: formatFlag(data.jk_requirestemperaturecontrol) },
    {
      label: 'Temperature Range',
      value:
        data.jk_requiredtemperatureminimum != null || data.jk_requiredtemperaturemaximum != null
          ? `${data.jk_requiredtemperatureminimum ?? '-'} ~ ${data.jk_requiredtemperaturemaximum ?? '-'} ${data.jk_requiredtemperatureunit || ''}`.trim()
          : '-'
    },
    { label: 'Has Dry Ice', value: formatFlag(data.jk_hasdryice) },
    { label: 'Dry Ice Quantity', value: data.jk_dryicequantity },
    {
      label: 'Dry Ice Weight',
      value:
        data.jk_dryiceweight != null
          ? `${data.jk_dryiceweight}${data.jk_dryiceweightunit ? ` ${data.jk_dryiceweightunit}` : ''}`
          : '-'
    },
    { label: 'Package Grouping', value: data.jk_packagegrouping }
  ];
});

const documentItems = computed(() => {
  const data = detailData.value || {};
  return [
    { label: 'MBL/AWB Charges Display', value: data.jk_mblawbchargesdisplay },
    { label: 'Electronic B/L Ref', value: data.jk_electronicbillofladingreference },
    { label: 'Electronic B/L Type', value: data.jk_electronicbillofladingtype },
    { label: 'Electronic B/L Terms', value: data.jk_electronicbillofladingterms },
    { label: 'Gateway Service Level', value: data.jk_rs_nkgatewayservicelevel },
    { label: 'Consol Commodity', value: data.jk_rh_nkconsolcommodity }
  ];
});

const partyItems = computed(() => {
  const data = detailData.value || {};
  return [
    { label: 'Local Agent', value: data.local_agent, isParty: true },
    { label: $t('page.business.consolidation.detail.overseasAgent'), value: data.overseas_agent, isParty: true },
    { label: 'Sending Forwarder Address', value: data.jk_oa_sendingforwarderaddress },
    { label: 'Receiving Forwarder Address', value: data.jk_oa_receivingforwarderaddress },
    { label: 'Creditor Address', value: data.jk_oa_creditoraddress },
    { label: 'Pack Depot Address', value: data.jk_oa_packdepotaddress },
    { label: 'Unpack Depot Address', value: data.jk_oa_unpackdepotaddress },
    { label: 'Departure CTO Address', value: data.jk_oa_departurectoaddress },
    { label: 'Arrival CTO Address', value: data.jk_oa_arrivalctoaddress },
    { label: 'Departure Pack CFS Transport Address', value: data.jk_oa_departurepackcfstransportaddress },
    { label: 'Arrival Unpack CFS Transport Address', value: data.jk_oa_arrivalunpackcfstransportaddress },
    { label: 'Empty Pickup Address', value: data.jk_oa_containeryardemptypickupaddress },
    { label: 'Empty Return Address', value: data.jk_oa_containeryardemptyreturnaddress }
  ];
});

const systemItems = computed(() => {
  const data = detailData.value || {};
  return [
    { label: 'Created By', value: data.jk_systemcreateuser },
    { label: 'Created Time', value: data.jk_systemcreatetimeutc },
    { label: 'Last Edited By', value: data.jk_systemlastedituser },
    { label: 'Last Edited Time', value: data.jk_systemlastedittimeutc },
    { label: 'Branch', value: data.jk_systemcreatebranch },
    { label: 'Department', value: data.jk_systemcreatedepartment },
    { label: 'Version', value: data.jk_autoversion }
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
      <NDescriptions label-placement="left" :column="2" bordered>
        <NDescriptionsItem v-for="item in partyItems" :key="item.label" :label="item.label">
          {{ item.isParty ? formatParty(item.value) : formatValue(item.value) }}
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

    <NCard title="Controls" size="small">
      <NDescriptions label-placement="left" :column="3" bordered>
        <NDescriptionsItem v-for="item in controlItems" :key="item.label" :label="item.label">
          {{ formatValue(item.value) }}
        </NDescriptionsItem>
      </NDescriptions>
    </NCard>

    <NCard title="Document" size="small">
      <NDescriptions label-placement="left" :column="3" bordered>
        <NDescriptionsItem v-for="item in documentItems" :key="item.label" :label="item.label">
          {{ formatValue(item.value) }}
        </NDescriptionsItem>
      </NDescriptions>
    </NCard>

    <NCard title="System" size="small">
      <NDescriptions label-placement="left" :column="3" bordered>
        <NDescriptionsItem v-for="item in systemItems" :key="item.label" :label="item.label">
          {{ formatValue(item.value) }}
        </NDescriptionsItem>
      </NDescriptions>
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
