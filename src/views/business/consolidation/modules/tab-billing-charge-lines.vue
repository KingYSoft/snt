<script setup lang="ts">
import { computed, h, onMounted, ref, watch } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NButton, NCard, NDataTable, NGi, NGrid, NSpin, NTag } from 'naive-ui';
import { getBillingTaxCodeLabel } from '@/constants/billingTaxCodeItems';
import { formatBillingAmount } from '@/utils/billing/billingDecimal';
import {
  consolBillingChargeLine,
  consolBillingSummary,
  type ConsolBillingCostLineItem,
  type ConsolBillingSummary,
  type ConsolCostItemDto
} from '@/service/api/business/consol-billing';
import { getBillingLockLabel, getBillingLockTagType } from '@/views/business/shipment/modules/shipment-billing-map';

const props = defineProps<{ inputData: Record<string, any> }>();

/** UI row aligned to first-cargo cons AP charge-line headers */
interface ConsolCostLineRow {
  id: string;
  App_Methods: string;
  Unapportion: number;
  is_locked: number;
  consolidated_invoice_ref: string;
  invoice_no: string;
  Sequence: number | string;
  Charge_Code: string;
  Description: string;
  Branch: string;
  Creditor: string;
  Currency: string;
  Unit_Price: string | number;
  jch_unit: string;
  Qty: string | number;
  Amount: string | number;
  Tax_Code: string;
  Tax_Amount: string | number;
  Home_Amount: string | number;
  cost_items: ConsolCostItemDto[];
}

interface ConsolShipmentLineRow {
  id: string;
  Shipment_No: string;
  Description: string;
  Container_Count: string;
  Chargeable_Weight: string;
  GW: string;
  CBM: string;
  Currency: string;
  Unit_Price: string;
  Unit: string;
  Qty: string;
  Amount: string | number;
  Tax_Code: string;
  Tax_Amount: string;
  Home_Amount: string | number;
}

const loading = ref(false);
const apRows = ref<ConsolCostLineRow[]>([]);
const activeRowId = ref<string | null>(null);
const summary = ref<ConsolBillingSummary>({
  grossProfitMargin: 0,
  ar: 0,
  ap: 0,
  profits: 0,
  home_currency: 'CNY'
});

const jkPk = computed(() => String(props.inputData.jk_pk || props.inputData.pk || '').trim());
const activeRow = computed(() => apRows.value.find(r => r.id === activeRowId.value) ?? null);

const activeShipmentLines = computed<ConsolShipmentLineRow[]>(() => {
  const items = activeRow.value?.cost_items ?? [];
  return items.map((line, index) => ({
    id: String(line.jr_pk || line.js_pk || index),
    Shipment_No: line.shipment_no || '',
    Description: line.jr_desc || '',
    Container_Count: '',
    Chargeable_Weight: '',
    GW: '',
    CBM: '',
    Currency: line.currency || '',
    Unit_Price: '',
    Unit: '',
    Qty: '',
    Amount: line.os_cost_amount ?? '',
    Tax_Code: '',
    Tax_Amount: '',
    Home_Amount: line.local_cost_amount ?? ''
  }));
});

function renderText(value: unknown) {
  return h('span', null, value == null || value === '' ? '' : String(value));
}

function calcUnapportion(item: ConsolBillingCostLineItem) {
  const home = Number(item.local_cost_amount ?? 0);
  const allocated = (item.cost_items ?? []).reduce((sum, line) => sum + Number(line.local_cost_amount ?? 0), 0);
  return Number((home - allocated).toFixed(2));
}

function mapCostLine(item: ConsolBillingCostLineItem): ConsolCostLineRow {
  const draft = String(item.draft ?? 'Y').toUpperCase();
  return {
    id: String(item.e6_pk || ''),
    App_Methods: item.apportionment_method || '',
    Unapportion: calcUnapportion(item),
    is_locked: draft === 'N' ? 1 : 0,
    consolidated_invoice_ref: item.trans_no || '',
    invoice_no: item.invoice_num || '',
    Sequence: item.sequence ?? '',
    Charge_Code: item.charge_code || '',
    Description: item.display_description || '',
    Branch: item.branch_code || '',
    Creditor: item.creditor_code || '',
    Currency: item.currency || '',
    Unit_Price: item.unit_price ?? '',
    jch_unit: item.unit || '',
    Qty: item.qty ?? '',
    Amount: item.os_cost_amount ?? '',
    Tax_Code: item.tax_code || '',
    Tax_Amount: item.os_gst_amount ?? '',
    Home_Amount: item.local_cost_amount ?? '',
    cost_items: item.cost_items ?? []
  };
}

function toggleMore(row: ConsolCostLineRow) {
  activeRowId.value = activeRowId.value === row.id ? null : row.id;
}

/** AP headers aligned with first-cargo ConsolidationBillingChargeLines tblCHeaders */
const apColumns = computed<DataTableColumns<ConsolCostLineRow>>(() => [
  {
    title: 'List',
    key: 'list',
    width: 72,
    align: 'center',
    render: row =>
      h(
        NButton,
        {
          size: 'tiny',
          type: 'primary',
          secondary: activeRowId.value !== row.id,
          onClick: () => toggleMore(row)
        },
        { default: () => 'More' }
      )
  },
  {
    title: 'App Methods',
    key: 'App_Methods',
    width: 110,
    render: row => renderText(row.App_Methods)
  },
  {
    title: 'Unapportion',
    key: 'Unapportion',
    width: 100,
    render: row => {
      const abs = Math.abs(Number(row.Unapportion ?? 0));
      return h(
        'span',
        { style: abs > 0.01 ? 'color: var(--error-color)' : undefined },
        formatBillingAmount(row.Unapportion)
      );
    }
  },
  {
    title: 'Status',
    key: 'is_locked',
    width: 90,
    align: 'center',
    render: row =>
      h(
        NTag,
        { size: 'small', type: getBillingLockTagType(row.is_locked) },
        { default: () => getBillingLockLabel(row.is_locked) }
      )
  },
  { title: 'Trans No.', key: 'consolidated_invoice_ref', width: 100, ellipsis: { tooltip: true } },
  { title: 'Supplier Inv. No.', key: 'invoice_no', width: 220, ellipsis: { tooltip: true } },
  { title: 'Sequence', key: 'Sequence', width: 80 },
  { title: 'Charge Code', key: 'Charge_Code', width: 110, ellipsis: { tooltip: true } },
  { title: 'Description', key: 'Description', width: 200, ellipsis: { tooltip: true } },
  { title: 'Branch', key: 'Branch', width: 80 },
  { title: 'Creditor', key: 'Creditor', width: 120, ellipsis: { tooltip: true } },
  { title: 'Currency', key: 'Currency', width: 90 },
  { title: 'Unit Price', key: 'Unit_Price', width: 100 },
  { title: 'Unit', key: 'jch_unit', width: 110 },
  { title: 'Qty', key: 'Qty', width: 70 },
  {
    title: 'Amount',
    key: 'Amount',
    width: 100,
    render: row => renderText(formatBillingAmount(row.Amount))
  },
  {
    title: 'Tax Code',
    key: 'Tax_Code',
    width: 120,
    render: row => renderText(getBillingTaxCodeLabel(row.Tax_Code))
  },
  {
    title: 'Tax Amount',
    key: 'Tax_Amount',
    width: 110,
    render: row => renderText(formatBillingAmount(row.Tax_Amount))
  },
  {
    title: 'Home Amount',
    key: 'Home_Amount',
    width: 120,
    render: row => renderText(formatBillingAmount(row.Home_Amount))
  }
]);

/** More panel headers aligned with first-cargo ConsolidationChargeShipmentDetailTable */
const shipmentLineColumns: DataTableColumns<ConsolShipmentLineRow> = [
  { title: 'Shipment No.', key: 'Shipment_No', width: 160, ellipsis: { tooltip: true } },
  { title: 'Description', key: 'Description', width: 200, ellipsis: { tooltip: true } },
  { title: 'Container Count', key: 'Container_Count', width: 130 },
  { title: 'Chargeable Weight', key: 'Chargeable_Weight', width: 140 },
  { title: 'Gross Weight', key: 'GW', width: 120 },
  { title: 'CBM', key: 'CBM', width: 80 },
  { title: 'Currency', key: 'Currency', width: 90 },
  { title: 'Unit Price', key: 'Unit_Price', width: 100 },
  { title: 'Unit', key: 'Unit', width: 90 },
  { title: 'Qty', key: 'Qty', width: 80 },
  {
    title: 'Amount',
    key: 'Amount',
    width: 100,
    render: row => renderText(formatBillingAmount(row.Amount))
  },
  { title: 'Tax Code', key: 'Tax_Code', width: 120 },
  { title: 'Tax Amount', key: 'Tax_Amount', width: 110 },
  {
    title: 'Home Amount',
    key: 'Home_Amount',
    width: 120,
    render: row => renderText(formatBillingAmount(row.Home_Amount))
  }
];

async function loadSummary() {
  const pk = jkPk.value;
  if (!pk) return;
  try {
    const { data } = await consolBillingSummary(pk);
    summary.value = {
      grossProfitMargin: Number(data?.grossProfitMargin ?? 0),
      ar: Number(data?.ar ?? 0),
      ap: Number(data?.ap ?? 0),
      profits: Number(data?.profits ?? 0),
      home_currency: data?.home_currency || 'CNY'
    };
  } catch {
    /* ignore */
  }
}

async function loadApCostLines() {
  const pk = jkPk.value;
  if (!pk) return;
  const { data } = await consolBillingChargeLine({
    jkPk: pk,
    chargeType: 'AP',
    skipCount: 0,
    maxResultCount: 1000
  });
  apRows.value = (data?.items ?? []).map(mapCostLine);
  if (activeRowId.value && !apRows.value.some(r => r.id === activeRowId.value)) {
    activeRowId.value = null;
  }
}

async function loadAll() {
  if (!jkPk.value) return;
  loading.value = true;
  try {
    await Promise.all([loadSummary(), loadApCostLines()]);
  } catch {
    window.$message?.error('Failed to load consolidation billing.');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadAll();
});

watch(jkPk, (pk, prev) => {
  if (!pk || pk === prev) return;
  void loadAll();
});
</script>

<template>
  <NSpin :show="loading">
    <NGrid :cols="4" :x-gap="12" :y-gap="12" class="mb-16px">
      <NGi>
        <NCard size="small" :bordered="true">
          <div class="text-12px text-gray-500 mb-6px">Gross Profit Margin</div>
          <div class="text-22px font-600 text-primary">{{ Number(summary.grossProfitMargin ?? 0).toFixed(2) }}%</div>
        </NCard>
      </NGi>
      <NGi>
        <NCard size="small" :bordered="true">
          <div class="text-12px text-gray-500 mb-6px">AR</div>
          <div class="text-22px font-600" style="color: var(--success-color)">
            <span class="text-14px mr-4px">{{ summary.home_currency || 'CNY' }}</span>
            {{ Number(summary.ar ?? 0).toFixed(2) }}
          </div>
        </NCard>
      </NGi>
      <NGi>
        <NCard size="small" :bordered="true">
          <div class="text-12px text-gray-500 mb-6px">AP</div>
          <div class="text-22px font-600" style="color: var(--error-color)">
            <span class="text-14px mr-4px">{{ summary.home_currency || 'CNY' }}</span>
            {{ Number(summary.ap ?? 0).toFixed(2) }}
          </div>
        </NCard>
      </NGi>
      <NGi>
        <NCard size="small" :bordered="true">
          <div class="text-12px text-gray-500 mb-6px">Profits</div>
          <div class="text-22px font-600" style="color: var(--info-color)">
            {{ Number(summary.profits ?? 0).toFixed(2) }}
          </div>
        </NCard>
      </NGi>
    </NGrid>

    <NCard size="small" title="AP">
      <NDataTable
        size="small"
        :bordered="true"
        :columns="apColumns"
        :data="apRows"
        :row-key="(row: ConsolCostLineRow) => row.id"
        :scroll-x="2300"
        :max-height="320"
        striped
      />
      <NCard
        v-if="activeRow"
        size="small"
        class="mt-12px"
        :title="`Shipment Allocation — ${activeRow.Charge_Code || activeRow.Description || activeRow.id}`"
      >
        <NDataTable
          size="small"
          :bordered="true"
          :columns="shipmentLineColumns"
          :data="activeShipmentLines"
          :pagination="false"
          :row-key="(row: ConsolShipmentLineRow) => row.id"
          :scroll-x="2000"
          striped
        />
      </NCard>
    </NCard>
  </NSpin>
</template>
