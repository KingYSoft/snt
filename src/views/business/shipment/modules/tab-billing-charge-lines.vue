<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */
import { h, ref, computed, watch, onMounted, defineComponent, type PropType } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { NDataTable, NButton, NInput, NCard, NSpace, NModal, NTag, NSelect } from 'naive-ui';
import { $t } from '@/locales';
import { useAppStore } from '@/store/modules/app';
import { billingTaxCodeItems, findBillingTaxCodeItem, getBillingTaxCodeLabel } from '@/constants/billingTaxCodeItems';
import { billingInvoiceTypeOptions, isBillingInvoiceType } from '@/constants/billingInvoiceTypeItems';
import {
  billingChargeLine,
  billingChargeCodeOptions,
  billingBranchOptions,
  billingQueryOrgAddress,
  createOrUpdateBilling,
  deleteBilling,
  postCharge,
  type BillingBranchOption,
  type BillingChargeCodeOption,
  type BillingOrgAddressRow
} from '@/service/api/business/billing';
import { matchTransactionsCurrencyOptions } from '@/service/api/business/match-transactions';
import { queryCompanyExchangeRate } from '@/service/api/maintain/company';
import { normalizeBillingExchangeRate } from '@/utils/billing/billingDecimal';
import {
  getBillingLockLabel,
  getBillingLockTagType,
  mapChargeLineItem,
  mapChargeRowToWriteItem,
  recalcChargeLineTaxAndHome,
  type ShipmentBillingChargeRow
} from './shipment-billing-map';

const props = defineProps<{
  inputData: Record<string, any>;
}>();
const emit = defineEmits<{
  (e: 'update:arCharges', value: ShipmentBillingChargeRow[]): void;
  (e: 'update:apCharges', value: ShipmentBillingChargeRow[]): void;
}>();

const appStore = useAppStore();
const tblSelectedAR = ref<Array<string | number>>([]);
const tblSelectedAP = ref<Array<string | number>>([]);
const confirmDeleteVis = ref(false);
const deleteIndex = ref<number | null>(null);
const deleteType = ref<'AR' | 'AP'>('AR');
const loading = ref(false);
const postLoadingType = ref<'AR' | 'AP' | null>(null);

const chargeCodeByPk = new Map<string, BillingChargeCodeOption>();
/** Non-reactive label cache — avoids remounting table selects when options update. */
const chargeCodeLabelByPk = new Map<string, string>();

const BILLING_SELECT_QUERY_LIMIT = 50;
const BILLING_SELECT_DEBOUNCE_MS = 800;

type BillingSelectOption = { label: string; value: string; desc?: string };
type BillingSelectSearchFn = (query: string) => Promise<BillingSelectOption[]>;

function normalizeCurrencyOptionRows(payload: unknown): Array<{ code?: string; desc?: string }> {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  const row = payload as { code?: string; desc?: string; items?: Array<{ code?: string; desc?: string }> };
  if (Array.isArray(row.items)) return row.items;
  if (row.code) return [row];
  return [];
}

function toCurrencySearchOptions(payload: unknown): BillingSelectOption[] {
  return normalizeCurrencyOptionRows(payload)
    .map(row => toBillingSelectOption(String(row?.code ?? ''), String(row?.desc ?? '')))
    .filter(o => o.value);
}

function toBillingSelectOption(code: string, desc?: string): BillingSelectOption {
  const value = String(code ?? '').trim();
  return { label: value, value, desc: String(desc ?? '').trim() };
}

function toBillingBranchOption(item: BillingBranchOption): BillingSelectOption {
  return {
    label: String(item.code ?? '').trim(),
    value: String(item.pk ?? '').trim(),
    desc: String(item.desc ?? '').trim()
  };
}

function toBillingChargeCodeOption(item: BillingChargeCodeOption): BillingSelectOption {
  return {
    label: String(item.code ?? '').trim(),
    value: String(item.pk ?? '').trim(),
    desc: String(item.desc ?? '').trim()
  };
}

function toBillingPartyOption(item: BillingOrgAddressRow): BillingSelectOption {
  return {
    label: String(item.oh_code ?? '').trim(),
    value: String(item.oh_pk ?? '').trim(),
    desc: String(item.oh_fullname ?? '').trim()
  };
}

function mergeChargeCodeCache(items: BillingChargeCodeOption[]) {
  items.forEach(item => {
    const pk = String(item.pk ?? '').trim();
    if (!pk) return;
    chargeCodeByPk.set(pk, item);
    if (item.code) chargeCodeLabelByPk.set(pk, String(item.code).trim());
  });
}

function ensureCurrentSelectOption(options: BillingSelectOption[], current?: string, displayLabel?: string) {
  const cur = (current ?? '').trim();
  if (!cur || options.some(o => o.value === cur)) return options;
  const label = String(displayLabel ?? '').trim() || cur;
  return [{ label, value: cur }, ...options];
}

function renderBillingSelectMenuLabel(option: BillingSelectOption) {
  const code = String(option.label ?? option.value ?? '');
  const desc = String(option.desc ?? '').trim();
  if (!desc) {
    return h('span', { class: 'billing-remote-select-menu-label' }, code);
  }
  return h('div', { class: 'billing-remote-select-menu-option' }, [
    h('div', { class: 'billing-remote-select-menu-option__code' }, code),
    h('div', { class: 'billing-remote-select-menu-option__desc', title: desc }, desc)
  ]);
}

/** Per-cell remote select: local loading/options only — no shared search state. */
const BillingRemoteSelectCell = defineComponent({
  name: 'BillingRemoteSelectCell',
  props: {
    value: { type: String, default: '' },
    currentLabel: { type: String, default: '' },
    search: { type: Function as PropType<BillingSelectSearchFn>, required: true }
  },
  emits: {
    'update:value': (_value: string) => true,
    'select-option': (_opt: BillingSelectOption) => true
  },
  setup(cellProps, { emit: cellEmit }) {
    const selectLoading = ref(false);
    const searchOpts = ref<BillingSelectOption[]>([]);

    const options = computed(() =>
      ensureCurrentSelectOption(searchOpts.value, cellProps.value, cellProps.currentLabel)
    );

    const runSearch = useDebounceFn(async (query: string) => {
      const q = query.trim();
      if (!q) {
        searchOpts.value = [];
        return;
      }
      selectLoading.value = true;
      try {
        searchOpts.value = await cellProps.search(q);
      } catch {
        searchOpts.value = [];
      } finally {
        selectLoading.value = false;
      }
    }, BILLING_SELECT_DEBOUNCE_MS);

    return () =>
      h(NSelect, {
        class: 'billing-remote-select',
        value: cellProps.value || null,
        options: options.value,
        size: 'small',
        filterable: true,
        remote: true,
        loading: selectLoading.value,
        clearable: true,
        consistentMenuWidth: false,
        menuProps: {
          class: 'billing-remote-select-menu',
          style: { minWidth: '280px', maxWidth: '420px' }
        },
        placeholder: 'Search...',
        filter: () => true,
        renderLabel: (option: BillingSelectOption) => renderBillingSelectMenuLabel(option),
        onSearch: (query: string) => {
          void runSearch(query);
        },
        onUpdateValue: (v: string | null) => {
          const value = v || '';
          const opt = searchOpts.value.find(o => o.value === value);
          cellEmit('update:value', value);
          if (opt) cellEmit('select-option', opt);
        }
      });
  }
});

/** Per-cell static select (Type / Tax Code) — isolated instance per row. */
const BillingStaticSelectCell = defineComponent({
  name: 'BillingStaticSelectCell',
  props: {
    value: { type: String, default: '' },
    options: { type: Array as PropType<Array<{ label: string; value: string }>>, required: true },
    clearable: { type: Boolean, default: true }
  },
  emits: {
    'update:value': (_value: string) => true
  },
  setup(cellProps, { emit: cellEmit }) {
    return () =>
      h(NSelect, {
        value: cellProps.value || null,
        options: cellProps.options,
        size: 'small',
        clearable: cellProps.clearable,
        onUpdateValue: (v: string | null) => {
          cellEmit('update:value', v || '');
        }
      });
  }
});

async function fetchChargeCodeOptions(query: string): Promise<BillingSelectOption[]> {
  const { data } = await billingChargeCodeOptions({ query: query.trim() });
  const items = data ?? [];
  mergeChargeCodeCache(items);
  return items.map(toBillingChargeCodeOption).filter(o => o.value);
}

async function fetchPartyOptions(query: string): Promise<BillingSelectOption[]> {
  const { data } = await billingQueryOrgAddress({
    query: query.trim(),
    skipCount: 0,
    maxResultCount: BILLING_SELECT_QUERY_LIMIT
  });
  return (data?.items ?? []).map(toBillingPartyOption).filter(o => o.value);
}

async function fetchBranchOptions(query: string): Promise<BillingSelectOption[]> {
  const { data } = await billingBranchOptions({ query: query.trim() });
  return (data ?? []).map(toBillingBranchOption).filter(o => o.value);
}

async function fetchCurrencyOptions(query: string): Promise<BillingSelectOption[]> {
  const { data } = await matchTransactionsCurrencyOptions({ query: query.trim() });
  return toCurrencySearchOptions(data);
}

function getChargeCodeDisplayLabel(pk?: string) {
  const value = String(pk ?? '').trim();
  if (!value) return '';
  return chargeCodeLabelByPk.get(value) ?? '';
}

function isChargeLineLocked(row: ShipmentBillingChargeRow) {
  return row.is_locked !== 0;
}

function renderLockedCell(text?: string | number | null) {
  return h('span', null, String(text ?? ''));
}

const taxCodeOpts = billingTaxCodeItems.map(item => ({ label: item.code, value: item.pk }));

function ensureCurrentTaxCodeOption(current?: string) {
  const cur = (current ?? '').trim();
  if (!cur || findBillingTaxCodeItem(cur)) return taxCodeOpts;
  return [{ label: getBillingTaxCodeLabel(cur), value: cur }, ...taxCodeOpts];
}
const invoiceTypeOpts = billingInvoiceTypeOptions;

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
    const mapped = (data?.items ?? []).map(item => {
      const row = mapChargeLineItem(item, chargeType);
      if (row.Charge_Code && row.charge_code) {
        chargeCodeLabelByPk.set(row.Charge_Code, row.charge_code);
      }
      return row;
    });
    if (chargeType === 'AR') emit('update:arCharges', mapped);
    else emit('update:apCharges', mapped);
  } catch {
    /* ignore */
  } finally {
    loading.value = false;
  }
}

async function loadAll() {
  await Promise.all([loadBillingData('AR'), loadBillingData('AP')]);
}

async function initBillingTab() {
  if (props.inputData.pk) await loadAll();
}

onMounted(() => {
  void initBillingTab();
});

watch(
  () => props.inputData.pk,
  (pk, prevPk) => {
    if (!pk || pk === prevPk) return;
    void initBillingTab();
  }
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
    charge_code: '',
    Description: '',
    Branch: appStore.userSession?.branch_pk || '',
    branch_code: '',
    Currency: '',
    JR_InvoiceType: '',
    Amount: 0,
    Tax_Code: '',
    Tax_Amount: '',
    Exchange_Rate: 1,
    Home_Amount: '',
    invoice_no: '',
    invoice_pk: '',
    draft: '',
    is_locked: 0,
    party_code: '',
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
      ...(targetType === 'AP' && type === 'AR'
        ? { Creditor: item.Debtor || '', Debtor: undefined, party_code: item.party_code || '' }
        : {}),
      ...(targetType === 'AR' && type === 'AP'
        ? { Debtor: item.Creditor || '', Creditor: undefined, party_code: item.party_code || '' }
        : {})
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

async function saveBillingCharges(): Promise<boolean> {
  if (!props.inputData.pk) {
    window.$message?.warning('Shipment PK is required.');
    return false;
  }

  try {
    const { data } = await createOrUpdateBilling({
      shpPk: props.inputData.pk,
      charges: [
        ...(props.inputData.ar_charges || []).map((item: ShipmentBillingChargeRow) =>
          mapChargeRowToWriteItem(item, 'AR')
        ),
        ...(props.inputData.ap_charges || []).map((item: ShipmentBillingChargeRow) =>
          mapChargeRowToWriteItem(item, 'AP')
        )
      ]
    });
    return Boolean(data);
  } catch {
    window.$message?.error('Failed to save billing records.');
    return false;
  }
}

async function handlePost(type: 'AR' | 'AP') {
  const selectedKeys = type === 'AR' ? [...tblSelectedAR.value] : [...tblSelectedAP.value];
  const list: ShipmentBillingChargeRow[] =
    type === 'AR' ? props.inputData.ar_charges || [] : props.inputData.ap_charges || [];
  const selectedIndices = list
    .map((row, index) => (selectedKeys.includes(row.id) && row.is_locked === 0 ? index : -1))
    .filter(index => index >= 0);

  if (!selectedIndices.length) {
    window.$message?.warning($t('page.business.shipment.billing.selectRecords'));
    return;
  }

  try {
    postLoadingType.value = type;

    const saved = await saveBillingCharges();
    if (!saved) return;

    await loadBillingData(type);

    const updatedList: ShipmentBillingChargeRow[] =
      type === 'AR' ? props.inputData.ar_charges || [] : props.inputData.ap_charges || [];
    const pks = [
      ...new Set(
        selectedIndices
          .map(index => updatedList[index])
          .filter((row): row is ShipmentBillingChargeRow => Boolean(row?.pk) && row.is_locked === 0)
          .map(row => row.pk)
      )
    ];

    if (!pks.length) {
      window.$message?.warning('Failed to get charge line PKs after save.');
      return;
    }

    await postCharge({ pks, chargeType: type });
    window.$message?.success($t('page.business.shipment.billing.postSuccess'));
    await loadBillingData(type);
    if (type === 'AR') tblSelectedAR.value = [];
    else tblSelectedAP.value = [];
  } catch {
    window.$message?.error('Post failed');
  } finally {
    postLoadingType.value = null;
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
      width: 110,
      render(row: ShipmentBillingChargeRow) {
        if (isChargeLineLocked(row)) {
          return renderLockedCell(row.charge_code || getChargeCodeDisplayLabel(row.Charge_Code));
        }
        return h(BillingRemoteSelectCell, {
          value: row.Charge_Code || '',
          currentLabel: row.charge_code || getChargeCodeDisplayLabel(row.Charge_Code),
          search: fetchChargeCodeOptions,
          'onUpdate:value': (v: string) => {
            row.Charge_Code = v;
            const cc = chargeCodeByPk.get(v);
            if (cc) {
              row.charge_code = cc.code;
              row.Description = cc.desc;
              if (isBillingInvoiceType(cc.charge_type)) {
                row.JR_InvoiceType = cc.charge_type;
              }
            } else if (!v) {
              row.charge_code = '';
            }
          },
          onSelectOption: (opt: BillingSelectOption) => {
            row.charge_code = opt.label;
            chargeCodeLabelByPk.set(opt.value, opt.label);
          }
        });
      }
    },
    {
      title: 'Description',
      key: 'Description',
      width: 140,
      render(row: ShipmentBillingChargeRow) {
        if (isChargeLineLocked(row)) {
          return renderLockedCell(row.Description);
        }
        return h(NInput, {
          value: row.Description,
          size: 'small',
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
        if (isChargeLineLocked(row)) {
          return renderLockedCell(row.party_code);
        }
        return h(BillingRemoteSelectCell, {
          value: row[accountKey] || '',
          currentLabel: row.party_code,
          search: fetchPartyOptions,
          'onUpdate:value': (v: string) => {
            row[accountKey] = v;
          },
          onSelectOption: (opt: BillingSelectOption) => {
            row.party_code = opt.label;
          }
        });
      }
    },
    {
      title: 'Branch',
      key: 'Branch',
      width: 120,
      render(row: ShipmentBillingChargeRow) {
        if (isChargeLineLocked(row)) {
          return renderLockedCell(row.branch_code);
        }
        return h(BillingRemoteSelectCell, {
          value: row.Branch || '',
          currentLabel: row.branch_code,
          search: fetchBranchOptions,
          'onUpdate:value': (v: string) => {
            row.Branch = v;
          },
          onSelectOption: (opt: BillingSelectOption) => {
            row.branch_code = opt.label;
          }
        });
      }
    },
    {
      title: 'Currency',
      key: 'Currency',
      width: 100,
      render(row: ShipmentBillingChargeRow) {
        if (isChargeLineLocked(row)) {
          return renderLockedCell(row.Currency);
        }
        return h(BillingRemoteSelectCell, {
          value: row.Currency || '',
          currentLabel: row.Currency,
          search: fetchCurrencyOptions,
          'onUpdate:value': (v: string) => {
            applyCurrencyExchangeRate(row, v);
          }
        });
      }
    },
    {
      title: 'Type',
      key: 'JR_InvoiceType',
      width: 100,
      render(row: ShipmentBillingChargeRow) {
        if (isChargeLineLocked(row)) {
          return renderLockedCell(row.JR_InvoiceType);
        }
        return h(BillingStaticSelectCell, {
          value: row.JR_InvoiceType || '',
          options: invoiceTypeOpts,
          'onUpdate:value': (v: string) => {
            row.JR_InvoiceType = v;
          }
        });
      }
    },
    {
      title: 'Amount',
      key: 'Amount',
      width: 100,
      render(row: ShipmentBillingChargeRow) {
        if (isChargeLineLocked(row)) {
          return renderLockedCell(row.Amount);
        }
        return h(NInput, {
          value: String(row.Amount ?? ''),
          size: 'small',
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
        if (isChargeLineLocked(row)) {
          return renderLockedCell(getBillingTaxCodeLabel(row.Tax_Code));
        }
        return h(BillingStaticSelectCell, {
          value: findBillingTaxCodeItem(row.Tax_Code)?.pk || row.Tax_Code || '',
          options: ensureCurrentTaxCodeOption(row.Tax_Code),
          'onUpdate:value': (v: string) => {
            row.Tax_Code = findBillingTaxCodeItem(v)?.pk || v;
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
        if (isChargeLineLocked(row)) {
          return renderLockedCell(row.Exchange_Rate);
        }
        return h(NInput, {
          value: String(row.Exchange_Rate ?? ''),
          size: 'small',
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
          <NButton size="small" @click="copyRows('AR', 'AP')">Copy to AP</NButton>
          <NButton size="small" @click="addChargeLine('AR')">Add</NButton>
          <NButton type="primary" size="small" :loading="postLoadingType === 'AR'" @click="handlePost('AR')">
            Post
          </NButton>
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
          <NButton size="small" @click="copyRows('AP', 'AR')">Copy to AR</NButton>
          <NButton size="small" @click="addChargeLine('AP')">Add</NButton>
          <NButton type="primary" size="small" :loading="postLoadingType === 'AP'" @click="handlePost('AP')">
            Post
          </NButton>
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
:deep(.billing-remote-select .n-base-selection-label),
:deep(.billing-remote-select .n-base-selection-input) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 选中框只显示 code，隐藏描述行 */
:deep(.billing-remote-select .n-base-selection-label .billing-remote-select-menu-option) {
  display: inline;
}

:deep(.billing-remote-select .n-base-selection-label .billing-remote-select-menu-option__desc) {
  display: none;
}

:deep(.billing-remote-select .n-base-selection-label .billing-remote-select-menu-option__code) {
  font-weight: inherit;
}

:deep(.billing-remote-select-menu-option__code) {
  font-weight: 500;
  line-height: 1.35;
}

:deep(.billing-remote-select-menu .billing-remote-select-menu-option__desc) {
  margin-top: 2px;
  font-size: 12px;
  line-height: 1.35;
  color: var(--n-option-text-color);
  opacity: 0.72;
  white-space: normal;
  word-break: break-word;
}
</style>
