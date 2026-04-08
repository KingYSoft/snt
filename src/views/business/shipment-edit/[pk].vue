<script setup lang="ts">
import { ref, h, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { NCard, NButton, NTabs, NTabPane, NSkeleton } from 'naive-ui';
import { $t } from '@/locales';
import { useTabStore } from '@/store/modules/tab';
import { shipmentSave, shipmentTbl, shipmentPdfGenerate, shipmentQueryPortCode } from '@/service/api/business/shipment';
import { createOrUpdateBilling } from '@/service/api/business/billing';
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
  shipper: {},
  consignee: {},
  notify_party: {},
  notify_party1: {},
  containers_list: [],
  loose_list: [],
  po_lines_list: [],
  notes_list: [],
  ar_charges: [],
  ap_charges: [],
  shp_unit_of_weight: 'KG',
  shp_unit_of_volume: 'M3',
  shp_transit_time_unit: 'DAYS',
  shp_pack_type: 'CTN',
  shp_is_forward_registered: 1,
  routing_list: [],
  consolidation_list: [],
  doc_data: {},
  pickup: {},
  delivery: {}
});

const inputData = ref(defaultData());

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

const queryData = async () => {
  try {
    cardLoading.value = true;
    const pk = route.params.pk as string;
    const id = route.query.id as string;

    if (pk && id) {
      const { data } = await shipmentTbl({
        filters: [
          { key: 'id', op: '=', val: id },
          { key: 'pk', op: '=', val: pk }
        ],
        skipCount: 0,
        maxResultCount: 1
      });
      skeletonLoading.value = false;
      if (data && data.items && data.items.length > 0) {
        const el = data.items[0];
        inputData.value = Object.assign(el, {
          shipper: el.shipper || {},
          consignee: el.consignee || {},
          notify_party: el.notify_party || {},
          notify_party1: el.notify_party1 || {},
          containers_list: el.containers_list || [],
          loose_list: el.loose_list || [],
          shp_unit_of_weight: el.shp_unit_of_weight || 'KG',
          shp_unit_of_volume: el.shp_unit_of_volume || 'M3',
          shp_pack_type: el.shp_pack_type || 'CTN',
          shp_transit_time_unit: el.shp_transit_time_unit || 'DAYS',
          po_lines_list: el.po_lines_list || [],
          ar_charges: el.ar_charges || [],
          ap_charges: el.ap_charges || [],
          pk: el.pk || '',
          routing_list: el.routing_list || [],
          consolidation_list: el.consolidation_list || [],
          doc_data: el.doc_data || {},
          pickup: el.pickup || {},
          delivery: el.delivery || {}
        });
        if (inputData.value.po_lines_list?.length > 0) {
          inputData.value.po_lines_list.forEach((line: any, idx: number) => {
            line.line_no = idx + 1;
          });
        }
        // Update tab label with ship_no
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
    console.log(error);
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
  if (!inputData.value.pk) {
    window.$message?.warning('Shipment PK is required.');
    return;
  }
  await saveShipmentTab();
};

const refreshBillingSummary = ref(false);
const saveBillingTab = async () => {
  if (!inputData.value.pk) {
    window.$message?.warning('Shipment PK is required.');
    return;
  }

  const buildCharges = (items: any[], chargeType: string) => {
    const isAR = chargeType === 'AR';
    return items
      .filter((item: any) => !item.is_locked)
      .map((item: any) => ({
        id: item.id && item.id > 0 ? item.id : 0,
        pk: item.pk || '',
        jch_charge_code: item.Charge_Code,
        jch_charge_desc: item.Description,
        jch_branch: item.Branch,
        jch_product_quantity: item.Qty,
        jch_estimated_cost: item.Estimated_Cost,
        jch_line_type: chargeType,
        ...(isAR && {
          jch_sell_account: item.Debtor,
          jch_sell_currency: item.Currency,
          jch_sell_rated: item.Unit_Price,
          jch_ts_sell_amt: item.Amount,
          jch_a9_sell_vat_class: item.Tax_Code,
          jch_ts_sell_wht_amt: item.Tax_Amount,
          jch_ts_sell_ex_rate: item.Exchange_Rate,
          jch_home_sell_amt: item.Home_Amount
        }),
        ...(!isAR && {
          jch_cost_account: item.Creditor,
          jch_cost_currency: item.Currency,
          jch_cost_rated: item.Unit_Price,
          jch_ts_cost_amt: item.Amount,
          jch_a9_cost_vat_class: item.Tax_Code,
          jch_ts_cost_wht_amt: item.Tax_Amount,
          jch_ts_cost_ex_rate: item.Exchange_Rate,
          jch_home_cost_amt: item.Home_Amount
        })
      }));
  };

  const arCharges = buildCharges(inputData.value.ar_charges || [], 'AR');
  const apCharges = buildCharges(inputData.value.ap_charges || [], 'AP');

  if (arCharges.length + apCharges.length === 0) {
    window.$message?.warning($t('page.business.shipment.billing.noRecords'));
    return;
  }

  try {
    const { data } = await createOrUpdateBilling({
      shp_pk: inputData.value.pk,
      charges: [...arCharges, ...apCharges]
    });
    if (data) {
      refreshBillingSummary.value = true;
      window.$message?.success('Successfully saved billing records.');
    }
  } catch (error) {
    console.error('Failed to save billing:', error);
    window.$message?.error('Failed to save billing records.');
    throw error;
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
const handlePrint = async () => {
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
        <div class="flex gap-2">
          <NButton type="primary" :disabled="cardLoading" @click.stop="onSaveHandle">
            {{ $t('common.save') }}
          </NButton>
        </div>
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
          <TabBilling v-else :input-data="inputData" @print="handlePrint" />
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
