<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */
import { computed, h, ref, watch } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { useRouter } from 'vue-router';
import { NDataTable, NDivider, NForm, NFormItemGi, NGrid, NGi, NInput } from 'naive-ui';
import { $t } from '@/locales';
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
  {
    title: $t('page.business.consolidation.detail.shipmentNo'),
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
  { title: $t('page.business.consolidation.detail.origin'), key: 'js_rl_nkorigin', minWidth: 100 },
  { title: $t('page.business.consolidation.detail.destination'), key: 'js_rl_nkdestination', minWidth: 100 },
  { title: $t('page.business.consolidation.detail.houseBill'), key: 'js_housebill', minWidth: 120 },
  { title: $t('page.business.consolidation.detail.packages'), key: 'js_outerpacks', minWidth: 80 },
  { title: $t('page.business.consolidation.detail.shipper'), key: 'shipper_name', minWidth: 140 },
  { title: $t('page.business.consolidation.detail.consignee'), key: 'consignee_name', minWidth: 140 },
  { title: $t('page.business.consolidation.detail.grossWeight'), key: 'js_actualweight', minWidth: 100 }
];

const matchingColumns: DataTableColumns<any> = [
  { type: 'selection' },
  { title: $t('page.business.consolidation.detail.shipmentNo'), key: 'shp_consign_no', minWidth: 140 },
  { title: $t('page.business.consolidation.detail.origin'), key: 'shp_origin', minWidth: 100 },
  { title: $t('page.business.consolidation.detail.destination'), key: 'shp_destination', minWidth: 100 },
  { title: $t('page.business.consolidation.detail.houseBill'), key: 'shp_house_bill', minWidth: 120 },
  { title: $t('page.business.consolidation.detail.packages'), key: 'shp_total_package_count', minWidth: 80 },
  { title: $t('page.business.consolidation.detail.shipper'), key: 'shipperName', minWidth: 140 },
  { title: $t('page.business.consolidation.detail.consignee'), key: 'consigneeName', minWidth: 140 },
  { title: $t('page.business.consolidation.detail.etd'), key: 'shp_etd', minWidth: 100 },
  { title: $t('page.business.consolidation.detail.grossWeight'), key: 'shp_actual_weight', minWidth: 100 }
];

function viewShipment(item: any) {
  const pk = String(item?.js_pk ?? '').trim();
  if (!pk) {
    window.$message?.warning($t('page.business.consolidation.detail.shipmentPkMissing'));
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
    window.$message?.warning($t('page.business.consolidation.detail.matchingFillRequired'));
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
    window.$message?.warning($t('page.business.consolidation.detail.detachSelectFirst'));
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
              <NFormItemGi :label="$t('page.business.shipment.form.name')">
                <NInput readonly :placeholder="$t('common.pleaseInput')" :value="inputData.local_agent?.name" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.business.shipment.address.contact')">
                <NInput readonly :placeholder="$t('common.pleaseInput')" :value="inputData.local_agent?.e2_contact" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.business.shipment.address.address1')">
                <NInput readonly :placeholder="$t('common.pleaseInput')" :value="inputData.local_agent?.e2_address1" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.business.shipment.address.phone')">
                <NInput readonly :placeholder="$t('common.pleaseInput')" :value="inputData.local_agent?.e2_phone" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.business.shipment.address.address2')">
                <NInput readonly :placeholder="$t('common.pleaseInput')" :value="inputData.local_agent?.e2_address2" />
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
              <NFormItemGi :label="$t('page.business.shipment.form.name')">
                <NInput
                  readonly
                  :placeholder="$t('common.pleaseInput')"
                  :value="inputData.overseas_agent?.add_address_name"
                />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.business.shipment.address.contact')">
                <NInput
                  readonly
                  :placeholder="$t('common.pleaseInput')"
                  :value="inputData.overseas_agent?.add_contact"
                />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.business.shipment.address.address1')">
                <NInput
                  readonly
                  :placeholder="$t('common.pleaseInput')"
                  :value="inputData.overseas_agent?.add_address1"
                />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.business.shipment.address.address2')">
                <NInput
                  readonly
                  :placeholder="$t('common.pleaseInput')"
                  :value="inputData.overseas_agent?.add_address2"
                />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.business.shipment.address.phone')">
                <NInput readonly :placeholder="$t('common.pleaseInput')" :value="inputData.overseas_agent?.add_phone" />
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
            <NFormItem :label="$t('page.business.consolidation.detail.transport')">
              <NInput readonly :placeholder="$t('common.pleaseInput')" :value="inputData.jk_transportmode" />
            </NFormItem>
            <NFormItem :label="$t('page.business.consolidation.detail.container')">
              <NInput readonly :placeholder="$t('common.pleaseInput')" :value="inputData.jk_consolmode" />
            </NFormItem>
            <NFormItem :label="$t('page.business.consolidation.detail.consolType')">
              <NInput readonly :placeholder="$t('common.pleaseInput')" :value="inputData.jk_releasetype" />
            </NFormItem>
            <NFormItem :label="$t('page.business.consolidation.detail.serviceLevel')">
              <NInput readonly :placeholder="$t('common.pleaseInput')" :value="inputData.jk_awbservicelevel" />
            </NFormItem>
            <NFormItem :label="$t('page.business.consolidation.detail.freightTerms')">
              <NInput readonly :placeholder="$t('common.pleaseInput')" :value="inputData.jk_prepaidcollect" />
            </NFormItem>
            <NFormItem :label="$t('page.business.consolidation.detail.bolMasterBillNo')">
              <NInput readonly :placeholder="$t('common.pleaseInput')" :value="inputData.jk_masterbillnum" />
            </NFormItem>
            <NFormItem :label="$t('page.business.consolidation.detail.contractNo')">
              <NInput readonly :placeholder="$t('common.pleaseInput')" :value="inputData.jk_carriercontractnumber" />
            </NFormItem>
            <NFormItem :label="$t('page.business.consolidation.detail.deliveryMode')">
              <NInput readonly :placeholder="$t('common.pleaseInput')" :value="inputData.jk_deliverymode" />
            </NFormItem>
          </NForm>
        </NGi>

        <!-- Column 2: Routing -->
        <NGi span="4 m:1">
          <NForm label-placement="left" label-width="120" :show-feedback="false" class="compact-form">
            <NFormItem :label="$t('page.business.consolidation.detail.load')">
              <NInput readonly :placeholder="$t('common.pleaseInput')" :value="inputData.jk_rl_nkloadport" />
            </NFormItem>
            <NFormItem :label="$t('page.business.consolidation.detail.discharge')">
              <NInput readonly :placeholder="$t('common.pleaseInput')" :value="inputData.jk_rl_nkdischargeport" />
            </NFormItem>
            <NFormItem :label="$t('page.business.consolidation.detail.vessel')">
              <NInput
                readonly
                :placeholder="$t('common.pleaseInput')"
                :value="inputData.transport_list?.[0]?.jw_vessel"
              />
            </NFormItem>
            <NFormItem :label="$t('page.business.consolidation.detail.voyage')">
              <NInput
                readonly
                :placeholder="$t('common.pleaseInput')"
                :value="inputData.transport_list?.[0]?.jw_voyageflight"
              />
            </NFormItem>
          </NForm>
        </NGi>

        <!-- Column 3: Schedule & Agents -->
        <NGi span="4 m:1">
          <NForm label-placement="left" label-width="120" :show-feedback="false" class="compact-form">
            <NFormItem :label="$t('page.business.consolidation.detail.etd')">
              <NInput readonly :placeholder="$t('common.pleaseInput')" :value="firstTransportEtd || ''" />
            </NFormItem>
            <NFormItem :label="$t('page.business.consolidation.detail.eta')">
              <NInput readonly :placeholder="$t('common.pleaseInput')" :value="firstTransportEta || ''" />
            </NFormItem>
            <NFormItem :label="$t('page.business.consolidation.detail.atd')">
              <NInput readonly :placeholder="$t('common.pleaseInput')" :value="firstTransportAtd || ''" />
            </NFormItem>
            <NFormItem :label="$t('page.business.consolidation.detail.ata')">
              <NInput readonly :placeholder="$t('common.pleaseInput')" :value="firstTransportAta || ''" />
            </NFormItem>
            <NFormItem :label="$t('page.business.consolidation.detail.carrier')">
              <NInput readonly :placeholder="$t('common.pleaseInput')" :value="inputData.jk_rl_nkcarrier" />
            </NFormItem>
            <NFormItem :label="$t('page.business.consolidation.detail.carrierBookingRef')">
              <NInput readonly :placeholder="$t('common.pleaseInput')" :value="inputData.jk_bookingreference" />
            </NFormItem>
            <NFormItem :label="$t('page.business.consolidation.detail.bookingAgent')">
              <NInput readonly :placeholder="$t('common.pleaseInput')" :value="inputData.jk_bookingagent" />
            </NFormItem>
            <NFormItem :label="$t('page.business.consolidation.detail.agentRef')">
              <NInput readonly :placeholder="$t('common.pleaseInput')" :value="inputData.jk_agentsreference" />
            </NFormItem>
          </NForm>
        </NGi>

        <!-- Column 4: Coload & VGM -->
        <NGi span="4 m:1">
          <NForm label-placement="left" label-width="120" :show-feedback="false" class="compact-form">
            <NFormItem :label="$t('page.business.consolidation.detail.coloadAgent')">
              <NInput readonly :placeholder="$t('common.pleaseInput')" :value="inputData.jk_coloadagent" />
            </NFormItem>
            <NFormItem :label="$t('page.business.consolidation.detail.coloadMbl')">
              <NInput readonly :placeholder="$t('common.pleaseInput')" :value="inputData.jk_coloadmasterbill" />
            </NFormItem>
            <NFormItem :label="$t('page.business.consolidation.detail.onBoard')">
              <NInput
                readonly
                :placeholder="$t('common.pleaseInput')"
                :value="formatTransportDate(inputData.jk_shippedonboarddate) || ''"
              />
            </NFormItem>
            <NFormItem :label="$t('page.business.shipment.form.phase')">
              <NInput readonly :placeholder="$t('common.pleaseInput')" :value="inputData.jk_phase" />
            </NFormItem>
          </NForm>
        </NGi>
      </NGrid>

      <NDivider class="!my-8px" />

      <!-- Shipments Section -->
      <NDataTable
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
