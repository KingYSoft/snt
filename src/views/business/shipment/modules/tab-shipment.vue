<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */
import { ref, watch, nextTick, computed } from 'vue';
import {
  NDataTable,
  NButton,
  NInput,
  NInputNumber,
  NSelect,
  NDatePicker,
  NGrid,
  NDivider,
  NFormItemGi,
  NForm,
  NAutoComplete,
  NModal,
  NSpace
} from 'naive-ui';
import { $t } from '@/locales';
import { shipmentQueryOrgAddress, shipmentSaveOrgAddress, userQueryAll } from '@/service/api/business/shipment';
import RemoteTableMenu from '@/components/business/remote-table-menu.vue';
import { createContainerColumns, createLooseColumns, packTypeOptions } from './tab-shipment-columns';

const props = defineProps<{
  inputData: Record<string, any>;
  queryPortList?: Array<{ rl_code: string; rl_port_name: string }>;
  queryAllUserList?: Array<{
    pk: string;
    full_name: string;
    email_address: string;
  }>;
}>();

const emit = defineEmits<{
  (e: 'queryPort', query: string): void;
}>();

const formRef = ref<InstanceType<typeof NForm> | null>(null);
defineExpose({ formRef });

// --- Options ---
const transportModeOptions = [
  { label: 'SEA', value: 'SEA' },
  { label: 'AIR', value: 'AIR' },
  { label: 'LAND', value: 'LAND' },
  { label: 'RAIL', value: 'RAIL' }
];

const containerTypeOptions = [
  { label: 'FCL', value: 'FCL' },
  { label: 'LCL', value: 'LCL' }
];

const _freightTermsOptions = [
  { label: 'Prepaid (PP)', value: 'PP' },
  { label: 'Collect (CC)', value: 'CC' }
];

const incoTermOptions = [
  { label: 'CFR', value: 'CFR' },
  { label: 'CIF', value: 'CIF' },
  { label: 'CIP', value: 'CIP' },
  { label: 'CPT', value: 'CPT' },
  { label: 'EXW', value: 'EXW' },
  { label: 'FAS', value: 'FAS' },
  { label: 'FOB', value: 'FOB' },
  { label: 'DAP', value: 'DAP' },
  { label: 'DPU', value: 'DPU' },
  { label: 'DDP', value: 'DDP' }
];

const releaseTypeOptions = [
  { label: 'OBO', value: 'OBO' },
  { label: 'OBR', value: 'OBR' },
  { label: 'TLX', value: 'TLX' },
  { label: 'SWB', value: 'SWB' },
  { label: 'EBL', value: 'EBL' }
];

const serviceLevelOptions = [
  { label: 'CFS/CFS', value: 'CFS/CFS' },
  { label: 'CY/CY', value: 'CY/CY' },
  { label: 'CFS/CY', value: 'CFS/CY' },
  { label: 'CY/CFS', value: 'CY/CFS' }
];

const weightUnitOptions = [{ label: 'KG', value: 'KG' }];

const volumeUnitOptions = [{ label: 'M3', value: 'M3' }];

const currencyOptions = [
  { label: 'USD', value: 'USD' },
  { label: 'EUR', value: 'EUR' },
  { label: 'CNY', value: 'CNY' }
];

const transitTimeUnitOptions = [{ label: 'DAYS', value: 'DAYS' }];

// --- Address lookup table headers ---
const addrTableHeaders = [
  { title: 'Code', key: 'code', width: 140 },
  { title: 'Company Name', key: 'company_name', width: 180 },
  { title: 'Address1', key: 'address1', width: 160 },
  { title: 'City', key: 'city', width: 120 },
  { title: 'Country', key: 'country_code', width: 100 }
];

function onSelectShipper(row: any) {
  if (!row || typeof row !== 'object') return;
  if (!props.inputData.shipper || typeof props.inputData.shipper !== 'object') {
    props.inputData.shipper = {};
  }
  const s = props.inputData.shipper;
  s.add_address_type = row.address_type;
  s.add_address_short_code = row.short_code;
  s.add_address_code = row.code;
  s.add_address_name = row.company_name;
  s.add_address = row.pk;
  s.add_address1 = row.address1;
  s.add_address2 = row.address2;
  s.add_address3 = row.address3;
  s.add_contact = row.contact;
  s.add_city = row.city;
  s.add_state = row.state;
  s.add_postal_code = row.postal_code;
  s.add_country_code = row.country_code;
  s.add_phone = row.phone;
  s.add_mobile = row.mobile;
  s.add_fax = row.fax;
  s.add_email = row.email;
}

function clearShipper() {
  if (!props.inputData.shipper || typeof props.inputData.shipper !== 'object') {
    props.inputData.shipper = {};
  }

  props.inputData.shipper = {
    ...props.inputData.shipper,
    add_address_type: '',
    add_address_short_code: '',
    add_address_code: '',
    add_address_name: '',
    add_address: '',
    add_address1: '',
    add_address2: '',
    add_address3: '',
    add_contact: '',
    add_city: '',
    add_state: '',
    add_postal_code: '',
    add_country_code: '',
    add_phone: '',
    add_mobile: '',
    add_fax: '',
    add_email: ''
  };
}

function onSelectConsignee(row: any) {
  if (!row || typeof row !== 'object') return;
  if (!props.inputData.consignee || typeof props.inputData.consignee !== 'object') {
    props.inputData.consignee = {};
  }
  const c = props.inputData.consignee;
  c.add_address_type = row.address_type;
  c.add_address_short_code = row.short_code;
  c.add_address_code = row.code;
  c.add_address_name = row.company_name;
  c.add_address = row.pk;
  c.add_address1 = row.address1;
  c.add_address2 = row.address2;
  c.add_address3 = row.address3;
  c.add_contact = row.contact;
  c.add_city = row.city;
  c.add_state = row.state;
  c.add_postal_code = row.postal_code;
  c.add_country_code = row.country_code;
  c.add_phone = row.phone;
  c.add_mobile = row.mobile;
  c.add_fax = row.fax;
  c.add_email = row.email;
}

function clearConsignee() {
  if (!props.inputData.consignee || typeof props.inputData.consignee !== 'object') {
    props.inputData.consignee = {};
  }

  props.inputData.consignee = {
    ...props.inputData.consignee,
    add_address_type: '',
    add_address_short_code: '',
    add_address_code: '',
    add_address_name: '',
    add_address: '',
    add_address1: '',
    add_address2: '',
    add_address3: '',
    add_contact: '',
    add_city: '',
    add_state: '',
    add_postal_code: '',
    add_country_code: '',
    add_phone: '',
    add_mobile: '',
    add_fax: '',
    add_email: ''
  };
}

// --- Address Dialog ---
const addrDialogVis = ref(false);
const addrDialogSaving = ref(false);
const addrDialogType = ref('');
const addrFormRef = ref<InstanceType<typeof NForm> | null>(null);
const addrInput = ref({
  code: '',
  short_code: '',
  company_name: '',
  address_type: '',
  address1: '',
  address2: '',
  address3: '',
  city: '',
  state: '',
  postal_code: '',
  country_code: '',
  contact: '',
  phone: '',
  fax: '',
  email: ''
});

function openAddrDialog(type: string) {
  addrInput.value = {
    code: '',
    short_code: '',
    company_name: '',
    address_type: type,
    address1: '',
    address2: '',
    address3: '',
    city: '',
    state: '',
    postal_code: '',
    country_code: '',
    contact: '',
    phone: '',
    fax: '',
    email: ''
  };
  addrDialogType.value = type;
  addrDialogVis.value = true;
}

async function saveAddr() {
  addrDialogSaving.value = true;
  try {
    const { data } = await shipmentSaveOrgAddress({ ...addrInput.value });
    const row = data?.address;
    if (row) {
      if (addrDialogType.value === 'SHIPPER') onSelectShipper(row);
      else if (addrDialogType.value === 'CONSIGNEE') onSelectConsignee(row);
    }
    addrDialogVis.value = false;
    window.$message?.success($t('page.business.shipment.address.saveSuccess'));
  } catch {
    window.$message?.error($t('page.business.shipment.address.saveFailed'));
  } finally {
    addrDialogSaving.value = false;
  }
}

// --- Port autocomplete ---
const portOptions = computed(() => {
  const list = props.queryPortList || [];
  return list.map(item => ({
    label: `${item.rl_code} - ${item.rl_port_name}`,
    value: item.rl_code
  }));
});

function queryPort(search: string) {
  emit('queryPort', search);
}

// --- User autocomplete ---
const localUserList = ref<Array<{ pk: string; full_name: string; email_address: string }>>([]);
const mergedUserList = computed(() => {
  const remote = props.queryAllUserList || [];
  const combined = [...remote, ...localUserList.value];
  const seen = new Set<string>();
  return combined.filter(u => {
    if (seen.has(u.pk)) return false;
    seen.add(u.pk);
    return true;
  });
});

const _userOptions = computed(() =>
  mergedUserList.value.map(u => ({
    label: `${u.full_name} (${u.email_address})`,
    value: u.pk
  }))
);

let userSearchTimer: ReturnType<typeof setTimeout> | null = null;
function _searchUser(query: string) {
  if (userSearchTimer) clearTimeout(userSearchTimer);
  userSearchTimer = setTimeout(async () => {
    if (!query) {
      localUserList.value = [];
      return;
    }
    try {
      const { data } = await userQueryAll({ query });
      if (data) {
        localUserList.value = data.list ?? [];
      }
    } catch {
      // ignore
    }
  }, 300);
}

function _onSelectUser(field: 'sales' | 'ops' | 'cs', pkOrRow: any) {
  const row = typeof pkOrRow === 'string' ? mergedUserList.value.find(u => u.pk === pkOrRow) : pkOrRow;
  if (!row) return;
  if (field === 'sales') {
    props.inputData.shp_job_rep_sales = row.pk;
    props.inputData.shp_job_rep_sales_name = row.full_name;
  } else if (field === 'ops') {
    props.inputData.shp_job_rep_ops = row.pk;
    props.inputData.shp_job_rep_ops_name = row.full_name;
  } else {
    props.inputData.shp_job_rep_cs = row.pk;
    props.inputData.shp_job_rep_cs_name = row.full_name;
  }
}

// --- Calculated fields ---
const VOLUME_WEIGHT_FACTOR = 166;

function calculateVolumeWeight(volume: number): number | null {
  if (!volume || volume === 0) return null;
  const result = volume * VOLUME_WEIGHT_FACTOR;
  return result === 0 ? null : result;
}

function calculateChargeableWeight(grossWeight: number, volumeWeight: number | null): number | null {
  if ((!grossWeight || grossWeight === 0) && !volumeWeight) return null;
  if ((!grossWeight || grossWeight === 0) && volumeWeight === 0) return null;
  const vw = volumeWeight ?? 0;
  const gw = grossWeight ?? 0;
  const result = gw >= vw ? gw : vw;
  return result === 0 ? null : result;
}

let isCalculating = false;
const updateCalculatedFields = () => {
  if (isCalculating) return;
  isCalculating = true;
  const volume = props.inputData.shp_actual_volume;
  const weight = props.inputData.shp_actual_weight;
  const newVW = calculateVolumeWeight(volume);
  if (props.inputData.shp_volume_weight !== newVW) {
    props.inputData.shp_volume_weight = newVW;
  }
  const newCW = calculateChargeableWeight(weight, newVW);
  if (props.inputData.shp_actual_chargeable !== newCW) {
    props.inputData.shp_actual_chargeable = newCW;
  }
  requestAnimationFrame(() => {
    isCalculating = false;
  });
};

watch(() => props.inputData.shp_actual_volume, updateCalculatedFields);
watch(() => props.inputData.shp_actual_weight, updateCalculatedFields);

// --- Loose item calc ---
function jsPackingW(item: any) {
  if (!item) return;
  nextTick(() => {
    const vol = item.pac_actual_volume ?? 0;
    const vw = vol * 166;
    item.pac_volume_weight = vw === 0 ? null : vw;
    const gw = item.pac_gross_weight ?? 0;
    const cw = gw < vw ? vw : gw;
    item.pac_chargeable_weight = cw === 0 ? null : cw;
  });
}

// --- Container Table ---
function removeContainer(index: number) {
  props.inputData.containers_list?.splice(index, 1);
}

const containerColumns = createContainerColumns(removeContainer);

function addContainer() {
  if (!props.inputData.containers_list) {
    props.inputData.containers_list = [];
  }
  props.inputData.containers_list.push({
    ctr_type: '20GP',
    ctr_count: 1,
    ctr_container_num: '',
    ctr_seal_num: '',
    ctr_is_soc: 0,
    pac_commodity: '',
    pac_gross_weight: 0,
    pac_actual_volume: 0,
    pac_package_count: 0,
    pac_pack_type: 'CTN',
    pac_description: ''
  });
}

// --- Loose Cargo Table ---
function removeLoose(index: number) {
  props.inputData.loose_list?.splice(index, 1);
}

const looseColumns = createLooseColumns(removeLoose, jsPackingW);

function addLoose() {
  if (!props.inputData.loose_list) {
    props.inputData.loose_list = [];
  }
  props.inputData.loose_list.push({
    pac_package_count: 0,
    pac_pack_type: 'CTN',
    pac_gross_weight: 0,
    pac_actual_volume: 0,
    pac_volume_weight: null,
    pac_chargeable_weight: null,
    pac_length: 0,
    pac_width: 0,
    pac_height: 0,
    pac_uom: 'M3',
    pac_commodity: '',
    pac_description: ''
  });
}

// --- Validation rules ---
const rules = {
  shipper_name: [
    {
      required: true,
      message: () => $t('page.business.shipment.form.shipperName'),
      trigger: 'blur'
    }
  ],
  consignee_name: [
    {
      required: true,
      message: () => $t('page.business.shipment.form.consigneeName'),
      trigger: 'blur'
    }
  ],
  shp_transport_mode: [
    {
      required: true,
      message: () => $t('page.business.shipment.form.transportMode'),
      trigger: 'change'
    }
  ],
  shp_packing_mode: [
    {
      required: true,
      message: () => $t('page.business.shipment.form.packingMode'),
      trigger: 'change'
    }
  ],
  shp_origin: [
    {
      required: true,
      message: () => $t('page.business.shipment.form.origin'),
      trigger: 'blur'
    }
  ],
  shp_destination: [
    {
      required: true,
      message: () => $t('page.business.shipment.form.destination'),
      trigger: 'blur'
    }
  ],
  shp_etd: [
    {
      required: true,
      message: () => $t('page.business.shipment.form.etd'),
      trigger: 'change'
    }
  ],
  shp_cargo_ready: [
    {
      required: true,
      message: () => $t('page.business.shipment.form.cargoReady'),
      trigger: 'change'
    }
  ],
  shp_inco: [
    {
      required: true,
      message: () => $t('page.business.shipment.form.inco'),
      trigger: 'change'
    }
  ],
  shp_freight_terms: [
    {
      required: true,
      message: () => $t('page.business.shipment.form.freightTerms'),
      trigger: 'change'
    }
  ],
  shp_release_type: [
    {
      required: true,
      message: () => $t('page.business.shipment.form.releaseType'),
      trigger: 'change'
    }
  ]
};

const addrDialogTitle = computed(() => {
  if (addrDialogType.value === 'SHIPPER') return $t('page.business.shipment.address.newShipper');
  if (addrDialogType.value === 'CONSIGNEE') return $t('page.business.shipment.address.newConsignee');
  return $t('page.business.shipment.address.newAddress');
});
</script>

<!-- eslint-disable vue/no-mutating-props -->
<template>
  <div class="h-full overflow-auto pb-48px">
    <NForm ref="formRef" label-placement="left" label-width="140" :show-feedback="false" class="compact-form p-16px">
      <!-- Row 1: Shipper | Consignee -->
      <NGrid :cols="2" :x-gap="12" class="mb-12px">
        <!-- Shipper -->
        <NGi>
          <NDivider class="!my-0">
            <span class="text-12px font-bold uppercase opacity-70">Shipper</span>
          </NDivider>
          <NForm label-placement="left" label-width="120" :show-feedback="false" class="compact-form mt-4px">
            <NGrid :cols="2" :x-gap="12">
              <NFormItemGi label="Name">
                <RemoteTableMenu
                  :model-value="inputData.shipper?.add_address_name || ''"
                  :fetch-method="shipmentQueryOrgAddress"
                  :headers="addrTableHeaders"
                  display-key="company_name"
                  :query-extra="{ address_type: 'SHIPPER' }"
                  show-new
                  @update:model-value="
                    (v: string) => {
                      if (inputData.shipper) inputData.shipper.add_address_name = v;
                    }
                  "
                  @row-select="(row: any) => onSelectShipper(row)"
                  @clear="clearShipper"
                  @new-handle="openAddrDialog('SHIPPER')"
                />
              </NFormItemGi>
              <NFormItemGi label="Address1">
                <NInput :value="inputData.shipper?.add_address1" readonly />
              </NFormItemGi>
              <NFormItemGi label="Address2">
                <NInput :value="inputData.shipper?.add_address2" readonly />
              </NFormItemGi>
              <NFormItemGi label="Address3">
                <NInput :value="inputData.shipper?.add_address3" readonly />
              </NFormItemGi>
            </NGrid>
          </NForm>
        </NGi>

        <!-- Consignee -->
        <NGi>
          <NDivider class="!my-0">
            <span class="text-12px font-bold uppercase opacity-70">Consignee</span>
          </NDivider>
          <NForm label-placement="left" label-width="120" :show-feedback="false" class="compact-form mt-4px">
            <NGrid :cols="2" :x-gap="12">
              <NFormItemGi label="Name">
                <RemoteTableMenu
                  :model-value="inputData.consignee?.add_address_name || ''"
                  :fetch-method="shipmentQueryOrgAddress"
                  :headers="addrTableHeaders"
                  display-key="company_name"
                  :query-extra="{ address_type: 'CONSIGNEE' }"
                  show-new
                  @update:model-value="
                    (v: string) => {
                      if (inputData.consignee) inputData.consignee.add_address_name = v;
                    }
                  "
                  @row-select="(row: any) => onSelectConsignee(row)"
                  @clear="clearConsignee"
                  @new-handle="openAddrDialog('CONSIGNEE')"
                />
              </NFormItemGi>
              <NFormItemGi label="Address1">
                <NInput :value="inputData.consignee?.add_address1" readonly />
              </NFormItemGi>
              <NFormItemGi label="Address2">
                <NInput :value="inputData.consignee?.add_address2" readonly />
              </NFormItemGi>
              <NFormItemGi label="Address3">
                <NInput :value="inputData.consignee?.add_address3" readonly />
              </NFormItemGi>
            </NGrid>
          </NForm>
        </NGi>
      </NGrid>

      <NDivider class="!my-8px" />
      <!-- Row 2: Main fields - 4 columns -->
      <NGrid :cols="4" :x-gap="12" class="mb-12px">
        <NFormItemGi label="Transport" path="shp_transport_mode" :rule="rules.shp_transport_mode">
          <NSelect
            :value="inputData.shp_transport_mode"
            :options="transportModeOptions"
            @update:value="(v: string) => (inputData.shp_transport_mode = v)"
          />
        </NFormItemGi>
        <NFormItemGi label="Container" path="shp_packing_mode" :rule="rules.shp_packing_mode">
          <NSelect
            :value="inputData.shp_packing_mode || inputData.shp_container_type"
            :options="containerTypeOptions"
            @update:value="
              (v: string) => {
                inputData.shp_packing_mode = v;
                inputData.shp_container_type = v;
              }
            "
          />
        </NFormItemGi>
        <NFormItemGi label="Origin" path="shp_origin" :rule="rules.shp_origin">
          <NAutoComplete
            :value="inputData.shp_origin"
            :options="portOptions"
            clearable
            @search="(q: string) => queryPort(q)"
            @select="(v: string) => (inputData.shp_origin = v)"
            @update:value="(v: string) => (inputData.shp_origin = v)"
          />
        </NFormItemGi>
        <NFormItemGi label="Destination" path="shp_destination" :rule="rules.shp_destination">
          <NAutoComplete
            :value="inputData.shp_destination"
            :options="portOptions"
            clearable
            @search="(q: string) => queryPort(q)"
            @select="(v: string) => (inputData.shp_destination = v)"
            @update:value="(v: string) => (inputData.shp_destination = v)"
          />
        </NFormItemGi>
        <NFormItemGi label="Load">
          <NAutoComplete
            :value="inputData.shp_load_port"
            :options="portOptions"
            clearable
            @search="(q: string) => queryPort(q)"
            @select="(v: string) => (inputData.shp_load_port = v)"
            @update:value="(v: string) => (inputData.shp_load_port = v)"
          />
        </NFormItemGi>
        <NFormItemGi label="Discharge">
          <NAutoComplete
            :value="inputData.shp_discharge_port"
            :options="portOptions"
            clearable
            @search="(q: string) => queryPort(q)"
            @select="(v: string) => (inputData.shp_discharge_port = v)"
            @update:value="(v: string) => (inputData.shp_discharge_port = v)"
          />
        </NFormItemGi>
        <NFormItemGi label="ETD" path="shp_etd" :rule="rules.shp_etd">
          <NDatePicker
            :formatted-value="inputData.shp_etd"
            type="date"
            value-format="yyyy-MM-dd"
            style="width: 100%"
            @update:formatted-value="(v: string) => (inputData.shp_etd = v)"
          />
        </NFormItemGi>
        <NFormItemGi label="ETA">
          <NDatePicker
            :formatted-value="inputData.shp_eta"
            type="date"
            value-format="yyyy-MM-dd"
            style="width: 100%"
            @update:formatted-value="(v: string) => (inputData.shp_eta = v)"
          />
        </NFormItemGi>
        <NFormItemGi label="Gross Weight">
          <NInputNumber
            :value="inputData.shp_actual_weight"
            :min="0"
            :show-button="false"
            style="width: 100%"
            class="input-with-select-suffix"
            @update:value="(v: number | null) => (inputData.shp_actual_weight = v ?? 0)"
          >
            <template #suffix>
              <NSelect
                :value="inputData.shp_unit_of_weight"
                :options="weightUnitOptions"
                size="small"
                :consistent-menu-width="false"
                style="width: 80px"
                @update:value="(v: string) => (inputData.shp_unit_of_weight = v)"
              />
            </template>
          </NInputNumber>
        </NFormItemGi>
        <NFormItemGi label="CBM">
          <NInputNumber
            :value="inputData.shp_actual_volume"
            :min="0"
            :show-button="false"
            style="width: 100%"
            class="input-with-select-suffix"
            @update:value="(v: number | null) => (inputData.shp_actual_volume = v ?? 0)"
          >
            <template #suffix>
              <NSelect
                :value="inputData.shp_unit_of_volume"
                :options="volumeUnitOptions"
                size="small"
                :consistent-menu-width="false"
                style="width: 80px"
                @update:value="(v: string) => (inputData.shp_unit_of_volume = v)"
              />
            </template>
          </NInputNumber>
        </NFormItemGi>
        <NFormItemGi label="Volume Weight">
          <NInput :value="String(inputData.shp_volume_weight || '')" readonly />
        </NFormItemGi>
        <NFormItemGi label="Chargeable Wt">
          <NInput :value="String(inputData.shp_actual_chargeable || '')" readonly />
        </NFormItemGi>
        <NFormItemGi label="No. of Package">
          <NInputNumber
            :value="inputData.shp_total_package_count"
            :min="0"
            :show-button="false"
            style="width: 100%"
            class="input-with-select-suffix"
            @update:value="(v: number | null) => (inputData.shp_total_package_count = v ?? 0)"
          >
            <template #suffix>
              <NSelect
                :value="inputData.shp_pack_type"
                :options="packTypeOptions"
                size="small"
                :consistent-menu-width="false"
                style="width: 90px"
                @update:value="(v: string) => (inputData.shp_pack_type = v)"
              />
            </template>
          </NInputNumber>
        </NFormItemGi>
        <NFormItemGi label="Inco Term" path="shp_inco" :rule="rules.shp_inco">
          <NSelect
            :value="inputData.shp_inco || inputData.shp_inco_terms"
            :options="incoTermOptions"
            @update:value="
              (v: string) => {
                inputData.shp_inco = v;
                inputData.shp_inco_terms = v;
              }
            "
          />
        </NFormItemGi>
        <NFormItemGi label="Est. Pickup">
          <NDatePicker
            :formatted-value="inputData.shp_est_pickup"
            type="date"
            value-format="yyyy-MM-dd"
            style="width: 100%"
            clearable
            @update:formatted-value="(v: string) => (inputData.shp_est_pickup = v)"
          />
        </NFormItemGi>
        <NFormItemGi label="Est. Delivery">
          <NDatePicker
            :formatted-value="inputData.shp_est_delivery"
            type="date"
            value-format="yyyy-MM-dd"
            style="width: 100%"
            clearable
            @update:formatted-value="(v: string) => (inputData.shp_est_delivery = v)"
          />
        </NFormItemGi>
        <NFormItemGi label="Carrier">
          <NInput
            :value="inputData.shp_preferred_carrier || inputData.shp_carrier"
            @update:value="
              (v: string) => {
                inputData.shp_preferred_carrier = v;
                inputData.shp_carrier = v;
              }
            "
          />
        </NFormItemGi>
        <NFormItemGi label="Contact No">
          <NInput
            :value="inputData.shp_carrier_contract_number"
            @update:value="(v: string) => (inputData.shp_carrier_contract_number = v)"
          />
        </NFormItemGi>
        <NFormItemGi label="Service Level">
          <NSelect
            :value="inputData.shp_service_level"
            :options="serviceLevelOptions"
            @update:value="(v: string) => (inputData.shp_service_level = v)"
          />
        </NFormItemGi>
        <NFormItemGi label="Commodity">
          <NInput :value="inputData.shp_commodity" @update:value="(v: string) => (inputData.shp_commodity = v)" />
        </NFormItemGi>
        <NFormItemGi label="Cargo Value">
          <NInputNumber
            :value="inputData.shp_goods_value || inputData.shp_cargo_value"
            :min="0"
            :show-button="false"
            style="width: 100%"
            @update:value="
              (v: number | null) => {
                inputData.shp_goods_value = v ?? 0;
                inputData.shp_cargo_value = v ?? 0;
                if (v && !inputData.shp_goods_value_currency) inputData.shp_goods_value_currency = 'USD';
              }
            "
          >
            <template #suffix>
              <NSelect
                :value="inputData.shp_goods_value_currency"
                :options="currencyOptions"
                size="small"
                style="width: 80px"
                @update:value="(v: string) => (inputData.shp_goods_value_currency = v)"
              />
            </template>
          </NInputNumber>
        </NFormItemGi>
        <NFormItemGi label="Ins. Value">
          <NInputNumber
            :value="inputData.shp_insurance_value"
            :min="0"
            :show-button="false"
            style="width: 100%"
            @update:value="
              (v: number | null) => {
                inputData.shp_insurance_value = v ?? 0;
                if (v && !inputData.shp_insurance_currency) inputData.shp_insurance_currency = 'USD';
              }
            "
          >
            <template #suffix>
              <NSelect
                :value="inputData.shp_insurance_currency"
                :options="currencyOptions"
                size="small"
                style="width: 80px"
                @update:value="(v: string) => (inputData.shp_insurance_currency = v)"
              />
            </template>
          </NInputNumber>
        </NFormItemGi>
        <NFormItemGi label="Good Desc.">
          <NInput
            :value="inputData.shp_goods_description"
            type="textarea"
            :rows="2"
            @update:value="(v: string) => (inputData.shp_goods_description = v)"
          />
        </NFormItemGi>
        <NFormItemGi label="Marks & No.">
          <NInput
            :value="inputData.shp_marks_nos || inputData.shp_marks_numbers"
            type="textarea"
            :rows="2"
            @update:value="
              (v: string) => {
                inputData.shp_marks_nos = v;
                inputData.shp_marks_numbers = v;
              }
            "
          />
        </NFormItemGi>
        <NFormItemGi label="Booking Party">
          <NInput
            :value="inputData.shp_booking_party"
            @update:value="(v: string) => (inputData.shp_booking_party = v)"
          />
        </NFormItemGi>
        <NFormItemGi label="Spot Quote No.">
          <NInput
            :value="inputData.shp_one_time_quote"
            @update:value="(v: string) => (inputData.shp_one_time_quote = v)"
          />
        </NFormItemGi>
        <NFormItemGi label="Shipper Ref.">
          <NInput
            :value="inputData.shp_booking_reference"
            @update:value="(v: string) => (inputData.shp_booking_reference = v)"
          />
        </NFormItemGi>
        <NFormItemGi label="Additional Terms">
          <NInput
            :value="inputData.shp_additional_terms"
            @update:value="(v: string) => (inputData.shp_additional_terms = v)"
          />
        </NFormItemGi>
        <NFormItemGi label="Release Type" path="shp_release_type" :rule="rules.shp_release_type">
          <NSelect
            :value="inputData.shp_release_type"
            :options="releaseTypeOptions"
            @update:value="(v: string) => (inputData.shp_release_type = v)"
          />
        </NFormItemGi>
        <NFormItemGi label="Cargo Ready" path="shp_cargo_ready" :rule="rules.shp_cargo_ready">
          <NDatePicker
            :formatted-value="inputData.shp_cargo_ready"
            type="date"
            value-format="yyyy-MM-dd"
            style="width: 100%"
            @update:formatted-value="(v: string) => (inputData.shp_cargo_ready = v)"
          />
        </NFormItemGi>
        <NFormItemGi label="Transit Time">
          <NInputNumber
            :value="inputData.shp_transit_time"
            :min="0"
            :show-button="false"
            style="width: 100%"
            class="input-with-select-suffix"
            @update:value="(v: number | null) => (inputData.shp_transit_time = v ?? 0)"
          >
            <template #suffix>
              <NSelect
                :value="inputData.shp_transit_time_unit"
                :options="transitTimeUnitOptions"
                size="small"
                :consistent-menu-width="false"
                style="width: 90px"
                @update:value="(v: string) => (inputData.shp_transit_time_unit = v)"
              />
            </template>
          </NInputNumber>
        </NFormItemGi>
      </NGrid>

      <!-- Container Table (SEA FCL) -->
      <template
        v-if="
          inputData.shp_transport_mode === 'SEA' &&
          (inputData.shp_packing_mode || inputData.shp_container_type) === 'FCL'
        "
      >
        <div class="mb-8px">
          <NButton type="primary" size="small" @click="addContainer">Container</NButton>
        </div>
        <NDataTable
          empty-padding="8px 0 "
          :columns="containerColumns"
          :data="inputData.containers_list || []"
          :bordered="true"
          size="small"
          :row-key="(row: any) => String(row.id ?? Math.random())"
          :scroll-x="1400"
        />
      </template>

      <!-- Loose Cargo Table (other modes) -->
      <template v-else>
        <div class="mb-8px">
          <NButton type="warning" size="small" @click="addLoose">Loose</NButton>
        </div>
        <NDataTable
          :columns="looseColumns"
          :data="inputData.loose_list || []"
          :bordered="true"
          size="small"
          :row-key="(row: any) => String(row.id ?? Math.random())"
          :scroll-x="1400"
        />
      </template>
    </NForm>

    <!-- Address Dialog -->
    <NModal v-model:show="addrDialogVis" preset="card" :title="addrDialogTitle" style="width: 600px">
      <NForm ref="addrFormRef" label-placement="left" label-width="120" :show-feedback="false" class="compact-form">
        <NGrid :cols="2" :x-gap="12">
          <NFormItemGi label="Company Name" path="company_name">
            <NInput v-model:value="addrInput.company_name" />
          </NFormItemGi>
          <NFormItemGi label="Code">
            <NInput v-model:value="addrInput.code" />
          </NFormItemGi>
          <NFormItemGi label="Short Code">
            <NInput v-model:value="addrInput.short_code" />
          </NFormItemGi>
          <NFormItemGi label="Contact">
            <NInput v-model:value="addrInput.contact" />
          </NFormItemGi>
          <NFormItemGi label="Phone">
            <NInput v-model:value="addrInput.phone" />
          </NFormItemGi>
          <NFormItemGi label="Email">
            <NInput v-model:value="addrInput.email" />
          </NFormItemGi>
          <NFormItemGi :span="2" label="Address 1">
            <NInput v-model:value="addrInput.address1" />
          </NFormItemGi>
          <NFormItemGi :span="2" label="Address 2">
            <NInput v-model:value="addrInput.address2" />
          </NFormItemGi>
          <NFormItemGi :span="2" label="Address 3">
            <NInput v-model:value="addrInput.address3" />
          </NFormItemGi>
          <NFormItemGi label="City">
            <NInput v-model:value="addrInput.city" />
          </NFormItemGi>
          <NFormItemGi label="State">
            <NInput v-model:value="addrInput.state" />
          </NFormItemGi>
          <NFormItemGi label="Postal Code">
            <NInput v-model:value="addrInput.postal_code" />
          </NFormItemGi>
          <NFormItemGi label="Country Code">
            <NInput v-model:value="addrInput.country_code" />
          </NFormItemGi>
        </NGrid>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="addrDialogVis = false">Cancel</NButton>
          <NButton type="primary" :loading="addrDialogSaving" @click="saveAddr">Save</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
/* Ensure form items don't clip dropdowns */
:deep(.n-form-item) {
  overflow: visible;
}

/* Ensure grid items don't clip dropdowns */
:deep(.n-gi) {
  overflow: visible;
}

/* Allow NInputNumber with select suffix to show dropdown */
.input-with-select-suffix :deep(.n-input) {
  overflow: visible;
}

.input-with-select-suffix :deep(.n-input__input-el) {
  overflow: visible;
}

.input-with-select-suffix :deep(.n-input__wrapper) {
  overflow: visible;
}

.input-with-select-suffix :deep(.n-input__suffix) {
  overflow: visible;
}

/* Ensure form items with input-with-select-suffix allow overflow */
:deep(.n-form-item:has(.input-with-select-suffix)) {
  overflow: visible !important;
}
</style>
