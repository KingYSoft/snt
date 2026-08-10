<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */
import { computed, h, ref, watch } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { useRouter } from 'vue-router';
import {
  NAutoComplete,
  NButton,
  NDataTable,
  NDatePicker,
  NDivider,
  NForm,
  NFormItemGi,
  NGrid,
  NGi,
  NInput,
  NInputNumber,
  NModal,
  NSelect,
  NSpace
} from 'naive-ui';
import { consolidationMatchingShipments } from '@/service/api/business/consolidation';
import { shipmentQueryPortCode } from '@/service/api/business/shipment';
import { queryServiceLevelPage } from '@/service/api/maintain/service-level';

type DetailData = Record<string, any>;

const props = defineProps<{ inputData: DetailData }>();
const emit = defineEmits<{
  'update:inputData': [value: DetailData];
}>();

const router = useRouter();

const formData = computed({
  get: () => props.inputData || {},
  set: val => emit('update:inputData', val)
});

// --- Port query ---
const queryPortList = ref<Array<{ rl_code: string; rl_port_name: string }>>([]);
let portSearchTimer: ReturnType<typeof setTimeout> | null = null;

async function queryPort(search: string) {
  if (portSearchTimer) clearTimeout(portSearchTimer);
  portSearchTimer = setTimeout(async () => {
    if (!search) {
      queryPortList.value = [];
      return;
    }
    try {
      const { data } = await shipmentQueryPortCode({ query: search });
      if (data) {
        queryPortList.value = data.list ?? [];
      }
    } catch {
      // ignore
    }
  }, 300);
}

const portOptions = computed(() => {
  return queryPortList.value.map(item => ({
    label: `${item.rl_code} - ${item.rl_port_name}`,
    value: item.rl_code
  }));
});

// --- Service Level options ---
const serviceLevelOptions = ref<Array<{ label: string; value: string }>>([]);

async function fetchServiceLevelOptions(query?: string) {
  try {
    const { data } = await queryServiceLevelPage({
      skipCount: 0,
      maxResultCount: 100,
      filters: query ? [{ key: 'code', op: 'Contain', val: query }] : []
    });
    if (data?.items) {
      serviceLevelOptions.value = data.items.map((item: any) => ({
        label: item.code ? (item.desc ? `${item.code} - ${item.desc}` : item.code) : '',
        value: item.code ?? ''
      }));
    }
  } catch {
    serviceLevelOptions.value = [];
  }
}

// fetchServiceLevelOptions();

// --- Matching Shipments Dialog ---
const matchingDialogVisible = ref(false);
const matchingShipments = ref<any[]>([]);
const selectedMatchingShipments = ref<string[]>([]);
const matchingFilter = ref({ shipment_number: '' });

// Shipment list
const shipmentList = ref<any[]>([]);
const selectedDetachShipments = ref<string[]>([]);
const pendingAttachShipments = ref<string[]>([]);
const pendingDetachShipments = ref<string[]>([]);
const originalShipmentPks = ref<string[]>([]);

// Transport options
const transportOptions = [
  { label: 'AIR', value: 'AIR' },
  { label: 'SEA', value: 'SEA' }
];

const getConsolModeOptions = computed(() => {
  const mode = formData.value.jk_transportmode;
  if (mode === 'AIR') {
    return [{ label: 'LOOSE', value: 'LOOSE' }];
  }
  return [
    { label: 'FCL', value: 'FCL' },
    { label: 'LCL', value: 'LCL' },
    { label: 'LSE', value: 'LSE' }
  ];
});

const consolTypeOptions = [
  { label: 'DRT - Direct', value: 'DRT' },
  { label: 'CLD - Co-Load', value: 'CLD' },
  { label: 'AGT - Agent', value: 'AGT' },
  { label: 'CHT - Charter', value: 'CHT' },
  { label: 'COU - Courier', value: 'COU' },
  { label: 'OTH - Other', value: 'OTH' }
];

const freightTermsOptions = [
  { label: 'PP', value: 'PP' },
  { label: 'CC', value: 'CC' }
];

const deliveryModeOptions = [
  { label: 'CY/CY', value: 'CY/CY' },
  { label: 'CFS/CFS', value: 'CFS/CFS' },
  { label: 'CY/CFS', value: 'CY/CFS' },
  { label: 'CFS/CY', value: 'CFS/CY' }
];

const vgmUnitOptions = [{ label: 'KG', value: 'KG' }];

// --- Totals ---
function calculateTotals() {
  const list = shipmentList.value;
  const d = formData.value;
  d.jk_total_shipmentcount = list.length;
  d.jk_total_packs = list.reduce((sum, r) => sum + (Number(r.js_outerpacks) || 0), 0);
  d.jk_total_gw = list.reduce((sum, r) => sum + (Number(r.js_actualweight) || 0), 0);
  d.jk_total_cbm = list.reduce((sum, r) => sum + (Number(r.shp_actual_volume) || 0), 0);
  if (!d.jk_consolchargeable) {
    d.jk_consolchargeable = d.jk_total_cbm;
  }
}

const shipmentTotals = computed(() => {
  const d = formData.value;
  return {
    count: d.jk_total_shipmentcount || 0,
    packs: d.jk_total_packs || 0,
    gross: d.jk_total_gw || 0,
    volume: d.jk_total_cbm || 0,
    chargeable: d.jk_consolchargeable || 0
  };
});

// --- Watch shipments from inputData ---
watch(
  () => formData.value.shps,
  newShipments => {
    if (newShipments) {
      shipmentList.value = newShipments;
      originalShipmentPks.value = newShipments.map((s: any) => s.pk);
      calculateTotals();
    } else {
      shipmentList.value = [];
      originalShipmentPks.value = [];
    }
  },
  { immediate: true, deep: true }
);

watch(
  () => shipmentList.value,
  () => calculateTotals(),
  { deep: true }
);

// --- Shipment columns ---
const shipmentColumns: DataTableColumns<any> = [
  { type: 'selection' },
  {
    title: 'Shipment No',
    key: 'js_uniqueconsignref',
    minWidth: 140,
    render(row) {
      return h(
        'a',
        {
          class: 'cursor-pointer text-primary',
          onClick: () => viewShipment(row)
        },
        row.js_uniqueconsignref || '-'
      );
    }
  },
  { title: 'Origin', key: 'js_rl_nkorigin', minWidth: 100 },
  { title: 'Destination', key: 'js_rl_nkdestination', minWidth: 100 },
  { title: 'House Bill', key: 'js_housebill', minWidth: 120 },
  { title: 'Packages', key: 'js_outerpacks', minWidth: 80 },
  { title: 'Shipper', key: 'shipper_name', minWidth: 140 },
  { title: 'Consignee', key: 'consignee_name', minWidth: 140 },
  { title: 'Gross Weight', key: 'js_actualweight', minWidth: 100 }
];

const matchingColumns: DataTableColumns<any> = [
  { type: 'selection' },
  { title: 'Shipment No', key: 'shp_consign_no', minWidth: 140 },
  { title: 'Origin', key: 'shp_origin', minWidth: 100 },
  { title: 'Destination', key: 'shp_destination', minWidth: 100 },
  { title: 'House Bill', key: 'shp_house_bill', minWidth: 120 },
  { title: 'Packages', key: 'shp_total_package_count', minWidth: 80 },
  { title: 'Shipper', key: 'shipperName', minWidth: 140 },
  { title: 'Consignee', key: 'consigneeName', minWidth: 140 },
  { title: 'ETD', key: 'shp_etd', minWidth: 100 },
  { title: 'Gross Weight', key: 'shp_actual_weight', minWidth: 100 }
];

function viewShipment(item: any) {
  const pk = String(item?.js_pk ?? '').trim();
  if (!pk) {
    window.$message?.warning('Shipment id/pk is missing.');
    return;
  }
  router.push({
    path: '/business/shipment-edit/' + pk,
    query: { shipment_no: item.js_uniqueconsignref }
  });
}

// --- Fetch matching shipments ---
async function fetchMatchingShipments() {
  const etd = formatTransportDate(formData.value.transport_list?.[0]?.jw_etd);
  if (
    !formData.value.jk_transportmode ||
    !formData.value.jk_rl_nkorigin ||
    !formData.value.jk_rl_nkdestination ||
    !etd
  ) {
    window.$message?.warning('Please fill in Transport, Origin, Destination and ETD fields.');
    return;
  }

  try {
    const response = await consolidationMatchingShipments({
      con_transport_mode: formData.value.jk_transportmode,
      origin: formData.value.jk_rl_nkorigin,
      destination: formData.value.jk_rl_nkdestination,
      etd,
      shipment_number: matchingFilter.value.shipment_number
    });

    if (response.data) {
      matchingShipments.value = response.data || [];
      selectedMatchingShipments.value = [];
      matchingDialogVisible.value = true;
    } else {
      matchingShipments.value = [];
      matchingDialogVisible.value = false;
    }
  } catch {
    matchingShipments.value = [];
    matchingDialogVisible.value = false;
  }
}

function confirmSelectedShipments() {
  if (selectedMatchingShipments.value.length === 0) return;

  selectedMatchingShipments.value.forEach(shipmentPk => {
    const matched = matchingShipments.value.find((s: any) => s.pk === shipmentPk);
    if (matched && !shipmentList.value.some((s: any) => s.pk === shipmentPk)) {
      shipmentList.value.push(matched);
      if (!originalShipmentPks.value.includes(shipmentPk) && !pendingAttachShipments.value.includes(shipmentPk)) {
        pendingAttachShipments.value.push(shipmentPk);
      }
      const idx = pendingDetachShipments.value.indexOf(shipmentPk);
      if (idx !== -1) pendingDetachShipments.value.splice(idx, 1);
    }
  });

  matchingDialogVisible.value = false;
  selectedMatchingShipments.value = [];
  formData.value.shipments = shipmentList.value;
  calculateTotals();
}

function detachSelectedShipments() {
  if (selectedDetachShipments.value.length === 0) {
    window.$message?.warning('Please select shipments to detach.');
    return;
  }

  selectedDetachShipments.value.forEach(shipmentPk => {
    const idx = shipmentList.value.findIndex((s: any) => s.pk === shipmentPk);
    if (idx !== -1) {
      shipmentList.value.splice(idx, 1);
      if (originalShipmentPks.value.includes(shipmentPk) && !pendingDetachShipments.value.includes(shipmentPk)) {
        pendingDetachShipments.value.push(shipmentPk);
      }
      const attachIdx = pendingAttachShipments.value.indexOf(shipmentPk);
      if (attachIdx !== -1) pendingAttachShipments.value.splice(attachIdx, 1);
    }
  });

  selectedDetachShipments.value = [];
  formData.value.shipments = shipmentList.value;
  calculateTotals();
}

function getShipmentRowKey(row: any) {
  return row.pk ?? row.id ?? row.shp_consign_no ?? JSON.stringify(row);
}

function formatTransportDate(value?: string | null): string | null {
  if (!value || (typeof value === 'string' && !value.trim())) return null;
  const datePart = String(value).includes('T') ? String(value).split('T')[0] : String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return null;
  const parsed = new Date(`${datePart}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : datePart;
}

function ensureFirstTransport(): Record<string, any> {
  const d = formData.value;
  if (!d.transport_list) d.transport_list = [];
  if (!d.transport_list[0]) d.transport_list[0] = {};
  return d.transport_list[0];
}

function updateFirstTransportField(field: string, value: string | null | undefined) {
  ensureFirstTransport()[field] = value ?? null;
}

const firstTransportEtd = computed(() => formatTransportDate(formData.value.transport_list?.[0]?.jw_etd));
const firstTransportEta = computed(() => formatTransportDate(formData.value.transport_list?.[0]?.jw_eta));
const firstTransportAtd = computed(() => formatTransportDate(formData.value.transport_list?.[0]?.jw_atd));
const firstTransportAta = computed(() => formatTransportDate(formData.value.transport_list?.[0]?.jw_ata));

// Expose for parent
defineExpose({
  pendingAttachShipments,
  pendingDetachShipments,
  originalShipmentPks
});
</script>

<!-- eslint-disable vue/no-mutating-props -->
<template>
  <div class="h-full overflow-auto pb-48px">
    <NForm label-placement="left" label-width="140" class="compact-form p-16px">
      <!-- Row 1: Local Agent | Overseas Agent | Dates -->
      <NGrid :cols="4" :x-gap="12" class="mb-12px">
        <!-- Local Agent -->
        <NGi span="2">
          <NDivider class="!my-0">
            <span class="text-12px font-bold uppercase opacity-70">Local Agent</span>
          </NDivider>
          <NForm label-placement="left" label-width="120" :show-feedback="false" class="compact-form mt-4px">
            <NGrid :cols="2" :x-gap="12">
              <NFormItemGi label="Name">
                <NInput
                  :value="inputData.local_agent?.name"
                  @update:value="
                    (v: string) => {
                      if (inputData.local_agent) inputData.local_agent.name = v;
                    }
                  "
                />
              </NFormItemGi>
              <NFormItemGi label="Contact">
                <NInput
                  :value="inputData.local_agent?.e2_contact"
                  @update:value="
                    (v: string) => {
                      if (inputData.local_agent) inputData.local_agent.e2_contact = v;
                    }
                  "
                />
              </NFormItemGi>
              <NFormItemGi label="Address1">
                <NInput
                  :value="inputData.local_agent?.e2_address1"
                  @update:value="
                    (v: string) => {
                      if (inputData.local_agent) inputData.local_agent.e2_address1 = v;
                    }
                  "
                />
              </NFormItemGi>
              <NFormItemGi label="Phone">
                <NInput
                  :value="inputData.local_agent?.e2_phone"
                  @update:value="
                    (v: string) => {
                      if (inputData.local_agent) inputData.local_agent.e2_phone = v;
                    }
                  "
                />
              </NFormItemGi>
              <NFormItemGi label="Address2">
                <NInput
                  :value="inputData.local_agent?.e2_address2"
                  @update:value="
                    (v: string) => {
                      if (inputData.local_agent) inputData.local_agent.e2_address2 = v;
                    }
                  "
                />
              </NFormItemGi>
            </NGrid>
          </NForm>
        </NGi>

        <!-- Overseas Agent -->
        <NGi span="2">
          <NDivider class="!my-0">
            <span class="text-12px font-bold uppercase opacity-70">Overseas Agent</span>
          </NDivider>
          <NForm label-placement="left" label-width="120" :show-feedback="false" class="compact-form mt-4px">
            <NGrid :cols="2" :x-gap="12">
              <NFormItemGi label="Name">
                <NInput
                  :value="inputData.overseas_agent?.add_address_name"
                  @update:value="
                    (v: string) => {
                      if (inputData.overseas_agent) inputData.overseas_agent.add_address_name = v;
                    }
                  "
                />
              </NFormItemGi>
              <NFormItemGi label="Contact">
                <NInput
                  :value="inputData.overseas_agent?.add_contact"
                  @update:value="
                    (v: string) => {
                      if (inputData.overseas_agent) inputData.overseas_agent.add_contact = v;
                    }
                  "
                />
              </NFormItemGi>
              <NFormItemGi label="Address1">
                <NInput
                  :value="inputData.overseas_agent?.add_address1"
                  @update:value="
                    (v: string) => {
                      if (inputData.overseas_agent) inputData.overseas_agent.add_address1 = v;
                    }
                  "
                />
              </NFormItemGi>
              <NFormItemGi label="Address2">
                <NInput
                  :value="inputData.overseas_agent?.add_address2"
                  @update:value="
                    (v: string) => {
                      if (inputData.overseas_agent) inputData.overseas_agent.add_address2 = v;
                    }
                  "
                />
              </NFormItemGi>
              <NFormItemGi label="Phone">
                <NInput
                  :value="inputData.overseas_agent?.add_phone"
                  @update:value="
                    (v: string) => {
                      if (inputData.overseas_agent) inputData.overseas_agent.add_phone = v;
                    }
                  "
                />
              </NFormItemGi>
            </NGrid>
          </NForm>
        </NGi>
      </NGrid>

      <NDivider class="!my-8px" />

      <!-- Row 2: Transport | Routing | Schedule & Agents | Coload & VGM -->
      <NGrid :cols="4" :x-gap="12" responsive="screen" item-responsive class="mb-12px">
        <!-- Column 1: Transport -->
        <NGi span="4 m:1">
          <NForm label-placement="left" label-width="120" :show-feedback="false" class="compact-form">
            <NFormItem label="Transport">
              <NSelect
                :value="inputData.jk_transportmode"
                :options="transportOptions"
                @update:value="
                  (v: string) => {
                    inputData.jk_transportmode = v;
                    inputData.jk_consolmode = undefined;
                  }
                "
              />
            </NFormItem>
            <NFormItem label="Container">
              <NSelect
                :value="inputData.jk_consolmode"
                :options="getConsolModeOptions"
                @update:value="(v: string) => (inputData.jk_consolmode = v)"
              />
            </NFormItem>
            <NFormItem label="Consol Type">
              <NSelect
                :value="inputData.jk_releasetype"
                :options="consolTypeOptions"
                clearable
                @update:value="(v: string) => (inputData.jk_releasetype = v)"
              />
            </NFormItem>
            <NFormItem label="Service Level">
              <NSelect
                :value="inputData.jk_awbservicelevel"
                :options="serviceLevelOptions"
                clearable
                filterable
                @update:value="(v: string) => (inputData.jk_awbservicelevel = v)"
              />
            </NFormItem>
            <NFormItem label="Freight Terms">
              <NSelect
                :value="inputData.jk_prepaidcollect"
                :options="freightTermsOptions"
                @update:value="(v: string) => (inputData.jk_prepaidcollect = v)"
              />
            </NFormItem>
            <NFormItem label="BOL">
              <NInput
                :value="inputData.jk_masterbillnum"
                @update:value="(v: string) => (inputData.jk_masterbillnum = v)"
              />
            </NFormItem>
            <NFormItem label="Contract No">
              <NInput
                :value="inputData.jk_carriercontractnumber"
                @update:value="(v: string) => (inputData.jk_carriercontractnumber = v)"
              />
            </NFormItem>
            <NFormItem label="Delivery Mode">
              <NSelect
                :value="inputData.jk_deliverymode"
                :options="deliveryModeOptions"
                clearable
                @update:value="(v: string) => (inputData.jk_deliverymode = v)"
              />
            </NFormItem>
          </NForm>
        </NGi>

        <!-- Column 2: Routing -->
        <NGi span="4 m:1">
          <NForm label-placement="left" label-width="120" :show-feedback="false" class="compact-form">
            <!--
 <NFormItem label="Origin">
              <NAutoComplete :value="inputData.jk_rl_nkorigin" :options="portOptions" clearable
                @search="(q: string) => queryPort(q)" @select="(v: string) => (inputData.jk_rl_nkorigin = v)"
                @update:value="(v: string) => (inputData.jk_rl_nkorigin = v)" />
            </NFormItem>
            <NFormItem label="Destination">
              <NAutoComplete :value="inputData.jk_rl_nkdestination" :options="portOptions" clearable
                @search="(q: string) => queryPort(q)" @select="(v: string) => (inputData.jk_rl_nkdestination = v)"
                @update:value="(v: string) => (inputData.jk_rl_nkdestination = v)" />
            </NFormItem>
            <NFormItem label="Receipt">
              <NAutoComplete :value="inputData.jk_rl_nkplaceofreceipt" :options="portOptions" clearable
                @search="(q: string) => queryPort(q)" @select="(v: string) => (inputData.jk_rl_nkplaceofreceipt = v)"
                @update:value="(v: string) => (inputData.jk_rl_nkplaceofreceipt = v)" />
            </NFormItem>
            <NFormItem label="Delivery">
              <NAutoComplete :value="inputData.jk_rl_nkplaceofdelivery" :options="portOptions" clearable
                @search="(q: string) => queryPort(q)" @select="(v: string) => (inputData.jk_rl_nkplaceofdelivery = v)"
                @update:value="(v: string) => (inputData.jk_rl_nkplaceofdelivery = v)" />
            </NFormItem> 
-->
            <NFormItem label="Load">
              <NAutoComplete
                :value="inputData.jk_rl_nkloadport"
                :options="portOptions"
                clearable
                @search="(q: string) => queryPort(q)"
                @select="(v: string) => (inputData.jk_rl_nkloadport = v)"
                @update:value="(v: string) => (inputData.jk_rl_nkloadport = v)"
              />
            </NFormItem>
            <NFormItem label="Discharge">
              <NAutoComplete
                :value="inputData.jk_rl_nkdischargeport"
                :options="portOptions"
                clearable
                @search="(q: string) => queryPort(q)"
                @select="(v: string) => (inputData.jk_rl_nkdischargeport = v)"
                @update:value="(v: string) => (inputData.jk_rl_nkdischargeport = v)"
              />
            </NFormItem>
            <NFormItem label="Vessel">
              <NInput
                :value="inputData.transport_list?.[0]?.jw_vessel"
                @update:value="(v: string) => (inputData.jw_vessel = v)"
              />
            </NFormItem>
            <NFormItem label="Voyage">
              <NInput
                :value="inputData.transport_list?.[0]?.jw_voyageflight"
                @update:value="(v: string) => (inputData.jw_voyageflight = v)"
              />
            </NFormItem>
          </NForm>
        </NGi>

        <!-- Column 3: Schedule & Agents -->
        <NGi span="4 m:1">
          <NForm label-placement="left" label-width="120" :show-feedback="false" class="compact-form">
            <NFormItem label="ETD">
              <NDatePicker
                :formatted-value="firstTransportEtd"
                type="date"
                value-format="yyyy-MM-dd"
                clearable
                style="width: 100%"
                @update:formatted-value="(v: string) => updateFirstTransportField('jw_etd', v)"
              />
            </NFormItem>
            <NFormItem label="ETA">
              <NDatePicker
                :formatted-value="firstTransportEta"
                type="date"
                value-format="yyyy-MM-dd"
                clearable
                style="width: 100%"
                @update:formatted-value="(v: string) => updateFirstTransportField('jw_eta', v)"
              />
            </NFormItem>
            <NFormItem label="ATD">
              <NDatePicker
                :formatted-value="firstTransportAtd"
                type="date"
                value-format="yyyy-MM-dd"
                clearable
                style="width: 100%"
                @update:formatted-value="(v: string) => updateFirstTransportField('jw_atd', v)"
              />
            </NFormItem>
            <NFormItem label="ATA">
              <NDatePicker
                :formatted-value="firstTransportAta"
                type="date"
                value-format="yyyy-MM-dd"
                clearable
                style="width: 100%"
                @update:formatted-value="(v: string) => updateFirstTransportField('jw_ata', v)"
              />
            </NFormItem>
            <NFormItem label="Carrier">
              <NInput
                :value="inputData.jk_rl_nkcarrier"
                @update:value="(v: string) => (inputData.jk_rl_nkcarrier = v)"
              />
            </NFormItem>
            <NFormItem label="Bkg Ref">
              <NInput
                :value="inputData.jk_bookingreference"
                @update:value="(v: string) => (inputData.jk_bookingreference = v)"
              />
            </NFormItem>
            <NFormItem label="Bkg Agent">
              <NInput
                :value="inputData.jk_bookingagent"
                @update:value="(v: string) => (inputData.jk_bookingagent = v)"
              />
            </NFormItem>
            <NFormItem label="Agent Ref">
              <NInput
                :value="inputData.jk_agentsreference"
                @update:value="(v: string) => (inputData.jk_agentsreference = v)"
              />
            </NFormItem>
          </NForm>
        </NGi>

        <!-- Column 4: Coload & VGM -->
        <NGi span="4 m:1">
          <NForm label-placement="left" label-width="120" :show-feedback="false" class="compact-form">
            <NFormItem label="Coload Agent">
              <NInput :value="inputData.jk_coloadagent" @update:value="(v: string) => (inputData.jk_coloadagent = v)" />
            </NFormItem>
            <NFormItem label="Coload MBL">
              <NInput
                :value="inputData.jk_coloadmasterbill"
                @update:value="(v: string) => (inputData.jk_coloadmasterbill = v)"
              />
            </NFormItem>
            <!--
 <NFormItem label="Coload Ref.">
              <NInput :value="inputData.jk_coloadbookingreference"
                @update:value="(v: string) => (inputData.jk_coloadbookingreference = v)" />
            </NFormItem> 
-->
            <NFormItem label="On Board">
              <NDatePicker
                :formatted-value="formatTransportDate(inputData.jk_shippedonboarddate)"
                type="date"
                value-format="yyyy-MM-dd"
                clearable
                style="width: 100%"
                @update:formatted-value="(v: string) => (inputData.jk_shippedonboarddate = v)"
              />
            </NFormItem>
            <!--
 <NFormItem label="VGM Data">
              <NSpace :wrap="false" :size="4" class="w-full">
                <NInputNumber :value="inputData.jk_vgmweight" :min="0" :precision="5" :show-button="false"
                  class="flex-1" @update:value="(v: number | null) => (inputData.jk_vgmweight = v ?? 0)" />
                <NSelect :value="inputData.jk_vgmweightunit || 'KG'" :options="vgmUnitOptions" style="width: 72px"
                  @update:value="(v: string) => (inputData.jk_vgmweightunit = v)" />
              </NSpace>
            </NFormItem> 
-->
            <NFormItem label="Phase">
              <NSelect
                :value="inputData.jk_phase"
                :options="[]"
                clearable
                @update:value="(v: string) => (inputData.jk_phase = v)"
              />
            </NFormItem>
          </NForm>
        </NGi>
      </NGrid>

      <NDivider class="!my-8px" />

      <!-- Shipments Section -->
      <div class="mb-8px flex items-center gap-8px">
        <NButton type="primary" size="small" @click="fetchMatchingShipments">Attach</NButton>
        <NButton
          type="primary"
          size="small"
          :disabled="selectedDetachShipments.length === 0"
          @click="detachSelectedShipments"
        >
          Detach
        </NButton>
      </div>
      <NDataTable
        v-model:checked-row-keys="selectedDetachShipments"
        :columns="shipmentColumns"
        :data="shipmentList"
        :bordered="true"
        size="small"
        :pagination="false"
        :row-key="getShipmentRowKey"
        :scroll-x="1100"
      />

      <!-- Totals bar (fixed bottom) -->
      <div class="mt-8px flex items-center gap-24px border-t border-solid border-gray-200 pt-8px text-14px">
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
    </NForm>

    <!-- Matching Shipments Modal -->
    <NModal
      v-model:show="matchingDialogVisible"
      preset="card"
      title="Select Matching Shipments"
      style="width: 1200px"
      :mask-closable="false"
    >
      <NSpace vertical :size="12">
        <div class="flex gap-8px items-center">
          <span class="text-12px">Shipment No.:</span>
          <NInput
            v-model:value="matchingFilter.shipment_number"
            placeholder="Search..."
            clearable
            style="width: 260px"
          />
          <NButton type="primary" size="small" @click="fetchMatchingShipments">Search</NButton>
        </div>
        <NDataTable
          v-model:checked-row-keys="selectedMatchingShipments"
          :columns="matchingColumns"
          :data="matchingShipments"
          :bordered="true"
          size="small"
          :pagination="{ pageSize: 10 }"
          :row-key="getShipmentRowKey"
          :scroll-x="1100"
        />
      </NSpace>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="matchingDialogVisible = false">Cancel</NButton>
          <NButton type="primary" :disabled="selectedMatchingShipments.length === 0" @click="confirmSelectedShipments">
            Confirm
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
:deep(.n-form-item) {
  overflow: visible;
}

:deep(.n-gi) {
  overflow: visible;
}
</style>
