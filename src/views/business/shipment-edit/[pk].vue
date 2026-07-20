<script setup lang="ts">
import { ref, h, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { NCard, NButton, NTabs, NTabPane, NSkeleton } from 'naive-ui';
import { $t } from '@/locales';
import { useTabStore } from '@/store/modules/tab';
import {
  shipmentSave,
  getShipmentDetail,
  shipmentPdfGenerate,
  shipmentQueryPortCode
} from '@/service/api/business/shipment';
import { createOrUpdateBilling } from '@/service/api/business/billing';
import { mapChargeRowToWriteItem } from '../shipment/modules/shipment-billing-map';
import TabShipment from '../shipment/modules/tab-shipment.vue';
import TabAdditionalDetails from '../shipment/modules/tab-additional-details.vue';
import TabRouting from '../shipment/modules/tab-routing.vue';
import TabBilling from '../shipment/modules/tab-billing.vue';
import TabEDocs from '../shipment/modules/tab-edocs.vue';
import TabLogs from '../shipment/modules/tab-logs.vue';

const router = useRouter();
const route = useRoute();
const tabStore = useTabStore();

const skeletonLoading = ref(true);
const cardLoading = ref(false);
const activedTab = ref(1);

const defaultData = () => ({
  id: 0,
  pk: '',
  shp_consign_no: '',
  shp_transport_mode: 'SEA',
  shp_packing_mode: 'FCL',
  shp_origin: '',
  shp_destination: '',
  shp_load_port: '',
  shp_discharge_port: '',
  shp_actual_volume: 0,
  shp_actual_weight: 0,
  shp_volume_weight: 0,
  shp_actual_chargeable: 0,
  shp_so_confirm_date: null as string | null,
  shp_vgm_cut_off_date: null as string | null,
  shp_doc_cut_off_date: null as string | null,
  shp_port_cargo_cut_off_date: null as string | null,
  shp_goods_description: '',
  shipper: {} as Record<string, any>,
  consignee: {} as Record<string, any>,
  notify_party: {} as Record<string, any>,
  notify_party1: {} as Record<string, any>,
  containers_list: [] as any[],
  loose_list: [] as any[],
  po_lines_list: [] as any[],
  notes_list: [] as any[],
  ar_charges: [] as any[],
  ap_charges: [] as any[],
  shp_unit_of_weight: 'KG',
  shp_unit_of_volume: 'M3',
  shp_transit_time_unit: 'DAYS',
  shp_pack_type: 'CTN',
  shp_is_forward_registered: 1,
  js_jx: '',
  routing_list: [] as any[],
  consolidation_list: [] as any[],
  doc_data: {} as Record<string, any>,
  pickup: {} as Record<string, any>,
  delivery: {} as Record<string, any>
});

const inputData = ref<Record<string, any>>(defaultData());

const tabTitle = computed(() => `Edit Shipment - ${inputData.value?.shp_consign_no}`);

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

// --- User query ---
const queryAllUserList = ref<Array<{ pk: string; full_name: string; email_address: string }>>([]);
let userSearchTimer: ReturnType<typeof setTimeout> | null = null;

async function queryUser(search: string) {
  if (userSearchTimer) clearTimeout(userSearchTimer);
  userSearchTimer = setTimeout(async () => {
    if (!search) {
      queryAllUserList.value = [];
      return;
    }
    try {
      const { userQueryAll } = await import('@/service/api/business/shipment');
      const { data } = await userQueryAll({ query: search });
      if (data) {
        queryAllUserList.value = data.list ?? [];
      }
    } catch {
      // ignore
    }
  }, 300);
}

function formatDate(value?: string | null) {
  if (!value) return null;
  return value.includes('T') ? value.split('T')[0] : value;
}

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function toInteger(value: unknown, fallback = 0) {
  if (typeof value === 'number') return Number.isFinite(value) ? Math.trunc(value) : fallback;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function calculateVolumeWeight(volume: number) {
  return volume > 0 ? volume * 166 : null;
}

function calculateChargeableWeight(weight: number, volumeWeight: number | null) {
  if (!weight && !volumeWeight) return null;
  return Math.max(weight || 0, volumeWeight || 0);
}

// Helper function to map backend address DTO to component format
function mapAddressToComponent(address: any, addressType = '') {
  if (!address || typeof address !== 'object') {
    return addressType ? { add_address_type: addressType } : {};
  }

  const addressLine3 = [address.e2_city, address.e2_state, address.e2_postcode].filter(Boolean).join(' ').trim();

  return {
    id: toInteger(address.id),
    pk: address.e2_pk || '',
    add_address: address.e2_pk || '',
    add_address_type: address.e2_addresstype || addressType || '',
    add_address_code: address.e2_oa_address || '',
    add_address_short_code: address.e2_oa_address || '',
    add_address_name: address.e2_companyname || address.e2_oa_address || '',
    add_contact: address.e2_contact || '',
    add_address_override: address.e2_addressoverride != null ? String(address.e2_addressoverride) : '',
    add_address1: address.e2_address1 || '',
    add_address2: address.e2_address2 || '',
    add_address3: addressLine3,
    add_city: address.e2_city || '',
    add_postal_code: address.e2_postcode || '',
    add_state: address.e2_state || '',
    add_country_code: address.e2_rn_nkcountrycode || '',
    add_phone: address.e2_phone || '',
    add_mobile: address.e2_mobile || '',
    add_fax: address.e2_fax || '',
    add_email: address.e2_email || '',
    add_gov_reg_num: address.e2_govregnum || '',
    ...address
  };
}

function mapContainerToComponent(container: any, index: number) {
  const grossWeight = toNumber(container.pac_gross_weight ?? container.jc_grossweight, 0);
  const actualVolume = toNumber(container.pac_actual_volume ?? container.jc_grossvolume, 0);

  return {
    ...container,
    id: toInteger(container.id),
    pk: container.jc_pk || '',
    ctr_shipment: container.jc_containerjobid || '',
    ctr_booking: '',
    ctr_is_active: container.jc_isvalid ?? 1,
    ctr_is_seal_ok: container.jc_issealok ?? 1,
    ctr_is_soc: container.jc_isshipperowned ?? 0,
    ctr_is_damaged: container.jc_isdamaged ?? 0,
    ctr_container_mode: container.jc_containermode || 'FCL',
    ctr_container_status: container.jc_containerstatus || '',
    ctr_container_quality: container.jc_containerquality || '',
    ctr_count: toInteger(container.jc_containercount, 1) || 1,
    ctr_type: container.jc_rc || container.jc_f3_nkpacktype || '20GP',
    ctr_container_num: container.jc_containernum || '',
    ctr_seal_num: container.jc_sealnum || '',
    ctr_description: container.jc_description || '',
    ctr_pack_type: container.jc_f3_nkpacktype || '',
    ctr_container_storage_location: container.jc_containerstoragelocation || '',
    ctr_purpose: container.jc_purpose || '',
    ctr_delivery_mode: container.jc_deliverymode || '',
    ctr_shipping_line: container.jc_oh_shippingline || '',
    ctr_pack_date: formatDate(container.jc_packdate),
    ctr_release_num: container.jc_releasenum || '',
    ctr_empty_required: container.jc_emptyrequired || '',
    ctr_cy_empty_pickup: formatDate(container.jc_containeryardemptypickupgateout),
    ctr_cy_empty_return: formatDate(container.jc_containeryardemptyreturngatein),
    ctr_fcl_gate_in: formatDate(container.jc_fclwharfgatein),
    ctr_fcl_on_board_vessel: container.jc_fclonboardvessel || '',
    ctr_fcl_unload_from_vessel: formatDate(container.jc_fclunloadfromvessel),
    ctr_fcl_available: formatDate(container.jc_fclavailable),
    ctr_fcl_gate_out: formatDate(container.jc_fclwharfgateout),
    ctr_arrival_cto_storage_start_date: formatDate(container.jc_arrivalctostoragestartdate),
    ctr_empty_returned_by: formatDate(container.jc_emptyreturnedby),
    ctr_height: container.jc_totalheight ?? undefined,
    ctr_length: container.jc_totallength ?? undefined,
    ctr_width: container.jc_totalwidth ?? undefined,
    ctr_total_uom: container.jc_totalunitofmeasure || '',
    ctr_gross_weight: grossWeight,
    ctr_gross_weight_uom: container.jc_grossweightuq || '',
    ctr_tare_weight: container.jc_tareweight ?? undefined,
    ctr_volume: actualVolume,
    ctr_volume_uom: container.jc_grossvolumeuq || '',
    ctr_container_notes: container.jc_containernotes || '',
    ctr_delivery_sequence: container.jc_deliverysequence ?? index + 1,
    ctr_seal_party: container.jc_sealparty || '',
    ctr_empty_return_reference: container.jc_emptyreturnreference || '',
    pac_commodity: container.pac_commodity || container.jc_rh_nkcontainercommoditycode || '',
    pac_gross_weight: grossWeight,
    pac_actual_volume: actualVolume,
    pac_package_count: toInteger(container.pac_package_count, 0),
    pac_pack_type: container.pac_pack_type || container.jc_f3_nkpacktype || 'CTN',
    pac_description: container.pac_description || container.jc_description || ''
  };
}

function mapLooseToComponent(loose: any) {
  const grossWeight = toNumber(loose.pac_gross_weight ?? loose.jl_actualweight, 0);
  const actualVolume = toNumber(loose.pac_actual_volume ?? loose.jl_actualvolume, 0);
  const volumeWeight =
    loose.pac_volume_weight != null ? toNumber(loose.pac_volume_weight, 0) : calculateVolumeWeight(actualVolume);
  const chargeableWeight =
    loose.pac_chargeable_weight != null
      ? toNumber(loose.pac_chargeable_weight, 0)
      : calculateChargeableWeight(grossWeight, volumeWeight);

  return {
    ...loose,
    id: toInteger(loose.id),
    pk: loose.jl_pk || '',
    pac_is_active: loose.jl_isvalid ?? 1,
    pac_shp: loose.jl_js || '',
    pac_bkg: '',
    pac_package_count: toInteger(loose.pac_package_count ?? loose.jl_packagecount, 0),
    pac_pack_type: loose.pac_pack_type || loose.jl_f3_nkpacktype || 'CTN',
    pac_container_packing_order: loose.jl_containerpackingorder ?? undefined,
    pac_gross_weight: grossWeight,
    pac_weight_unit: loose.jl_actualweightuq || '',
    pac_chargeable_weight: chargeableWeight,
    pac_volume_weight: volumeWeight,
    pac_length: toNumber(loose.jl_length, 0),
    pac_height: toNumber(loose.jl_height, 0),
    pac_width: toNumber(loose.jl_width, 0),
    pac_uom: loose.jl_unitofdimension || 'M3',
    pac_actual_volume: actualVolume,
    pac_actual_volume_uom: loose.jl_actualvolumeuq || '',
    pac_description: loose.jl_description || loose.jl_detaileddescription || '',
    pac_harmonised_code: loose.jl_harmonisedcode || '',
    pac_commodity: loose.pac_commodity || loose.jl_rh_nkcommoditycode || '',
    pac_marks_and_numbers: loose.jl_marksandnumbers || '',
    pac_ref_number: loose.jl_refnumber || ''
  };
}

const queryData = async () => {
  try {
    cardLoading.value = true;
    const pk = route.params.pk as string;
    console.log('pk: ', pk);

    if (pk) {
      const response = (await getShipmentDetail(pk)) as any;
      console.log('Detail response:', response);
      const data = response?.data;
      if (data) {
        const containersList = (data.containers_list || []).map((container: any, index: number) =>
          mapContainerToComponent(container, index)
        );
        const looseList = (data.loose_list || []).map((loose: any) => mapLooseToComponent(loose));
        const volumeWeight = calculateVolumeWeight(toNumber(data.js_actualvolume, 0));
        const firstContainer = containersList[0];
        const estimatedDeliveryDate = formatDate(data.js_reviseddeliveryduedate) || formatDate(data.js_deliveryduedate);
        const marksAndNumbers = looseList.find((item: any) => item.pac_marks_and_numbers)?.pac_marks_and_numbers || '';

        // Map ShipmentDetail to shipment save/inputData format
        inputData.value = {
          id: typeof data.id === 'number' ? data.id : data.id ? parseInt(data.id as string) : 0,
          pk: data.js_pk || pk || '',
          shp_is_cancelled: data.js_iscancelled || 0,
          shp_shipment_status: data.js_shipmentstatus || '',
          shp_phase: data.js_phase || '',
          shp_consign_no: data.js_uniqueconsignref || '',
          shp_cargo_receipt: data.js_interimreceipt || '',
          shp_consol_reference: data.js_consolreference || '',
          js_jx: data.js_jx || '',
          shp_house_bill: data.js_housebill || '',
          shp_shipment_type: data.js_shipmenttype || '',
          shp_transport_mode: data.js_transportmode || 'SEA',
          shp_packing_mode: data.js_packingmode || 'FCL',
          shp_container_type: data.js_packingmode || 'FCL',
          shp_is_direct_booking: data.js_isdirectbooking || 0,
          shp_is_forward_registered: data.js_isforwardregistered || 0,
          shp_booking_reference: data.js_bookingreference || '',
          shp_booking_no: data.js_bookingreference || '',
          shp_goods_description: data.js_goodsdescription || '',
          shp_goods_value: toNumber(data.js_goodsvalue, 0),
          shp_cargo_value: toNumber(data.js_goodsvalue, 0),
          shp_goods_value_currency: data.js_rx_nkgoodsvaluecurr || '',
          shp_insurance_value: toNumber(data.js_insurancevalue, 0),
          shp_insurance_currency: data.js_rx_nkinsurancecurrency || '',
          shp_packing_order: data.js_packingorder != null ? String(data.js_packingorder) : '',
          shp_release_type: data.js_releasetype || '',
          shp_export_depot_address: data.js_oa_exportreceivingdepot || '',
          shp_import_depot_address: data.js_oa_importreleasedepot || '',
          shp_booking_party: data.js_oh_handledonbehalfofforwarder || '',
          shp_tranship_agent_name: data.js_oh_transhipagent || '',
          shp_delivery_agent_name: data.js_oh_deliveryagent || '',
          shp_a_rcv: formatDate(data.js_a_rcv),
          shp_origin: data.js_rl_nkorigin || '',
          shp_destination: data.js_rl_nkdestination || '',
          shp_place_of_receipt: data.js_rl_nkplaceofreceipt || '',
          shp_place_of_delivery: data.js_rl_nkplaceofdischarge || '',
          shp_load_port: data.js_rl_nkloadport || '',
          shp_discharge_port: data.js_rl_nkdischargeport || '',
          shp_etd: formatDate(data.js_e_dep),
          shp_eta: formatDate(data.js_e_arv),
          shp_est_pickup: formatDate(data.js_exportreceivingdepotdispatchrequested) || formatDate(data.js_a_rcv),
          shp_est_delivery: estimatedDeliveryDate,
          shp_client_requested_eta: formatDate(data.js_clientrequestedeta),
          shp_freight_terms: data.js_hblawbchargesdisplay || '',
          shp_service_level: data.js_rs_nkservicelevel || '',
          shp_inco: data.js_inco || '',
          shp_inco_terms: data.js_inco || '',
          shp_additional_terms: data.js_additionalterms || '',
          shp_actual_volume: toNumber(data.js_actualvolume, 0),
          shp_unit_of_volume: data.js_unitofvolume || 'M3',
          shp_actual_weight: toNumber(data.js_actualweight, 0),
          shp_unit_of_weight: data.js_unitofweight || 'KG',
          shp_actual_chargeable:
            toNumber(data.js_actualchargeable, 0) ||
            calculateChargeableWeight(toNumber(data.js_actualweight, 0), volumeWeight) ||
            0,
          shp_volume_weight: volumeWeight || 0,
          shp_volume_factor: 166,
          js_outerpacks: toInteger(data.js_outerpacks, 0),
          shp_pack_type: data.js_f3_nktotalcountpacktype || data.js_f3_nkpacktype || 'CTN',
          shp_shipped_on_board: data.js_shippedonboard || '',
          shp_shipped_on_board_date: formatDate(data.js_shippedonboarddate),
          shp_on_board_date: formatDate(data.js_shippedonboarddate),
          js_hblcontainerpackmodeoverride: data.js_hblcontainerpackmodeoverride || '',
          shp_warehouse_location: data.js_warehouselocation || '',
          shp_coload_master_shipment: data.js_js_coloadmastershipment || '',
          shp_split_switch_shipment: data.js_js_splitswitchshipment || '',
          shp_is_split_shipment: data.js_issplitshipment || 0,
          shp_one_time_quote: data.js_th_onetimequote || '',
          shp_carrier_contract_number: data.js_carriercontractnumber || '',
          shp_contact_no: data.js_carriercontractnumber || '',
          shp_preferred_carrier: data.js_oa_bookedshippinglineaddress || '',
          shp_carrier: data.js_oa_bookedshippinglineaddress || '',
          shp_booking_allocation_line: data.js_rca_bookingallocationline || '',
          shp_company_tariff_level:
            data.js_companytariffleveloverride != null ? String(data.js_companytariffleveloverride) : '',
          shp_commodity: data.js_rh_nkratecommodity || '',
          shp_gateway_service_level: data.js_rs_nkgatewayservicelevel || '',
          shp_delivery_due_date: estimatedDeliveryDate,
          shp_transit_time: toInteger(data.js_rtt_transittime, 0),
          shp_transit_time_unit: 'DAYS',
          shp_so_confirm_date: formatDate(data.js_a_bkd),
          shp_vgm_cut_off_date: null,
          shp_doc_cut_off_date: formatDate(data.js_attachedorderxmlupdatecutoffdateutc),
          shp_port_cargo_cut_off_date: null,
          shp_marks_nos: marksAndNumbers,
          shp_marks_numbers: marksAndNumbers,
          shp_gate_in_date: firstContainer?.ctr_fcl_gate_in || null,
          shp_vgm:
            containersList.reduce((sum: number, item: any) => sum + toNumber(item.ctr_gross_weight, 0), 0) ||
            toNumber(data.js_actualweight, 0),
          shp_vessel: '',
          shp_voyage: '',
          // Address objects
          shipper: data.shipper ?? {},
          consignee: data.consignee ?? {},
          notify_party: data.notify_party ?? {},
          notify_party1: data.notify_party ?? {},
          // Lists
          containers_list: containersList,
          loose_list: looseList,
          po_lines_list: [],
          notes_list: [],
          ar_charges: [],
          ap_charges: [],
          routing_list: [],
          consolidation_list: [],
          doc_data: data.doc_data || {},
          pickup: mapAddressToComponent(data.pickup, 'PICKUP'),
          delivery: mapAddressToComponent(data.delivery, 'DELIVERY')
        };
        skeletonLoading.value = false;
        console.log('Mapped inputData:', inputData.value);
        // Update tab label with shipment_no
        if (inputData.value.shp_consign_no) {
          tabStore.setTabLabel($t('page.business.shipment.tab.shipment') + ` - ${inputData.value.shp_consign_no}`);
        }
      } else {
        showShipmentEmptyDialog();
      }
    } else {
      skeletonLoading.value = false;
    }
  } catch (error) {
    console.log('Error fetching detail:', error);
  } finally {
    cardLoading.value = false;
  }
};
queryData();

// --- Dialogs ---
function showShipmentEmptyDialog() {
  window.$dialog?.warning({
    title: $t('page.business.shipment.dialog.shipmentNotExists.title'),
    content: $t('page.business.shipment.dialog.shipmentNotExists.message'),
    positiveText: $t('page.business.shipment.dialog.shipmentNotExists.newShipment'),
    negativeText: $t('common.close'),
    onPositiveClick: () => {
      router.push({ name: 'business_shipment-new' });
    },
    onNegativeClick: () => {
      router.push({ name: 'business_shipment' });
    }
  });
}

function showPdfDialog(url: string) {
  window.$dialog?.info({
    title: 'BILL of LADING',
    content: () =>
      h('iframe', {
        src: url,
        width: '100%',
        height: '600px',
        style: 'border:none'
      }),
    positiveText: $t('common.close'),
    style: { width: '800px' }
  });
}

// --- Save handlers ---
const saveShipmentTab = async () => {
  const { data } = await shipmentSave({ ...inputData.value });
  if (data) {
    inputData.value.id = data.id ?? 0;
    inputData.value.pk = data.pk;
    window.$message?.success($t('common.saveSuccess'));
  }
};

const saveAdditionalDetailsTab = async () => {
  await saveShipmentTab();
};

const saveRoutingTab = async () => {
  window.$message?.info($t('page.business.shipment.routing.readOnly'));
};

const refreshBillingSummary = ref(false);
const saveBillingTab = async (): Promise<boolean> => {
  if (!inputData.value.pk) {
    window.$message?.warning('Shipment PK is required.');
    return false;
  }

  try {
    const { data } = await createOrUpdateBilling({
      shpPk: inputData.value.pk,
      charges: [
        ...(inputData.value.ar_charges || []).map((item: any) => mapChargeRowToWriteItem(item, 'AR')),
        ...(inputData.value.ap_charges || []).map((item: any) => mapChargeRowToWriteItem(item, 'AP'))
      ]
    });
    if (data) {
      refreshBillingSummary.value = true;
      window.$message?.success('Successfully saved billing records.');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to save billing:', error);
    window.$message?.error('Failed to save billing records.');
    return false;
  }
};

const saveEDocsTab = async () => {
  window.$message?.info('eDocs save is not implemented yet.');
};

const saveLogsTab = async () => {
  window.$message?.info('Logs are read-only.');
};

const onSaveHandle = async () => {
  // Get formRef from TabShipment component
  const shipmentComp = document.querySelector('[data-shipment-tab]');
  if (shipmentComp && (shipmentComp as any).__vueParentComponent) {
    // Try to get the form ref from the component
  }

  switch (activedTab.value) {
    case 1:
      await saveShipmentTab();
      break;
    case 2:
      await saveAdditionalDetailsTab();
      break;
    case 3:
      await saveRoutingTab();
      break;
    case 4:
      await saveBillingTab();
      break;
    case 5:
      await saveEDocsTab();
      break;
    case 6:
      await saveLogsTab();
      break;
    default:
      break;
  }
};

const handleTabChange = async (newTab: number) => {
  if (newTab === activedTab.value) return;

  if (activedTab.value === 1 && newTab !== 1) {
    if (!inputData.value.id || !inputData.value.pk) {
      window.$message?.error($t('page.business.shipment.messages.saveFirst'));
      return;
    }
  }
  activedTab.value = newTab;
};

// --- PDF ---
const handlePrint = async (payload?: { url: string; urls: string[] }) => {
  if (payload?.url) {
    showPdfDialog(payload.url);
    return;
  }
  try {
    cardLoading.value = true;
    await saveShipmentTab();
    const { data } = await shipmentPdfGenerate({
      business_id: inputData.value.id,
      business_pk: inputData.value.pk,
      template_code: 'PDF_SHP_000001',
      version_no: 'v1'
    });
    if (data) {
      const url = import.meta.env.VITE_APP_BASE_API + data.pdfPath;
      showPdfDialog(url);
    }
  } catch (error) {
    console.log(error);
  } finally {
    cardLoading.value = false;
  }
};
</script>

<template>
  <div class="p-16px">
    <NCard :title="tabTitle">
      <template #header-extra>
        <NButton type="primary" :loading="cardLoading" :disabled="cardLoading" @click.stop="onSaveHandle">
          {{ $t('common.save') }}
        </NButton>
      </template>

      <NTabs v-model:value="activedTab" type="line" @update:value="handleTabChange">
        <NTabPane :name="1" :tab="$t('page.business.shipment.tab.shipment')">
          <NSkeleton v-if="skeletonLoading" text :row="20" />
          <TabShipment
            v-else
            :input-data="inputData"
            :query-port-list="queryPortList"
            :query-all-user-list="queryAllUserList"
            @query-port="queryPort"
            @query-user="queryUser"
          />
        </NTabPane>
        <NTabPane :name="2" :tab="$t('page.business.shipment.tab.additionalDetails')">
          <NSkeleton v-if="skeletonLoading" text :row="10" />
          <TabAdditionalDetails v-else :input-data="inputData" />
        </NTabPane>
        <NTabPane :name="3" :tab="$t('page.business.shipment.tab.routing')">
          <NSkeleton v-if="skeletonLoading" text :row="5" />
          <TabRouting v-else :input-data="inputData" />
        </NTabPane>
        <NTabPane :name="4" :tab="$t('page.business.shipment.tab.billing')">
          <NSkeleton v-if="skeletonLoading" text :row="10" />
          <TabBilling
            v-else
            v-model:refresh-billing-summary="refreshBillingSummary"
            :input-data="inputData"
            @print="handlePrint"
          />
        </NTabPane>
        <NTabPane :name="5" :tab="$t('page.business.shipment.tab.eDocs')">
          <NSkeleton v-if="skeletonLoading" text :row="5" />
          <TabEDocs v-else :input-data="inputData" />
        </NTabPane>
        <NTabPane :name="6" :tab="$t('page.business.shipment.tab.logs')">
          <NSkeleton v-if="skeletonLoading" text :row="5" />
          <TabLogs v-else :input-data="inputData" />
        </NTabPane>
      </NTabs>
    </NCard>
  </div>
</template>
