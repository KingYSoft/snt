<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */
import { h, ref, computed, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { NDataTable, NButton, NInput, NAutoComplete, NCard, NSpace, NModal, NCheckbox, NTag, NSelect } from 'naive-ui';
import { $t } from '@/locales';
import { useAppStore } from '@/store/modules/app';
import { billingTaxCodeItems } from '@/constants/billingTaxCodeItems';
import RemoteTableMenu from '@/components/business/remote-table-menu.vue';
import { organizationQueryOrgAddress } from '@/service/api/maintain/organization';
import { queryCompanyExchangeRate } from '@/service/api/maintain/company';
import { normalizeBillingExchangeRate } from '@/utils/billing/billingDecimal';
import {
  billingChargeLine,
  billingChargeCodeOptions,
  deleteBilling,
  generateDraft
} from '@/service/api/business/billing';
import {
  matchTransactionsCurrencyOptions,
  parseMatchTransactionsCurrencyOptions
} from '@/service/api/business/match-transactions';
import {
  getBillingLockLabel,
  getBillingLockTagType,
  mapChargeLineItem,
  recalcChargeLineTaxAndHome,
  type ShipmentBillingChargeRow
} from './shipment-billing-map';

const props = defineProps<{
  inputData: Record<string, any>;
  saveBillingFn?: () => Promise<boolean | undefined>;
}>();
const emit = defineEmits<{
  (e: 'update:arCharges', value: ShipmentBillingChargeRow[]): void;
  (e: 'update:apCharges', value: ShipmentBillingChargeRow[]): void;
}>();

const appStore = useAppStore();
const tblSelectedAR = ref<Array<string | number>>([]);
const tblSelectedAP = ref<Array<string | number>>([]);
const arCompleted = ref(false);
const apCompleted = ref(false);
const confirmDeleteVis = ref(false);
const deleteIndex = ref<number | null>(null);
const deleteType = ref<'AR' | 'AP'>('AR');
const loading = ref(false);

const chargeCodeCache = ref<Array<{ code: string; desc: string; charge_type: string }>>([]);
const chargeCodeOpts = ref<Array<{ label: string; value: string }>>([]);
const currencyOpts = ref<Array<{ label: string; value: string }>>([]);

const autocompleteMenuProps = {
  class: 'billing-charge-autocomplete-menu',
  style: { minWidth: '360px', maxWidth: '520px' }
};

function renderAutocompleteLabel(option: { label?: string; value?: string | number }) {
  return h(
    'span',
    { class: 'billing-charge-autocomplete-label', title: String(option.label ?? option.value ?? '') },
    String(option.label ?? option.value ?? '')
  );
}

const searchChargeCodes = useDebounceFn(async (query: string) => {
  try {
    const { data } = await billingChargeCodeOptions({ query: query || undefined });
    const items = data ?? [];
    chargeCodeCache.value = items;
    chargeCodeOpts.value = items.map(c => ({
      label: `${c.code} - ${c.desc}`,
      value: c.code
    }));
  } catch {
    chargeCodeCache.value = [];
    chargeCodeOpts.value = [];
  }
}, 300);

const searchCurrencies = useDebounceFn(async (query: string) => {
  try {
    const res = await matchTransactionsCurrencyOptions({ query: query || '' });
    currencyOpts.value = parseMatchTransactionsCurrencyOptions(res);
  } catch {
    currencyOpts.value = [];
  }
}, 300);
const taxCodeOpts = billingTaxCodeItems.map(item => ({ label: item.code, value: item.code }));
const lineTypeOpts = [
  { label: 'FIN', value: 'FIN' },
  { label: 'CUR', value: 'CUR' }
];

const debtorHeaders = [
  { title: 'Code', key: 'org_code', minWidth: '100px' },
  { title: 'Company Name', key: 'company_name', minWidth: '200px' }
];

function normalizeOrgAddressRow(row: Record<string, unknown>) {
  return {
    org_code: String(row.org_code ?? row.oH_Code ?? row.oh_code ?? '').trim(),
    company_name: String(row.company_name ?? row.oH_FullName ?? row.oh_fullname ?? '').trim(),
    address1: row.address1 ?? row.oa_address1,
    address2: row.address2 ?? row.oa_address2,
    address3: row.address3 ?? row.oa_address3
  };
}

function buildDefaultDebtorItems() {
  const src = [
    {
      org_code: props.inputData.shipper?.add_address_code,
      company_name: props.inputData.shipper?.add_address_name,
      address1: props.inputData.shipper?.add_address1,
      address2: props.inputData.shipper?.add_address2,
      address3: props.inputData.shipper?.add_address3
    },
    {
      org_code: props.inputData.consignee?.add_address_code,
      company_name: props.inputData.consignee?.add_address_name,
      address1: props.inputData.consignee?.add_address1,
      address2: props.inputData.consignee?.add_address2,
      address3: props.inputData.consignee?.add_address3
    },
    {
      org_code: props.inputData.consol?.local_agent?.add_address_code,
      company_name: props.inputData.consol?.local_agent?.add_address_name,
      address1: props.inputData.consol?.local_agent?.add_address1,
      address2: props.inputData.consol?.local_agent?.add_address2,
      address3: props.inputData.consol?.local_agent?.add_address3
    },
    {
      org_code: props.inputData.consol?.overseas_agent?.add_address_code,
      company_name: props.inputData.consol?.overseas_agent?.add_address_name,
      address1: props.inputData.consol?.overseas_agent?.add_address1,
      address2: props.inputData.consol?.overseas_agent?.add_address2,
      address3: props.inputData.consol?.overseas_agent?.add_address3
    }
  ];
  const map = new Map<string, ReturnType<typeof normalizeOrgAddressRow>>();
  src.forEach(item => {
    const row = normalizeOrgAddressRow(item as Record<string, unknown>);
    if (row.org_code && row.company_name && !map.has(row.org_code)) {
      map.set(row.org_code, row);
    }
  });
  return [...map.values()];
}

async function fetchOrgAddressForBilling(params: Record<string, unknown>) {
  const query = String(params?.query ?? '').trim();
  const defaultItems = buildDefaultDebtorItems();
  if (!query) {
    return { data: { items: defaultItems, totalCount: defaultItems.length } };
  }
  try {
    const { data } = await organizationQueryOrgAddress({
      query,
      skipCount: Math.max(0, (Number(params.page ?? 1) - 1) * Number(params.page_size ?? 10)),
      maxResultCount: Number(params.page_size ?? 50)
    });
    if (!data) {
      return { data: { items: [], totalCount: 0 } };
    }
    const rawList = Array.isArray(data.list) ? data.list : Array.isArray(data.items) ? data.items : [];
    const items = rawList
      .map((row: Record<string, unknown>) => normalizeOrgAddressRow(row))
      .filter((x: ReturnType<typeof normalizeOrgAddressRow>) => x.org_code);
    return { data: { items, totalCount: Number(data.totalCount ?? items.length) } };
  } catch {
    return { data: { items: [], totalCount: 0 } };
  }
}

async function applyCurrencyExchangeRate(row: ShipmentBillingChargeRow, currencyCode: string) {
  row.Currency = currencyCode;
  if (!currencyCode) {
    row.Exchange_Rate = normalizeBillingExchangeRate(null);
    recalcChargeLineTaxAndHome(row);
    return;
  }
  try {
    const { data: rates } = await queryCompanyExchangeRate({
      homecurrency: [currencyCode],
      invoiceDate: props.inputData.shp_etd
    });
    const sellRate = Array.isArray(rates) ? rates[0]?.exrate_sell_rate : undefined;
    row.Exchange_Rate = normalizeBillingExchangeRate(sellRate);
  } catch {
    row.Exchange_Rate = normalizeBillingExchangeRate(null);
  }
  recalcChargeLineTaxAndHome(row);
}

async function loadBillingData(chargeType: 'AR' | 'AP') {
  if (!props.inputData.pk) return;
  loading.value = true;
  try {
    const { data } = await billingChargeLine({
      shpPk: props.inputData.pk,
      chargeType,
      skipCount: 0,
      maxResultCount: 1000
    });
    const mapped = (data?.items ?? []).map(item => mapChargeLineItem(item, chargeType));
    if (chargeType === 'AR') emit('update:arCharges', mapped);
    else emit('update:apCharges', mapped);
  } catch {
    /* ignore */
  } finally {
    loading.value = false;
  }
}

function loadAll() {
  loadBillingData('AR');
  loadBillingData('AP');
}

watch(
  () => props.inputData.pk,
  pk => {
    if (pk) loadAll();
  },
  { immediate: true }
);

function generateNewId(items: ShipmentBillingChargeRow[]) {
  if (!items.length) return -1;
  const minId = items.reduce((min, item) => Math.min(Number(item.id ?? 0), min), 0);
  return minId > 0 ? -1 : minId - 1;
}

function addChargeLine(type: 'AR' | 'AP') {
  if (type === 'AR' && !props.inputData.ar_charges) props.inputData.ar_charges = [];
  if (type === 'AP' && !props.inputData.ap_charges) props.inputData.ap_charges = [];
  const list = [...(type === 'AR' ? props.inputData.ar_charges : props.inputData.ap_charges)];
  list.push({
    id: generateNewId(list),
    pk: '',
    Charge_Code: '',
    Description: '',
    Branch: appStore.branchInfo.code || '',
    Currency: '',
    Type: '',
    Amount: 0,
    Tax_Code: '',
    Tax_Amount: '',
    Estimated_Cost: 0,
    Exchange_Rate: 1,
    Home_Amount: '',
    invoice_no: '',
    invoice_pk: '',
    draft: '',
    is_locked: 0,
    ...(type === 'AR' ? { Debtor: '' } : { Creditor: '' })
  });
  if (type === 'AR') emit('update:arCharges', list);
  else emit('update:apCharges', list);
}

function requestDelete(index: number, type: 'AR' | 'AP') {
  deleteIndex.value = index;
  deleteType.value = type;
  confirmDeleteVis.value = true;
}

async function confirmDelete() {
  if (deleteIndex.value === null) return;
  const list = deleteType.value === 'AR' ? props.inputData.ar_charges : props.inputData.ap_charges;
  const item = list?.[deleteIndex.value] as ShipmentBillingChargeRow | undefined;
  if (item?.pk) {
    try {
      await deleteBilling([item.pk]);
      window.$message?.success($t('page.business.shipment.billing.deleteSuccess'));
    } catch {
      window.$message?.error('Delete failed');
      return;
    }
  }
  list?.splice(deleteIndex.value, 1);
  confirmDeleteVis.value = false;
  deleteIndex.value = null;
}

function getSelectedRows(type: 'AR' | 'AP') {
  const selectedKeys = type === 'AR' ? tblSelectedAR.value : tblSelectedAP.value;
  const list: ShipmentBillingChargeRow[] =
    type === 'AR' ? props.inputData.ar_charges || [] : props.inputData.ap_charges || [];
  return list.filter(item => selectedKeys.includes(item.id));
}

function copyRows(type: 'AR' | 'AP', targetType: 'AR' | 'AP') {
  const selectedRows = getSelectedRows(type);
  if (!selectedRows.length) {
    window.$message?.warning($t('page.business.shipment.billing.selectRecords'));
    return;
  }
  const newItems = [...(targetType === 'AR' ? props.inputData.ar_charges || [] : props.inputData.ap_charges || [])];
  selectedRows.forEach(item => {
    newItems.push({
      ...item,
      id: generateNewId(newItems),
      pk: '',
      invoice_no: '',
      invoice_pk: '',
      draft: '',
      is_locked: 0,
      ...(targetType === 'AP' && type === 'AR' ? { Creditor: item.Debtor || '', Debtor: undefined } : {}),
      ...(targetType === 'AR' && type === 'AP' ? { Debtor: item.Creditor || '', Creditor: undefined } : {})
    });
  });
  if (targetType === 'AR') {
    emit('update:arCharges', newItems);
    tblSelectedAR.value = [];
  } else {
    emit('update:apCharges', newItems);
    tblSelectedAP.value = [];
  }
  window.$message?.success($t('page.business.shipment.billing.copySuccess'));
}

async function handleGenerateDraft(type: 'AR' | 'AP') {
  const selectedRows = getSelectedRows(type).filter(item => item.is_locked === 0);
  if (!selectedRows.length) {
    window.$message?.warning($t('page.business.shipment.billing.selectRecords'));
    return;
  }

  try {
    loading.value = true;
    if (typeof props.saveBillingFn === 'function') {
      const saved = await props.saveBillingFn();
      if (saved === false) return;
    }

    await loadBillingData(type);
    const latest: ShipmentBillingChargeRow[] =
      type === 'AR' ? props.inputData.ar_charges || [] : props.inputData.ap_charges || [];
    const pks = [
      ...new Set(selectedRows.map(row => latest.find(item => item.id === row.id)?.pk || row.pk).filter(Boolean))
    ] as string[];

    if (!pks.length) {
      window.$message?.warning('Please save billing data first, then try again.');
      return;
    }

    await generateDraft({ pks, chargeType: type });
    window.$message?.success($t('page.business.shipment.billing.draftSuccess'));
    await loadBillingData(type);
    if (type === 'AR') tblSelectedAR.value = [];
    else tblSelectedAP.value = [];
  } catch {
    window.$message?.error('Generate draft failed');
  } finally {
    loading.value = false;
  }
}

function makeColumns(type: 'AR' | 'AP') {
  const isAR = type === 'AR';
  const accountKey = isAR ? 'Debtor' : 'Creditor';
  return [
    { type: 'selection' as const },
    {
      title: '',
      key: 'actions',
      width: 50,
      align: 'center' as const,
      render(_: unknown, index: number) {
        const row = (isAR ? props.inputData.ar_charges : props.inputData.ap_charges)?.[index] as
          | ShipmentBillingChargeRow
          | undefined;
        return h(
          NButton,
          {
            text: true,
            type: 'error',
            size: 'small',
            disabled: row?.is_locked !== 0,
            onClick: () => requestDelete(index, type)
          },
          { default: () => 'Del' }
        );
      }
    },
    {
      title: 'Status',
      key: 'is_locked',
      width: 90,
      render(row: ShipmentBillingChargeRow) {
        return h(
          NTag,
          { type: getBillingLockTagType(row.is_locked), size: 'small' },
          { default: () => getBillingLockLabel(row.is_locked) }
        );
      }
    },
    {
      title: 'Charge Code',
      key: 'Charge_Code',
      width: 130,
      render(row: ShipmentBillingChargeRow) {
        return h(NAutoComplete, {
          value: row.Charge_Code,
          options: chargeCodeOpts.value,
          size: 'small',
          disabled: row.is_locked !== 0,
          menuProps: autocompleteMenuProps,
          renderLabel: renderAutocompleteLabel,
          getShow: () => chargeCodeOpts.value.length > 0,
          onUpdateValue: (v: string) => {
            row.Charge_Code = v;
            searchChargeCodes(v);
          },
          onFocus: () => {
            searchChargeCodes(row.Charge_Code || '');
          },
          onSelect: (v: string) => {
            row.Charge_Code = v;
            const cc = chargeCodeCache.value.find(c => c.code === v);
            if (cc) {
              row.Description = cc.desc;
              if (cc.charge_type === 'FIN' || cc.charge_type === 'CUR') {
                row.Type = cc.charge_type;
              }
            }
          }
        });
      }
    },
    {
      title: 'Description',
      key: 'Description',
      width: 140,
      render(row: ShipmentBillingChargeRow) {
        return h(NInput, {
          value: row.Description,
          size: 'small',
          disabled: row.is_locked !== 0,
          onUpdateValue: (v: string) => {
            row.Description = v;
          }
        });
      }
    },
    {
      title: isAR ? 'Debtor' : 'Creditor',
      key: accountKey,
      width: 140,
      render(row: ShipmentBillingChargeRow) {
        if (row.is_locked !== 0) {
          return h('span', null, row[accountKey] || '');
        }
        return h(RemoteTableMenu, {
          modelValue: row[accountKey] || '',
          fetchMethod: fetchOrgAddressForBilling,
          headers: debtorHeaders,
          displayKey: 'org_code',
          itemValue: 'org_code',
          width: 480,
          'onUpdate:modelValue': (v: string) => {
            row[accountKey] = v;
          },
          onRowSelect: (r: Record<string, unknown>) => {
            row[accountKey] = String(r.org_code ?? '');
          }
        });
      }
    },
    {
      title: 'Branch',
      key: 'Branch',
      width: 80,
      render: (row: ShipmentBillingChargeRow) => h('span', null, row.Branch || '')
    },
    {
      title: 'Currency',
      key: 'Currency',
      width: 80,
      render(row: ShipmentBillingChargeRow) {
        return h(NAutoComplete, {
          value: row.Currency,
          options: currencyOpts.value,
          size: 'small',
          disabled: row.is_locked !== 0,
          menuProps: autocompleteMenuProps,
          renderLabel: renderAutocompleteLabel,
          getShow: () => currencyOpts.value.length > 0,
          onUpdateValue: (v: string) => {
            row.Currency = v;
            searchCurrencies(v);
          },
          onFocus: () => {
            searchCurrencies(row.Currency || '');
          },
          onSelect: (v: string) => {
            applyCurrencyExchangeRate(row, v);
          }
        });
      }
    },
    {
      title: 'Type',
      key: 'Type',
      width: 100,
      render(row: ShipmentBillingChargeRow) {
        return h(NSelect, {
          value: row.Type || null,
          options: lineTypeOpts,
          size: 'small',
          clearable: true,
          disabled: row.is_locked !== 0,
          onUpdateValue: (v: string | null) => {
            row.Type = v || '';
          }
        });
      }
    },
    {
      title: 'Amount',
      key: 'Amount',
      width: 100,
      render(row: ShipmentBillingChargeRow) {
        return h(NInput, {
          value: String(row.Amount ?? ''),
          size: 'small',
          disabled: row.is_locked !== 0,
          onUpdateValue: (v: string) => {
            row.Amount = v;
            recalcChargeLineTaxAndHome(row);
          }
        });
      }
    },
    {
      title: 'Tax Code',
      key: 'Tax_Code',
      width: 100,
      render(row: ShipmentBillingChargeRow) {
        return h(NSelect, {
          value: row.Tax_Code || null,
          options: taxCodeOpts,
          size: 'small',
          clearable: true,
          disabled: row.is_locked !== 0,
          onUpdateValue: (v: string | null) => {
            row.Tax_Code = v || '';
            recalcChargeLineTaxAndHome(row);
          }
        });
      }
    },
    {
      title: 'Tax Amt',
      key: 'Tax_Amount',
      width: 90,
      render: (row: ShipmentBillingChargeRow) => h('span', null, row.Tax_Amount || '')
    },
    {
      title: 'Exch Rate',
      key: 'Exchange_Rate',
      width: 90,
      render(row: ShipmentBillingChargeRow) {
        return h(NInput, {
          value: String(row.Exchange_Rate ?? ''),
          size: 'small',
          disabled: row.is_locked !== 0,
          onUpdateValue: (v: string) => {
            row.Exchange_Rate = v;
            recalcChargeLineTaxAndHome(row);
          }
        });
      }
    },
    {
      title: 'Home Amt',
      key: 'Home_Amount',
      width: 100,
      render: (row: ShipmentBillingChargeRow) => h('span', null, row.Home_Amount || '')
    }
  ];
}

const arColumns = computed(() => makeColumns('AR'));
const apColumns = computed(() => makeColumns('AP'));

defineExpose({ loadAll, loadBillingData });
</script>

<template>
  <div>
    <NCard size="small" class="mb-12px">
      <template #header>
        <NSpace align="center" :wrap="false">
          <span class="font-bold">AR (Accounts Receivable)</span>
          <NCheckbox v-model:checked="arCompleted">AR Completed</NCheckbox>
          <NButton size="small" @click="copyRows('AR', 'AR')">Copy</NButton>
          <NButton size="small" @click="copyRows('AR', 'AP')">Copy to AP</NButton>
          <NButton size="small" :loading="loading" @click="handleGenerateDraft('AR')">Generate Draft</NButton>
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
        :loading="loading"
        :row-key="(row: ShipmentBillingChargeRow) => row.id"
        :scroll-x="1500"
        :max-height="300"
        striped
      />
    </NCard>

    <NCard size="small">
      <template #header>
        <NSpace align="center" :wrap="false">
          <span class="font-bold">AP (Accounts Payable)</span>
          <NCheckbox v-model:checked="apCompleted">AP Completed</NCheckbox>
          <NButton size="small" @click="copyRows('AP', 'AP')">Copy</NButton>
          <NButton size="small" @click="copyRows('AP', 'AR')">Copy to AR</NButton>
          <NButton size="small" :loading="loading" @click="handleGenerateDraft('AP')">Generate Draft</NButton>
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
        :loading="loading"
        :row-key="(row: ShipmentBillingChargeRow) => row.id"
        :scroll-x="1500"
        :max-height="300"
        striped
      />
    </NCard>

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

<style scoped>
:deep(.billing-charge-autocomplete-menu .n-base-select-option__content) {
  white-space: normal;
  word-break: break-word;
  overflow: visible;
  text-overflow: unset;
}

:deep(.billing-charge-autocomplete-label) {
  display: block;
  line-height: 1.4;
}
</style>
