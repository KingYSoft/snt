<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */
import { computed, ref, watch } from "vue";
import type { DataTableColumns } from "naive-ui";
import {
  NAutoComplete,
  NButton,
  NCard,
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
  NSpace,
} from "naive-ui";
import { consolidationMatchingShipments } from "@/service/api/business/consolidation";
import { shipmentQueryPortCode } from "@/service/api/business/shipment";

type DetailData = Record<string, any>;

const props = defineProps<{ inputData: DetailData }>();
const emit = defineEmits<{
  "update:inputData": [value: DetailData];
}>();

const formData = computed({
  get: () => props.inputData || {},
  set: (val) => emit("update:inputData", val),
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
  return queryPortList.value.map((item) => ({
    label: `${item.rl_code} - ${item.rl_port_name}`,
    value: item.rl_code,
  }));
});

// --- Service Level options ---
const serviceLevelOptions = ref<Array<{ label: string; value: string }>>([]);

// --- Matching Shipments Dialog ---
const matchingDialogVisible = ref(false);
const matchingShipments = ref<any[]>([]);
const selectedMatchingShipments = ref<string[]>([]);
const matchingFilter = ref({ shipment_number: "" });

// Shipment list
const shipmentList = ref<any[]>([]);
const selectedDetachShipments = ref<string[]>([]);
const pendingAttachShipments = ref<string[]>([]);
const pendingDetachShipments = ref<string[]>([]);
const originalShipmentPks = ref<string[]>([]);

// Transport options
const transportOptions = [
  { label: "AIR", value: "AIR" },
  { label: "SEA", value: "SEA" },
];

const getConsolModeOptions = computed(() => {
  const mode = formData.value.jk_transportmode;
  if (mode === "AIR") {
    return [{ label: "LOOSE", value: "LOOSE" }];
  }
  return [
    { label: "FCL", value: "FCL" },
    { label: "LCL", value: "LCL" },
    { label: "LSE", value: "LSE" },
  ];
});

const consolTypeOptions = [
  { label: "DRT - Direct", value: "DRT" },
  { label: "CLD - Co-Load", value: "CLD" },
  { label: "AGT - Agent", value: "AGT" },
  { label: "CHT - Charter", value: "CHT" },
  { label: "COU - Courier", value: "COU" },
  { label: "OTH - Other", value: "OTH" },
];

const freightTermsOptions = [
  { label: "PP", value: "PP" },
  { label: "CC", value: "CC" },
];

const deliveryModeOptions = [
  { label: "CY/CY", value: "CY/CY" },
  { label: "CFS/CFS", value: "CFS/CFS" },
  { label: "CY/CFS", value: "CY/CFS" },
  { label: "CFS/CY", value: "CFS/CY" },
];

// --- Totals ---
function calculateTotals() {
  const list = shipmentList.value;
  return {
    count: list.length,
    packs: list.reduce(
      (sum, r) => sum + (Number(r.shp_total_package_count) || 0),
      0,
    ),
    gross: list.reduce((sum, r) => sum + (Number(r.shp_actual_weight) || 0), 0),
    volume: list.reduce(
      (sum, r) => sum + (Number(r.shp_actual_volume) || 0),
      0,
    ),
    chargeable: formData.value.jk_consolchargeable || 0,
  };
}

const shipmentTotals = computed(calculateTotals);

// --- Watch shipments from inputData ---
watch(
  () => formData.value.shipments,
  (newShipments) => {
    if (newShipments) {
      shipmentList.value = newShipments;
      originalShipmentPks.value = newShipments.map((s: any) => s.pk);
    } else {
      shipmentList.value = [];
      originalShipmentPks.value = [];
    }
  },
  { immediate: true, deep: true },
);

// --- Shipment columns ---
const shipmentColumns: DataTableColumns<any> = [
  { type: "selection" },
  { title: "Shipment No", key: "shp_consign_no", minWidth: 140 },
  { title: "Origin", key: "shp_origin", minWidth: 100 },
  { title: "Destination", key: "shp_destination", minWidth: 100 },
  { title: "House Bill", key: "shp_house_bill", minWidth: 120 },
  { title: "Packages", key: "shp_total_package_count", minWidth: 80 },
  { title: "Shipper", key: "shipperName", minWidth: 140 },
  { title: "Consignee", key: "consigneeName", minWidth: 140 },
  { title: "Gross Weight", key: "shp_actual_weight", minWidth: 100 },
  { title: "Volume Weight", key: "shp_actual_volume", minWidth: 100 },
];

const matchingColumns: DataTableColumns<any> = [
  { type: "selection" },
  { title: "Shipment No", key: "shp_consign_no", minWidth: 140 },
  { title: "Origin", key: "shp_origin", minWidth: 100 },
  { title: "Destination", key: "shp_destination", minWidth: 100 },
  { title: "House Bill", key: "shp_house_bill", minWidth: 120 },
  { title: "Packages", key: "shp_total_package_count", minWidth: 80 },
  { title: "Shipper", key: "shipperName", minWidth: 140 },
  { title: "Consignee", key: "consigneeName", minWidth: 140 },
  { title: "ETD", key: "shp_etd", minWidth: 100 },
  { title: "Gross Weight", key: "shp_actual_weight", minWidth: 100 },
  { title: "Volume Weight", key: "shp_actual_volume", minWidth: 100 },
];

// --- Fetch matching shipments ---
async function fetchMatchingShipments() {
  if (
    !formData.value.jk_transportmode ||
    !formData.value.jk_rl_nkorigin ||
    !formData.value.jk_rl_nkdestination ||
    !formData.value.jk_e_dep
  ) {
    window.$message?.warning(
      "Please fill in Transport, Origin, Destination and ETD fields.",
    );
    return;
  }

  try {
    const response = await consolidationMatchingShipments({
      con_transport_mode: formData.value.jk_transportmode,
      origin: formData.value.jk_rl_nkorigin,
      destination: formData.value.jk_rl_nkdestination,
      etd: formData.value.jk_e_dep,
      shipment_number: matchingFilter.value.shipment_number,
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

  selectedMatchingShipments.value.forEach((shipmentPk) => {
    const matched = matchingShipments.value.find(
      (s: any) => s.pk === shipmentPk,
    );
    if (matched && !shipmentList.value.some((s: any) => s.pk === shipmentPk)) {
      shipmentList.value.push(matched);
      if (
        !originalShipmentPks.value.includes(shipmentPk) &&
        !pendingAttachShipments.value.includes(shipmentPk)
      ) {
        pendingAttachShipments.value.push(shipmentPk);
      }
      const idx = pendingDetachShipments.value.indexOf(shipmentPk);
      if (idx !== -1) pendingDetachShipments.value.splice(idx, 1);
    }
  });

  matchingDialogVisible.value = false;
  selectedMatchingShipments.value = [];
  formData.value.shipments = shipmentList.value;
}

function detachSelectedShipments() {
  if (selectedDetachShipments.value.length === 0) {
    window.$message?.warning("Please select shipments to detach.");
    return;
  }

  selectedDetachShipments.value.forEach((shipmentPk) => {
    const idx = shipmentList.value.findIndex((s: any) => s.pk === shipmentPk);
    if (idx !== -1) {
      shipmentList.value.splice(idx, 1);
      if (
        originalShipmentPks.value.includes(shipmentPk) &&
        !pendingDetachShipments.value.includes(shipmentPk)
      ) {
        pendingDetachShipments.value.push(shipmentPk);
      }
      const attachIdx = pendingAttachShipments.value.indexOf(shipmentPk);
      if (attachIdx !== -1) pendingAttachShipments.value.splice(attachIdx, 1);
    }
  });

  selectedDetachShipments.value = [];
  formData.value.shipments = shipmentList.value;
}

function getShipmentRowKey(row: any) {
  return row.pk ?? row.id ?? row.shp_consign_no ?? JSON.stringify(row);
}

// Expose for parent
defineExpose({
  pendingAttachShipments,
  pendingDetachShipments,
  originalShipmentPks,
});
</script>

<!-- eslint-disable vue/no-mutating-props -->
<template>
  <div class="p-4">
    <NForm label-placement="left" label-width="140" class="compact-form">
      <!-- Row 1: Local Agent | Overseas Agent -->
      <NGrid :cols="2" :x-gap="12" class="mb-12px">
        <NGi>
          <NCard title="Local Agent" size="small">
            <NForm
              label-placement="left"
              label-width="100"
              :show-feedback="false"
              class="compact-form"
            >
              <NFormItem label="Name">
                <NInput
                  :value="inputData.local_agent?.add_address_name"
                  @update:value="
                    (v: string) => {
                      if (inputData.local_agent)
                        inputData.local_agent.add_address_name = v;
                    }
                  "
                />
              </NFormItem>
              <NFormItem label="Address1">
                <NInput
                  :value="inputData.local_agent?.add_address1"
                  @update:value="
                    (v: string) => {
                      if (inputData.local_agent)
                        inputData.local_agent.add_address1 = v;
                    }
                  "
                />
              </NFormItem>
              <NFormItem label="Address2">
                <NInput
                  :value="inputData.local_agent?.add_address2"
                  @update:value="
                    (v: string) => {
                      if (inputData.local_agent)
                        inputData.local_agent.add_address2 = v;
                    }
                  "
                />
              </NFormItem>
              <NFormItem label="Address3">
                <NInput
                  :value="inputData.local_agent?.add_address3"
                  @update:value="
                    (v: string) => {
                      if (inputData.local_agent)
                        inputData.local_agent.add_address3 = v;
                    }
                  "
                />
              </NFormItem>
              <NGrid :cols="2" :x-gap="12">
                <NFormItemGi label="Contact">
                  <NInput
                    :value="inputData.local_agent?.add_contact"
                    @update:value="
                      (v: string) => {
                        if (inputData.local_agent)
                          inputData.local_agent.add_contact = v;
                      }
                    "
                  />
                </NFormItemGi>
                <NFormItemGi label="Phone">
                  <NInput
                    :value="inputData.local_agent?.add_phone"
                    @update:value="
                      (v: string) => {
                        if (inputData.local_agent)
                          inputData.local_agent.add_phone = v;
                      }
                    "
                  />
                </NFormItemGi>
              </NGrid>
            </NForm>
          </NCard>
        </NGi>
        <NGi>
          <NCard title="Overseas Agent" size="small">
            <NForm
              label-placement="left"
              label-width="100"
              :show-feedback="false"
              class="compact-form"
            >
              <NFormItem label="Name">
                <NInput
                  :value="inputData.overseas_agent?.add_address_name"
                  @update:value="
                    (v: string) => {
                      if (inputData.overseas_agent)
                        inputData.overseas_agent.add_address_name = v;
                    }
                  "
                />
              </NFormItem>
              <NFormItem label="Address1">
                <NInput
                  :value="inputData.overseas_agent?.add_address1"
                  @update:value="
                    (v: string) => {
                      if (inputData.overseas_agent)
                        inputData.overseas_agent.add_address1 = v;
                    }
                  "
                />
              </NFormItem>
              <NFormItem label="Address2">
                <NInput
                  :value="inputData.overseas_agent?.add_address2"
                  @update:value="
                    (v: string) => {
                      if (inputData.overseas_agent)
                        inputData.overseas_agent.add_address2 = v;
                    }
                  "
                />
              </NFormItem>
              <NFormItem label="Address3">
                <NInput
                  :value="inputData.overseas_agent?.add_address3"
                  @update:value="
                    (v: string) => {
                      if (inputData.overseas_agent)
                        inputData.overseas_agent.add_address3 = v;
                    }
                  "
                />
              </NFormItem>
              <NGrid :cols="2" :x-gap="12">
                <NFormItemGi label="Contact">
                  <NInput
                    :value="inputData.overseas_agent?.add_contact"
                    @update:value="
                      (v: string) => {
                        if (inputData.overseas_agent)
                          inputData.overseas_agent.add_contact = v;
                      }
                    "
                  />
                </NFormItemGi>
                <NFormItemGi label="Phone">
                  <NInput
                    :value="inputData.overseas_agent?.add_phone"
                    @update:value="
                      (v: string) => {
                        if (inputData.overseas_agent)
                          inputData.overseas_agent.add_phone = v;
                      }
                    "
                  />
                </NFormItemGi>
              </NGrid>
            </NForm>
          </NCard>
        </NGi>
      </NGrid>

      <NDivider class="!my-8px" />

      <!-- Row 3: 4 columns, each column stacks fields vertically (like Vuetify reference) -->
      <NGrid
        :cols="4"
        :x-gap="12"
        responsive="screen"
        item-responsive
        class="mb-12px"
        size="small"
      >
        <!-- Column 1: Transport -->
        <NGi span="4 m:1">
          <NCard title="Transport" size="small">
            <NForm
              label-placement="left"
              label-width="100"
              :show-feedback="false"
              class="compact-form"
            >
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
                  @update:value="
                    (v: string) => (inputData.jk_awbservicelevel = v)
                  "
                />
              </NFormItem>
              <NFormItem label="Freight Terms">
                <NSelect
                  :value="inputData.jk_prepaidcollect"
                  :options="freightTermsOptions"
                  @update:value="
                    (v: string) => (inputData.jk_prepaidcollect = v)
                  "
                />
              </NFormItem>
              <NFormItem label="BOL">
                <NInput
                  :value="inputData.jk_masterbillnum"
                  @update:value="
                    (v: string) => (inputData.jk_masterbillnum = v)
                  "
                />
              </NFormItem>
              <NFormItem label="Contract No">
                <NInput
                  :value="inputData.jk_carriercontractnumber"
                  @update:value="
                    (v: string) => (inputData.jk_carriercontractnumber = v)
                  "
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
          </NCard>
        </NGi>

        <!-- Column 2: Routing -->
        <NGi span="4 m:1">
          <NCard title="Routing" size="small">
            <NForm
              label-placement="left"
              label-width="100"
              :show-feedback="false"
              class="compact-form"
            >
              <NFormItem label="Origin">
                <NAutoComplete
                  :value="inputData.jk_rl_nkorigin"
                  :options="portOptions"
                  clearable
                  @search="(q: string) => queryPort(q)"
                  @select="(v: string) => (inputData.jk_rl_nkorigin = v)"
                  @update:value="(v: string) => (inputData.jk_rl_nkorigin = v)"
                />
              </NFormItem>
              <NFormItem label="Destination">
                <NAutoComplete
                  :value="inputData.jk_rl_nkdestination"
                  :options="portOptions"
                  clearable
                  @search="(q: string) => queryPort(q)"
                  @select="(v: string) => (inputData.jk_rl_nkdestination = v)"
                  @update:value="
                    (v: string) => (inputData.jk_rl_nkdestination = v)
                  "
                />
              </NFormItem>
              <NFormItem label="Receipt">
                <NAutoComplete
                  :value="inputData.jk_rl_nkplaceofreceipt"
                  :options="portOptions"
                  clearable
                  @search="(q: string) => queryPort(q)"
                  @select="
                    (v: string) => (inputData.jk_rl_nkplaceofreceipt = v)
                  "
                  @update:value="
                    (v: string) => (inputData.jk_rl_nkplaceofreceipt = v)
                  "
                />
              </NFormItem>
              <NFormItem label="Delivery">
                <NAutoComplete
                  :value="inputData.jk_rl_nkplaceofdelivery"
                  :options="portOptions"
                  clearable
                  @search="(q: string) => queryPort(q)"
                  @select="
                    (v: string) => (inputData.jk_rl_nkplaceofdelivery = v)
                  "
                  @update:value="
                    (v: string) => (inputData.jk_rl_nkplaceofdelivery = v)
                  "
                />
              </NFormItem>
              <NFormItem label="Load">
                <NAutoComplete
                  :value="inputData.jk_rl_nkloadport"
                  :options="portOptions"
                  clearable
                  @search="(q: string) => queryPort(q)"
                  @select="(v: string) => (inputData.jk_rl_nkloadport = v)"
                  @update:value="
                    (v: string) => (inputData.jk_rl_nkloadport = v)
                  "
                />
              </NFormItem>
              <NFormItem label="Discharge">
                <NAutoComplete
                  :value="inputData.jk_rl_nkdischargeport"
                  :options="portOptions"
                  clearable
                  @search="(q: string) => queryPort(q)"
                  @select="(v: string) => (inputData.jk_rl_nkdischargeport = v)"
                  @update:value="
                    (v: string) => (inputData.jk_rl_nkdischargeport = v)
                  "
                />
              </NFormItem>
              <NFormItem label="Vessel">
                <NInput
                  :value="inputData.jk_vessel"
                  @update:value="(v: string) => (inputData.jk_vessel = v)"
                />
              </NFormItem>
              <NFormItem label="Voyage">
                <NInput
                  :value="inputData.jk_voyage"
                  @update:value="(v: string) => (inputData.jk_voyage = v)"
                />
              </NFormItem>
            </NForm>
          </NCard>
        </NGi>

        <!-- Column 3: Schedule & Agents -->
        <NGi span="4 m:1">
          <NCard title="Schedule & Agents" size="small">
            <NForm
              label-placement="left"
              label-width="100"
              :show-feedback="false"
              class="compact-form"
            >
              <NFormItem label="ETD">
                <NDatePicker
                  :formatted-value="inputData.jk_e_dep"
                  type="date"
                  value-format="yyyy-MM-dd"
                  clearable
                  style="width: 100%"
                  @update:formatted-value="
                    (v: string) => (inputData.jk_e_dep = v)
                  "
                />
              </NFormItem>
              <NFormItem label="ETA">
                <NDatePicker
                  :formatted-value="inputData.jk_e_arv"
                  type="date"
                  value-format="yyyy-MM-dd"
                  clearable
                  style="width: 100%"
                  @update:formatted-value="
                    (v: string) => (inputData.jk_e_arv = v)
                  "
                />
              </NFormItem>
              <NFormItem label="ATD">
                <NDatePicker
                  :formatted-value="inputData.jk_actualdeparture"
                  type="date"
                  value-format="yyyy-MM-dd"
                  clearable
                  style="width: 100%"
                  @update:formatted-value="
                    (v: string) => (inputData.jk_actualdeparture = v)
                  "
                />
              </NFormItem>
              <NFormItem label="ATA">
                <NDatePicker
                  :formatted-value="inputData.jk_actualarrival"
                  type="date"
                  value-format="yyyy-MM-dd"
                  clearable
                  style="width: 100%"
                  @update:formatted-value="
                    (v: string) => (inputData.jk_actualarrival = v)
                  "
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
                  @update:value="
                    (v: string) => (inputData.jk_bookingreference = v)
                  "
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
                  @update:value="
                    (v: string) => (inputData.jk_agentsreference = v)
                  "
                />
              </NFormItem>
            </NForm>
          </NCard>
        </NGi>

        <!-- Column 4: Coload & VGM -->
        <NGi span="4 m:1">
          <NCard title="Coload & VGM" size="small">
            <NForm
              label-placement="left"
              label-width="100"
              :show-feedback="false"
              class="compact-form"
            >
              <NFormItem label="Coload Agent">
                <NInput
                  :value="inputData.jk_coloadagent"
                  @update:value="(v: string) => (inputData.jk_coloadagent = v)"
                />
              </NFormItem>
              <NFormItem label="Coload MBL">
                <NInput
                  :value="inputData.jk_coloadmasterbill"
                  @update:value="
                    (v: string) => (inputData.jk_coloadmasterbill = v)
                  "
                />
              </NFormItem>
              <NFormItem label="Coload Ref.">
                <NInput
                  :value="inputData.jk_coloadbookingreference"
                  @update:value="
                    (v: string) => (inputData.jk_coloadbookingreference = v)
                  "
                />
              </NFormItem>
              <NFormItem label="Gate In">
                <NDatePicker
                  :formatted-value="inputData.jk_gateindate"
                  type="date"
                  value-format="yyyy-MM-dd"
                  clearable
                  style="width: 100%"
                  @update:formatted-value="
                    (v: string) => (inputData.jk_gateindate = v)
                  "
                />
              </NFormItem>
              <NFormItem label="On Board">
                <NDatePicker
                  :formatted-value="inputData.jk_shippedonboarddate"
                  type="date"
                  value-format="yyyy-MM-dd"
                  clearable
                  style="width: 100%"
                  @update:formatted-value="
                    (v: string) => (inputData.jk_shippedonboarddate = v)
                  "
                />
              </NFormItem>
              <NFormItem label="VGM Data">
                <NInputNumber
                  :value="inputData.jk_vgmweight"
                  :min="0"
                  :precision="5"
                  :show-button="false"
                  style="width: 100%"
                  @update:value="
                    (v: number | null) => (inputData.jk_vgmweight = v ?? 0)
                  "
                />
              </NFormItem>
            </NForm>
          </NCard>
        </NGi>
      </NGrid>

      <NDivider class="!my-8px" />

      <!-- Shipments Section -->
      <div class="mb-8px flex items-center gap-8px">
        <span class="font-bold text-14px">Shipments</span>
        <NButton type="primary" size="small" @click="fetchMatchingShipments"
          >Attach</NButton
        >
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
      <!-- Totals -->
      <div
        v-if="shipmentList.length > 0"
        class="mt-8px flex gap-24px border-t border-solid border-gray-200 pt-8px text-14px"
      >
        <span
          >Total: <strong>{{ shipmentTotals.count }}</strong> Ship.</span
        >
        <span
          >Packs: <strong>{{ shipmentTotals.packs }}</strong></span
        >
        <span
          >Gross: <strong>{{ shipmentTotals.gross }}</strong> KG</span
        >
        <span
          >Volume: <strong>{{ shipmentTotals.volume }}</strong> M3</span
        >
        <span
          >Chargeable:
          <strong>{{ shipmentTotals.chargeable }}</strong> KGS</span
        >
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
          <NButton type="primary" size="small" @click="fetchMatchingShipments"
            >Search</NButton
          >
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
          <NButton
            type="primary"
            :disabled="selectedMatchingShipments.length === 0"
            @click="confirmSelectedShipments"
          >
            Confirm
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.overflow-visible-card :deep(.n-card__content) {
  overflow: visible !important;
}

.overflow-visible-card :deep(.n-card__content:first-child) {
  overflow: visible !important;
}

:deep(.n-form-item) {
  overflow: visible;
}

:deep(.n-gi) {
  overflow: visible;
}
</style>
