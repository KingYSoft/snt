<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */
import { h, ref, computed, watch, onMounted } from 'vue';
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
  generateDraft,
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

const chargeCodeCache = ref<BillingChargeCodeOption[]>([]);

const BILLING_SELECT_QUERY_LIMIT = 50;
const BILLING_SELECT_DEBOUNCE_MS = 800;

type BillingSelectOption = { label: string; value: string; desc?: string };
const chargeCodePersistedOpts = ref<BillingSelectOption[]>([]);
const partyPersistedOpts = ref<BillingSelectOption[]>([]);
const branchPersistedOpts = ref<BillingSelectOption[]>([]);
const currencyPersistedOpts = ref<BillingSelectOption[]>([]);

const chargeCodeSearchOpts = ref<BillingSelectOption[]>([]);
const partySearchOpts = ref<BillingSelectOption[]>([]);
const branchSearchOpts = ref<BillingSelectOption[]>([]);
const currencySearchOpts = ref<BillingSelectOption[]>([]);

const chargeCodeSearchLoading = ref(false);
const partySearchLoading = ref(false);
const branchSearchLoading = ref(false);
const currencySearchLoading = ref(false);

function mergeUniqueBillingOptions(base: BillingSelectOption[], items: BillingSelectOption[]): BillingSelectOption[] {
  const existing = new Set(base.map(o => o.value));
  const merged = [...base];
  items.forEach(opt => {
    if (opt.value && !existing.has(opt.value)) {
      existing.add(opt.value);
      merged.push(opt);
    }
  });
  return merged;
}

function getRemoteSelectOptions(
  persisted: BillingSelectOption[],
  searchResults: BillingSelectOption[],
  current?: string,
  currentLabel?: string
) {
  const base = searchResults.length ? searchResults : persisted;
  return ensureCurrentSelectOption(base, current, currentLabel);
}

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
  const existingCache = new Set(chargeCodeCache.value.map(item => item.pk));
  const cache = [...chargeCodeCache.value];
  items.forEach(item => {
    if (item.pk && !existingCache.has(item.pk)) {
      existingCache.add(item.pk);
      cache.push(item);
    }
  });
  chargeCodeCache.value = cache;
}

function mergeBranchPersisted(items: BillingBranchOption[]) {
  const opts = items.map(toBillingBranchOption).filter(o => o.value);
  branchPersistedOpts.value = mergeUniqueBillingOptions(branchPersistedOpts.value, opts);
}

function mergePartyPersisted(items: BillingOrgAddressRow[]) {
  const opts = items.map(toBillingPartyOption).filter(o => o.value);
  partyPersistedOpts.value = mergeUniqueBillingOptions(partyPersistedOpts.value, opts);
}

async function ensurePartyOptionsForChargeRows(rows: ShipmentBillingChargeRow[]) {
  const codesToQuery = new Set<string>();
  rows.forEach(row => {
    if (isChargeLineLocked(row)) return;
    const pk = String(row.Debtor ?? row.Creditor ?? '').trim();
    const code = String(row.party_code ?? '').trim();
    if (!pk || !code) return;
    if (partyPersistedOpts.value.some(o => o.value === pk)) return;
    codesToQuery.add(code);
  });
  if (!codesToQuery.size) return;

  try {
    const responses = await Promise.all(
      [...codesToQuery].map(code => billingQueryOrgAddress({ query: code, skipCount: 0, maxResultCount: 50 }))
    );
    const items = responses.flatMap(res => res.data?.items ?? []);
    mergePartyPersisted(items);
  } catch {
    /* ignore */
  }
}

async function ensureBranchOptionsForChargeRows(rows: ShipmentBillingChargeRow[]) {
  const codesToQuery = new Set<string>();
  rows.forEach(row => {
    if (isChargeLineLocked(row)) return;
    const pk = String(row.Branch ?? '').trim();
    const code = String(row.branch_code ?? '').trim();
    if (!pk || !code) return;
    if (branchPersistedOpts.value.some(o => o.value === pk)) return;
    codesToQuery.add(code);
  });
  if (!codesToQuery.size) return;

  try {
    const responses = await Promise.all([...codesToQuery].map(code => billingBranchOptions({ query: code })));
    responses.forEach(res => mergeBranchPersisted(res.data ?? []));
  } catch {
    /* ignore */
  }
}

async function searchChargeCodeOptions(query: string) {
  const q = query.trim();
  if (!q) {
    chargeCodeSearchOpts.value = [];
    return;
  }
  chargeCodeSearchLoading.value = true;
  try {
    const { data } = await billingChargeCodeOptions({ query: q });
    const items = data ?? [];
    mergeChargeCodeCache(items);
    chargeCodeSearchOpts.value = items.map(toBillingChargeCodeOption).filter(o => o.value);
  } catch {
    chargeCodeSearchOpts.value = [];
  } finally {
    chargeCodeSearchLoading.value = false;
  }
}

async function searchPartyOptions(query: string) {
  const q = query.trim();
  if (!q) {
    partySearchOpts.value = [];
    return;
  }
  partySearchLoading.value = true;
  try {
    const { data } = await billingQueryOrgAddress({
      query: q,
      skipCount: 0,
      maxResultCount: BILLING_SELECT_QUERY_LIMIT
    });
    const items = data?.items ?? [];
    partySearchOpts.value = items.map(toBillingPartyOption).filter(o => o.value);
  } catch {
    partySearchOpts.value = [];
  } finally {
    partySearchLoading.value = false;
  }
}

async function searchBranchOptions(query: string) {
  const q = query.trim();
  if (!q) {
    branchSearchOpts.value = [];
    return;
  }
  branchSearchLoading.value = true;
  try {
    const { data } = await billingBranchOptions({ query: q });
    const items = data ?? [];
    branchSearchOpts.value = items.map(toBillingBranchOption).filter(o => o.value);
  } catch {
    branchSearchOpts.value = [];
  } finally {
    branchSearchLoading.value = false;
  }
}

async function searchCurrencyOptions(query: string) {
  const q = query.trim();
  if (!q) {
    currencySearchOpts.value = [];
    return;
  }
  currencySearchLoading.value = true;
  try {
    const { data } = await matchTransactionsCurrencyOptions({ query: q });
    currencySearchOpts.value = toCurrencySearchOptions(data);
  } catch {
    currencySearchOpts.value = [];
  } finally {
    currencySearchLoading.value = false;
  }
}

const debouncedSearchChargeCode = useDebounceFn(searchChargeCodeOptions, BILLING_SELECT_DEBOUNCE_MS);
const debouncedSearchParty = useDebounceFn(searchPartyOptions, BILLING_SELECT_DEBOUNCE_MS);
const debouncedSearchBranch = useDebounceFn(searchBranchOptions, BILLING_SELECT_DEBOUNCE_MS);
const debouncedSearchCurrency = useDebounceFn(searchCurrencyOptions, BILLING_SELECT_DEBOUNCE_MS);

function findBillingSelectLabel(opts: BillingSelectOption[], pk?: string) {
  const value = String(pk ?? '').trim();
  if (!value) return '';
  return opts.find(o => o.value === value)?.label ?? '';
}

function getPartyCodeByPk(pk?: string) {
  const merged = mergeUniqueBillingOptions(partyPersistedOpts.value, partySearchOpts.value);
  return findBillingSelectLabel(merged, pk);
}

function getBranchCodeByPk(pk?: string) {
  const merged = mergeUniqueBillingOptions(branchPersistedOpts.value, branchSearchOpts.value);
  return findBillingSelectLabel(merged, pk);
}

function getPartyDisplayLabel(pk?: string) {
  return getPartyCodeByPk(pk);
}

function getBranchDisplayLabel(pk?: string) {
  return getBranchCodeByPk(pk);
}

function getChargeCodeDisplayLabel(pk?: string) {
  const merged = mergeUniqueBillingOptions(chargeCodePersistedOpts.value, chargeCodeSearchOpts.value);
  return findBillingSelectLabel(merged, pk);
}

function isChargeLineLocked(row: ShipmentBillingChargeRow) {
  return row.is_locked !== 0;
}

function renderLockedCell(text?: string | number | null) {
  return h('span', null, String(text ?? ''));
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

function persistSelectedOption(
  target: typeof chargeCodePersistedOpts,
  searchResults: BillingSelectOption[],
  value?: string
) {
  const pk = String(value ?? '').trim();
  if (!pk) return;
  const opt = [...searchResults, ...target.value].find(o => o.value === pk);
  if (opt) target.value = mergeUniqueBillingOptions(target.value, [opt]);
}

function ensureCurrentSelectOption(options: BillingSelectOption[], current?: string, displayLabel?: string) {
  const cur = (current ?? '').trim();
  if (!cur || options.some(o => o.value === cur)) return options;
  const label = String(displayLabel ?? '').trim() || cur;
  return [{ label, value: cur }, ...options];
}

function renderRemoteBillingSelect(
  current: string,
  options: BillingSelectOption[],
  onUpdateValue: (value: string) => void,
  onSearch: (query: string) => void,
  selectLoading: boolean
) {
  return h(NSelect, {
    class: 'billing-remote-select',
    value: current || null,
    options,
    size: 'small',
    filterable: true,
    remote: true,
    loading: selectLoading,
    clearable: true,
    consistentMenuWidth: false,
    menuProps: {
      class: 'billing-remote-select-menu',
      style: { minWidth: '280px', maxWidth: '420px' }
    },
    placeholder: 'Search...',
    filter: () => true,
    renderLabel: (option: BillingSelectOption) => renderBillingSelectMenuLabel(option),
    onSearch: (query: string) => onSearch(query),
    onUpdateValue: (v: string | null) => {
      onUpdateValue(v || '');
    }
  });
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
    const mapped = (data?.items ?? []).map(item => mapChargeLineItem(item, chargeType));
    await ensurePartyOptionsForChargeRows(mapped);
    await ensureBranchOptionsForChargeRows(mapped);
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

    await generateDraft({ pks, chargeType: type });
    window.$message?.success($t('page.business.shipment.billing.draftSuccess'));
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
          return renderLockedCell(getChargeCodeDisplayLabel(row.Charge_Code));
        }
        return renderRemoteBillingSelect(
          row.Charge_Code || '',
          getRemoteSelectOptions(chargeCodePersistedOpts.value, chargeCodeSearchOpts.value, row.Charge_Code),
          (v: string) => {
            row.Charge_Code = v;
            persistSelectedOption(chargeCodePersistedOpts, chargeCodeSearchOpts.value, v);
            const cc = chargeCodeCache.value.find(c => c.pk === v);
            if (cc) {
              row.Description = cc.desc;
              if (isBillingInvoiceType(cc.charge_type)) {
                row.JR_InvoiceType = cc.charge_type;
              }
            }
          },
          debouncedSearchChargeCode,
          chargeCodeSearchLoading.value
        );
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
        return renderRemoteBillingSelect(
          row[accountKey] || '',
          getRemoteSelectOptions(partyPersistedOpts.value, partySearchOpts.value, row[accountKey], row.party_code),
          (v: string) => {
            row[accountKey] = v;
            persistSelectedOption(partyPersistedOpts, partySearchOpts.value, v);
            row.party_code = getPartyCodeByPk(v);
          },
          debouncedSearchParty,
          partySearchLoading.value
        );
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
        return renderRemoteBillingSelect(
          row.Branch || '',
          getRemoteSelectOptions(branchPersistedOpts.value, branchSearchOpts.value, row.Branch, row.branch_code),
          (v: string) => {
            row.Branch = v;
            persistSelectedOption(branchPersistedOpts, branchSearchOpts.value, v);
            row.branch_code = getBranchCodeByPk(v);
          },
          debouncedSearchBranch,
          branchSearchLoading.value
        );
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
        return renderRemoteBillingSelect(
          row.Currency || '',
          getRemoteSelectOptions(currencyPersistedOpts.value, currencySearchOpts.value, row.Currency, row.Currency),
          (v: string) => {
            persistSelectedOption(currencyPersistedOpts, currencySearchOpts.value, v);
            applyCurrencyExchangeRate(row, v);
          },
          debouncedSearchCurrency,
          currencySearchLoading.value
        );
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
        return h(NSelect, {
          value: row.JR_InvoiceType || null,
          options: invoiceTypeOpts,
          size: 'small',
          clearable: true,
          onUpdateValue: (v: string | null) => {
            row.JR_InvoiceType = v || '';
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
        return h(NSelect, {
          value: row.Tax_Code || null,
          options: ensureCurrentTaxCodeOption(row.Tax_Code),
          size: 'small',
          clearable: true,
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

const arColumns = computed(() => {
  void partyPersistedOpts.value;
  void partySearchOpts.value;
  void chargeCodePersistedOpts.value;
  void chargeCodeSearchOpts.value;
  void branchPersistedOpts.value;
  void branchSearchOpts.value;
  void currencyPersistedOpts.value;
  void currencySearchOpts.value;
  void chargeCodeSearchLoading.value;
  void partySearchLoading.value;
  void branchSearchLoading.value;
  void currencySearchLoading.value;
  return makeColumns('AR');
});
const apColumns = computed(() => {
  void partyPersistedOpts.value;
  void partySearchOpts.value;
  void chargeCodePersistedOpts.value;
  void chargeCodeSearchOpts.value;
  void branchPersistedOpts.value;
  void branchSearchOpts.value;
  void currencyPersistedOpts.value;
  void currencySearchOpts.value;
  void chargeCodeSearchLoading.value;
  void partySearchLoading.value;
  void branchSearchLoading.value;
  void currencySearchLoading.value;
  return makeColumns('AP');
});

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
