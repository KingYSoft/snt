<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { NCard, NButton, NTabs, NTabPane } from 'naive-ui';
import { $t } from '@/locales';
import { shipmentSave, shipmentQueryPortCode } from '@/service/api/business/shipment';
import { createOrUpdateBilling } from '@/service/api/business/billing';
import TabShipment from '../shipment/modules/tab-shipment.vue';
import TabAdditionalDetails from '../shipment/modules/tab-additional-details.vue';
import TabRouting from '../shipment/modules/tab-routing.vue';
import TabBilling from '../shipment/modules/tab-billing.vue';
import TabEDocs from '../shipment/modules/tab-edocs.vue';
import TabLogs from '../shipment/modules/tab-logs.vue';

const router = useRouter();

const cardLoading = ref(false);
const activedTab = ref(1);
const defaultData = () => ({
  id: 0,
  pk: '',
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

const handleBack = () => {
  router.push({ name: 'business_shipment' });
};
</script>

<template>
  <div class="p-16px">
    <NCard title="New Shipment">
      <template #header-extra>
        <div class="flex gap-2">
          <NButton @click.stop="handleBack">{{ $t('common.backToHome') }}</NButton>
          <NButton type="primary" :disabled="cardLoading" @click.stop="onSaveHandle">
            {{ $t('common.save') }}
          </NButton>
        </div>
      </template>

      <NTabs v-model:value="activedTab" type="line" @update:value="handleTabChange">
        <NTabPane :name="1" :tab="$t('page.business.shipment.tab.shipment')">
          <TabShipment
            :input-data="inputData"
            :query-port-list="queryPortList"
            :query-all-user-list="queryAllUserList"
            @query-port="queryPort"
            @query-user="queryUser"
          />
        </NTabPane>
        <NTabPane :name="2" :tab="$t('page.business.shipment.tab.additionalDetails')">
          <TabAdditionalDetails :input-data="inputData" />
        </NTabPane>
        <NTabPane :name="3" :tab="$t('page.business.shipment.tab.routing')">
          <TabRouting :input-data="inputData" />
        </NTabPane>
        <NTabPane :name="4" :tab="$t('page.business.shipment.tab.billing')">
          <TabBilling :input-data="inputData" />
        </NTabPane>
        <NTabPane :name="5" :tab="$t('page.business.shipment.tab.eDocs')">
          <TabEDocs :input-data="inputData" />
        </NTabPane>
        <NTabPane :name="6" :tab="$t('page.business.shipment.tab.logs')">
          <TabLogs :input-data="inputData" />
        </NTabPane>
      </NTabs>
    </NCard>
  </div>
</template>
