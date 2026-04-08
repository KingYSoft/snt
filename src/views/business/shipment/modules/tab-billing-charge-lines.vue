<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */
import { h, ref, computed, watch } from 'vue';
import {
  NDataTable,
  NButton,
  NInput,
  NInputNumber,
  NAutoComplete,
  NCard,
  NSpace,
  NModal,
  NCheckbox,
  NTag
} from 'naive-ui';
import { $t } from '@/locales';
import {
  billingQueryPage,
  chargeCodeOptions,
  currencyOptions,
  generateDraft,
  deleteBilling
} from '@/service/api/business/shipment';

const props = defineProps<{ inputData: Record<string, any> }>();
const emit = defineEmits<{
  (e: 'update:arCharges', value: any[]): void;
  (e: 'update:apCharges', value: any[]): void;
}>();

const tblSelectedAR = ref<any[]>([]);
const tblSelectedAP = ref<any[]>([]);
const arCompleted = ref(false);
const apCompleted = ref(false);
const confirmDeleteVis = ref(false);
const deleteIndex = ref<number | null>(null);
const deleteType = ref<'AR' | 'AP'>('AR');

// --- Remote lookup data ---
const chargeCodeList = ref<Array<{ code: string; description: string }>>([]);
const currencyList = ref<Array<{ code: string; desc: string }>>([]);
const chargeCodeOpts = computed(() =>
  chargeCodeList.value.map(c => ({
    label: `${c.code} - ${c.description}`,
    value: c.code
  }))
);
const currencyOpts = computed(() =>
  currencyList.value.map(c => ({
    label: `${c.code} - ${c.desc}`,
    value: c.code
  }))
);

let chargeSearchTimer: ReturnType<typeof setTimeout> | null = null;
let currencySearchTimer: ReturnType<typeof setTimeout> | null = null;

function searchChargeCode(query: string) {
  if (chargeSearchTimer) clearTimeout(chargeSearchTimer);
  chargeSearchTimer = setTimeout(async () => {
    if (!query) {
      chargeCodeList.value = [];
      return;
    }
    try {
      const { data } = await chargeCodeOptions();
      if (data) chargeCodeList.value = Array.isArray(data) ? data : [];
    } catch {
      /* ignore */
    }
  }, 300);
}

function searchCurrency(query: string) {
  if (currencySearchTimer) clearTimeout(currencySearchTimer);
  currencySearchTimer = setTimeout(async () => {
    if (!query) {
      currencyList.value = [];
      return;
    }
    try {
      const { data } = await currencyOptions();
      if (data) currencyList.value = Array.isArray(data) ? data : [];
    } catch {
      /* ignore */
    }
  }, 300);
}

// --- Load ---
async function loadBillingData(chargeType: 'AR' | 'AP') {
  if (!props.inputData.pk) return;
  try {
    const { data } = await billingQueryPage({
      shpPk: props.inputData.pk,
      chargeType,
      SkipCount: 0,
      MaxResultCount: 1000
    });
    if (data) {
      const items = data.items ?? [];
      const isAR = chargeType === 'AR';
      const mapped = items.map((item: any) => ({
        id: item.id,
        pk: item.pk,
        Charge_Code: item.jch_charge_code || '',
        Description: item.jch_charge_desc || '',
        Branch: item.branch_code || '',
        Currency: isAR ? item.jch_sell_currency : item.jch_cost_currency,
        Unit_Price: isAR ? item.jch_sell_rated : item.jch_cost_rated,
        Qty: item.jch_product_quantity,
        Amount: isAR ? item.jch_ts_sell_amt : item.jch_ts_cost_amt,
        Tax_Code: isAR ? item.jch_a9_sell_vat_class : item.jch_a9_cost_vat_class,
        Tax_Amount: isAR ? item.jch_ts_sell_wht_amt : item.jch_ts_cost_wht_amt,
        Estimated_Cost: item.jch_estimated_cost,
        Exchange_Rate: isAR ? item.jch_ts_sell_ex_rate : item.jch_ts_cost_ex_rate,
        Home_Amount: isAR ? item.jch_home_sell_amt : item.jch_home_cost_amt,
        is_locked: item.jch_is_locked === 1,
        ...(isAR ? { Debtor: item.jch_sell_account } : { Creditor: item.jch_cost_account })
      }));
      if (isAR) emit('update:arCharges', mapped);
      else emit('update:apCharges', mapped);
    }
  } catch {
    /* ignore */
  }
}

function loadAll() {
  loadBillingData('AR');
  loadBillingData('AP');
  searchChargeCode('*');
  searchCurrency('*');
}

// Auto-load when pk changes
watch(
  () => props.inputData.pk,
  pk => {
    if (pk) loadAll();
  },
  { immediate: true }
);

// --- Add line ---
function generateNewId(items: any[]) {
  if (!items || items.length === 0) return -1;
  const minId = items.reduce((min: number, item: any) => Math.min(item.id ?? 0, min), 0);
  return minId > 0 ? -1 : minId - 1;
}

function addChargeLine(type: 'AR' | 'AP') {
  const list = type === 'AR' ? props.inputData.ar_charges : props.inputData.ap_charges;
  if (!list) {
    if (type === 'AR') props.inputData.ar_charges = [];
    else props.inputData.ap_charges = [];
  }
  const target = type === 'AR' ? props.inputData.ar_charges : props.inputData.ap_charges;
  if (target.length > 0) {
    const last = target[target.length - 1];
    target.push({
      id: generateNewId(target),
      Charge_Code: last.Charge_Code,
      Description: last.Description,
      ...(type === 'AR' ? { Debtor: last.Debtor } : { Creditor: last.Creditor }),
      Branch: last.Branch,
      Currency: last.Currency,
      Unit_Price: last.Unit_Price,
      Qty: last.Qty,
      Amount: 0,
      Tax_Code: last.Tax_Code,
      Tax_Amount: last.Tax_Amount,
      Estimated_Cost: last.Estimated_Cost,
      Exchange_Rate: last.Exchange_Rate,
      Home_Amount: 0,
      is_locked: false
    });
  } else {
    target.push({
      id: generateNewId(target),
      Charge_Code: '',
      Description: '',
      Debtor: '',
      Creditor: '',
      Branch: '',
      Currency: '',
      Unit_Price: 0,
      Qty: 0,
      Amount: 0,
      Tax_Code: '',
      Tax_Amount: 0,
      Exchange_Rate: 1,
      Home_Amount: 0,
      Estimated_Cost: 0,
      is_locked: false
    });
  }
}

// --- Delete ---
function requestDelete(index: number, type: 'AR' | 'AP') {
  deleteIndex.value = index;
  deleteType.value = type;
  confirmDeleteVis.value = true;
}

async function confirmDelete() {
  if (deleteIndex.value === null) return;
  const list = deleteType.value === 'AR' ? props.inputData.ar_charges : props.inputData.ap_charges;
  const item = list?.[deleteIndex.value];
  if (item && item.pk) {
    try {
      await deleteBilling([item.pk]);
      window.$message?.success($t('page.business.shipment.billing.deleteSuccess'));
    } catch {
      window.$message?.error('Delete failed');
    }
  }
  list?.splice(deleteIndex.value, 1);
  confirmDeleteVis.value = false;
  deleteIndex.value = null;
}

// --- Copy ---
function copyAR() {
  const selectedIds = tblSelectedAR.value;
  if (!selectedIds || selectedIds.length === 0) {
    window.$message?.warning($t('page.business.shipment.billing.selectRecords'));
    return;
  }
  const currentItems = props.inputData.ar_charges || [];
  const selectedRows = currentItems.filter((item: any) => selectedIds.includes(item.id));
  const newItems = [...currentItems];
  selectedRows.forEach((item: any) => {
    newItems.push({ ...item, id: generateNewId(newItems), is_locked: false });
  });
  emit('update:arCharges', newItems);
  tblSelectedAR.value = [];
  window.$message?.success($t('page.business.shipment.billing.copySuccess'));
}

function copyAP() {
  const selectedIds = tblSelectedAP.value;
  if (!selectedIds || selectedIds.length === 0) {
    window.$message?.warning($t('page.business.shipment.billing.selectRecords'));
    return;
  }
  const currentItems = props.inputData.ap_charges || [];
  const selectedRows = currentItems.filter((item: any) => selectedIds.includes(item.id));
  const newItems = [...currentItems];
  selectedRows.forEach((item: any) => {
    newItems.push({ ...item, id: generateNewId(newItems), is_locked: false });
  });
  emit('update:apCharges', newItems);
  tblSelectedAP.value = [];
  window.$message?.success($t('page.business.shipment.billing.copySuccess'));
}

function copyToAP() {
  const selectedIds = tblSelectedAR.value;
  if (!selectedIds || selectedIds.length === 0) {
    window.$message?.warning($t('page.business.shipment.billing.selectRecords'));
    return;
  }
  const arItems = props.inputData.ar_charges || [];
  const selectedRows = arItems.filter((item: any) => selectedIds.includes(item.id));
  const currentItems = props.inputData.ap_charges || [];
  const newItems = [...currentItems];
  selectedRows.forEach((item: any) => {
    newItems.push({
      id: generateNewId(newItems),
      Charge_Code: item.Charge_Code,
      Description: item.Description,
      Creditor: item.Debtor,
      Branch: item.Branch,
      Currency: item.Currency,
      Unit_Price: item.Unit_Price,
      Qty: item.Qty,
      Amount: item.Amount,
      Tax_Code: item.Tax_Code,
      Tax_Amount: item.Tax_Amount,
      Estimated_Cost: item.Estimated_Cost,
      Exchange_Rate: item.Exchange_Rate,
      Home_Amount: item.Home_Amount,
      is_locked: false
    });
  });
  emit('update:apCharges', newItems);
  tblSelectedAR.value = [];
  window.$message?.success($t('page.business.shipment.billing.copySuccess'));
}

function copyToAR() {
  const selectedIds = tblSelectedAP.value;
  if (!selectedIds || selectedIds.length === 0) {
    window.$message?.warning($t('page.business.shipment.billing.selectRecords'));
    return;
  }
  const apItems = props.inputData.ap_charges || [];
  const selectedRows = apItems.filter((item: any) => selectedIds.includes(item.id));
  const currentItems = props.inputData.ar_charges || [];
  const newItems = [...currentItems];
  selectedRows.forEach((item: any) => {
    newItems.push({
      id: generateNewId(newItems),
      Charge_Code: item.Charge_Code,
      Description: item.Description,
      Debtor: item.Creditor,
      Branch: item.Branch,
      Currency: item.Currency,
      Unit_Price: item.Unit_Price,
      Qty: item.Qty,
      Amount: item.Amount,
      Tax_Code: item.Tax_Code,
      Tax_Amount: item.Tax_Amount,
      Estimated_Cost: item.Estimated_Cost,
      Exchange_Rate: item.Exchange_Rate,
      Home_Amount: item.Home_Amount,
      is_locked: false
    });
  });
  emit('update:arCharges', newItems);
  tblSelectedAP.value = [];
  window.$message?.success($t('page.business.shipment.billing.copySuccess'));
}

// --- Generate Draft ---
async function handleGenerateDraft(type: 'AR' | 'AP') {
  const selected = type === 'AR' ? tblSelectedAR.value : tblSelectedAP.value;
  const unlocked = (selected || []).filter((item: any) => !item.is_locked);
  if (unlocked.length === 0) {
    window.$message?.warning($t('page.business.shipment.billing.allLocked'));
    return;
  }
  const pks = unlocked.map((item: any) => item.pk).filter(Boolean);
  if (pks.length === 0) {
    window.$message?.warning($t('page.business.shipment.billing.selectRecords'));
    return;
  }
  try {
    await generateDraft({ pks });
    window.$message?.success($t('page.business.shipment.billing.draftSuccess'));
    loadBillingData(type);
    if (type === 'AR') tblSelectedAR.value = [];
    else tblSelectedAP.value = [];
  } catch {
    window.$message?.error('Generate draft failed');
  }
}

// --- Amount calc ---
function calcAmount(item: any) {
  const price = Number.parseFloat(item.Unit_Price) || 0;
  const qty = Number.parseFloat(item.Qty) || 0;
  item.Amount = Number((price * qty).toFixed(2));
}

// --- Columns ---
function makeColumns(type: 'AR' | 'AP') {
  const isAR = type === 'AR';
  return [
    { type: 'selection' as const },
    {
      title: '',
      key: 'actions',
      width: 50,
      align: 'center' as const,
      render(_: any, index: number) {
        return h(
          NButton,
          {
            text: true,
            type: 'error',
            size: 'small',
            onClick: () => requestDelete(index, type)
          },
          { default: () => 'Del' }
        );
      }
    },
    {
      title: 'Status',
      key: 'is_locked',
      width: 80,
      render(row: any) {
        return h(
          NTag,
          { type: row.is_locked ? 'warning' : 'success', size: 'small' },
          { default: () => (row.is_locked ? '1' : '0') }
        );
      }
    },
    {
      title: 'Charge Code',
      key: 'Charge_Code',
      width: 130,
      render(row: any) {
        return h(NAutoComplete, {
          value: row.Charge_Code,
          options: chargeCodeOpts.value,
          size: 'small',
          disabled: row.is_locked,
          getShow: () => true,
          onUpdateValue: (v: string) => {
            row.Charge_Code = v;
          },
          onSelect: (v: string) => {
            row.Charge_Code = v;
            const cc = chargeCodeList.value.find(c => c.code === v);
            if (cc) row.Description = cc.description;
          }
        });
      }
    },
    {
      title: 'Description',
      key: 'Description',
      width: 140,
      render(row: any) {
        return h(NInput, {
          value: row.Description,
          size: 'small',
          disabled: row.is_locked,
          onUpdateValue: (v: string) => {
            row.Description = v;
          }
        });
      }
    },
    {
      title: isAR ? 'Debtor' : 'Creditor',
      key: isAR ? 'Debtor' : 'Creditor',
      width: 120,
      render(row: any) {
        return h(NInput, {
          value: row[isAR ? 'Debtor' : 'Creditor'],
          size: 'small',
          disabled: row.is_locked,
          onUpdateValue: (v: string) => {
            row[isAR ? 'Debtor' : 'Creditor'] = v;
          }
        });
      }
    },
    {
      title: 'Branch',
      key: 'Branch',
      width: 80,
      render(row: any) {
        return h('span', null, row.Branch || '');
      }
    },
    {
      title: 'Currency',
      key: 'Currency',
      width: 80,
      render(row: any) {
        return h(NAutoComplete, {
          value: row.Currency,
          options: currencyOpts.value,
          size: 'small',
          disabled: row.is_locked,
          getShow: () => true,
          onUpdateValue: (v: string) => {
            row.Currency = v;
          }
        });
      }
    },
    {
      title: 'Unit Price',
      key: 'Unit_Price',
      width: 100,
      render(row: any) {
        return h(NInputNumber, {
          value: row.Unit_Price,
          size: 'small',
          disabled: row.is_locked,
          showButton: false,
          style: 'width:100%',
          onUpdateValue: (v: number | null) => {
            row.Unit_Price = v ?? 0;
            calcAmount(row);
          }
        });
      }
    },
    {
      title: 'Qty',
      key: 'Qty',
      width: 70,
      render(row: any) {
        return h(NInputNumber, {
          value: row.Qty,
          size: 'small',
          disabled: row.is_locked,
          showButton: false,
          style: 'width:100%',
          onUpdateValue: (v: number | null) => {
            row.Qty = v ?? 0;
            calcAmount(row);
          }
        });
      }
    },
    {
      title: 'Amount',
      key: 'Amount',
      width: 100,
      render(row: any) {
        return h('span', null, String(((row.Unit_Price || 0) * (row.Qty || 0)).toFixed(2)));
      }
    },
    {
      title: 'Tax Code',
      key: 'Tax_Code',
      width: 90,
      render(row: any) {
        return h('span', null, row.Tax_Code || '');
      }
    },
    {
      title: 'Exch Rate',
      key: 'Exchange_Rate',
      width: 90,
      render(row: any) {
        return h(NInputNumber, {
          value: row.Exchange_Rate,
          size: 'small',
          disabled: row.is_locked,
          showButton: false,
          style: 'width:100%',
          onUpdateValue: (v: number | null) => {
            row.Exchange_Rate = v ?? 0;
          }
        });
      }
    },
    {
      title: 'Home Amt',
      key: 'Home_Amount',
      width: 100,
      render(row: any) {
        return h('span', null, String(((row.Amount || 0) * (row.Exchange_Rate || 1)).toFixed(2)));
      }
    }
  ];
}

const arColumns = makeColumns('AR');
const apColumns = makeColumns('AP');

defineExpose({ loadAll, loadBillingData });
</script>

<template>
  <div>
    <!-- AR Section -->
    <NCard size="small" class="mb-12px">
      <template #header>
        <NSpace align="center" :wrap="false">
          <span class="font-bold">AR (Accounts Receivable)</span>
          <NCheckbox v-model:checked="arCompleted">AR Completed</NCheckbox>
          <NButton size="small" @click="copyAR">Copy</NButton>
          <NButton size="small" @click="copyToAP">Copy to AP</NButton>
          <NButton size="small" @click="handleGenerateDraft('AR')">Generate Draft</NButton>
          <NButton size="small">Template</NButton>
          <NButton type="primary" size="small" @click="addChargeLine('AR')">Add</NButton>
        </NSpace>
      </template>
      <NDataTable
        v-model:checked-row-keys="tblSelectedAR"
        :columns="arColumns"
        :data="inputData.ar_charges || []"
        :bordered="true"
        size="small"
        :row-key="(row: any) => row.id"
        :scroll-x="1400"
        :max-height="300"
        striped
      />
    </NCard>

    <!-- AP Section -->
    <NCard size="small">
      <template #header>
        <NSpace align="center" :wrap="false">
          <span class="font-bold">AP (Accounts Payable)</span>
          <NCheckbox v-model:checked="apCompleted">AP Completed</NCheckbox>
          <NButton size="small" @click="copyAP">Copy</NButton>
          <NButton size="small" @click="copyToAR">Copy to AR</NButton>
          <NButton size="small" @click="handleGenerateDraft('AP')">Generate Draft</NButton>
          <NButton size="small">Template</NButton>
          <NButton type="primary" size="small" @click="addChargeLine('AP')">Add</NButton>
        </NSpace>
      </template>
      <NDataTable
        v-model:checked-row-keys="tblSelectedAP"
        :columns="apColumns"
        :data="inputData.ap_charges || []"
        :bordered="true"
        size="small"
        :row-key="(row: any) => row.id"
        :scroll-x="1400"
        :max-height="300"
        striped
      />
    </NCard>

    <!-- Delete Confirmation Modal -->
    <NModal
      v-model:show="confirmDeleteVis"
      preset="dialog"
      title="Confirm Delete"
      positive-text="Confirm"
      negative-text="Cancel"
      @positive-click="confirmDelete"
    >
      {{ $t('page.business.shipment.billing.confirmDelete') }}
    </NModal>
  </div>
</template>
