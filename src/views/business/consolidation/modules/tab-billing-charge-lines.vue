<script setup lang="ts">
import { computed, h, onMounted, ref, watch } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NCard, NDataTable, NGi, NGrid, NSpin, NTag } from 'naive-ui';
import { getBillingTaxCodeLabel } from '@/constants/billingTaxCodeItems';
import {
  consolBillingChargeLine,
  consolBillingSummary,
  type ConsolBillingSummary
} from '@/service/api/business/consol-billing';
import {
  getBillingLockLabel,
  getBillingLockTagType,
  mapChargeLineItem,
  type ShipmentBillingChargeRow
} from '@/views/business/shipment/modules/shipment-billing-map';

const props = defineProps<{ inputData: Record<string, any> }>();

const loading = ref(false);
const arRows = ref<ShipmentBillingChargeRow[]>([]);
const apRows = ref<ShipmentBillingChargeRow[]>([]);
const summary = ref<ConsolBillingSummary>({
  grossProfitMargin: 0,
  ar: 0,
  ap: 0,
  profits: 0,
  home_currency: 'CNY'
});

const jkPk = computed(() => String(props.inputData.jk_pk || props.inputData.pk || '').trim());

function renderText(value: unknown) {
  return h('span', null, value == null || value === '' ? '' : String(value));
}

function makeColumns(kind: 'AR' | 'AP'): DataTableColumns<ShipmentBillingChargeRow> {
  return [
    {
      title: 'Status',
      key: 'is_locked',
      width: 90,
      render: row =>
        h(
          NTag,
          { size: 'small', type: getBillingLockTagType(row.is_locked) },
          { default: () => getBillingLockLabel(row.is_locked) }
        )
    },
    { title: 'Invoice No.', key: 'invoice_no', width: 130, ellipsis: { tooltip: true } },
    {
      title: 'Charge Code',
      key: 'charge_code',
      width: 110,
      render: row => renderText(row.charge_code || row.Charge_Code)
    },
    { title: 'Description', key: 'Description', minWidth: 160, ellipsis: { tooltip: true } },
    {
      title: 'Branch',
      key: 'branch_code',
      width: 90,
      render: row => renderText(row.branch_code || row.Branch)
    },
    {
      title: kind === 'AR' ? 'Debtor' : 'Creditor',
      key: 'party_code',
      width: 120,
      ellipsis: { tooltip: true },
      render: row => renderText(row.party_code)
    },
    { title: 'Currency', key: 'Currency', width: 80 },
    { title: 'Type', key: 'JR_InvoiceType', width: 80 },
    { title: 'Amount', key: 'Amount', width: 100 },
    {
      title: 'Tax',
      key: 'Tax_Code',
      width: 100,
      render: row => renderText(getBillingTaxCodeLabel(row.Tax_Code))
    },
    { title: 'Tax Amt', key: 'Tax_Amount', width: 90 },
    { title: 'Exch Rate', key: 'Exchange_Rate', width: 90 },
    { title: 'Home Amt', key: 'Home_Amount', width: 100 }
  ];
}

const arColumns = computed(() => makeColumns('AR'));
const apColumns = computed(() => makeColumns('AP'));

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

async function loadChargeLines(chargeType: 'AR' | 'AP') {
  const pk = jkPk.value;
  if (!pk) return;
  const { data } = await consolBillingChargeLine({
    jkPk: pk,
    chargeType,
    skipCount: 0,
    maxResultCount: 1000
  });
  const mapped = (data?.items ?? []).map(item => mapChargeLineItem(item, chargeType));
  if (chargeType === 'AR') arRows.value = mapped;
  else apRows.value = mapped;
}

async function loadAll() {
  if (!jkPk.value) return;
  loading.value = true;
  try {
    await Promise.all([loadSummary(), loadChargeLines('AR'), loadChargeLines('AP')]);
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

    <NCard size="small" class="mb-16px" title="AR Charge Lines">
      <NDataTable
        size="small"
        :bordered="true"
        :columns="arColumns"
        :data="arRows"
        :row-key="(row: ShipmentBillingChargeRow) => row.id"
        :scroll-x="1400"
        :max-height="280"
        striped
      />
    </NCard>

    <NCard size="small" title="AP Charge Lines">
      <NDataTable
        size="small"
        :bordered="true"
        :columns="apColumns"
        :data="apRows"
        :row-key="(row: ShipmentBillingChargeRow) => row.id"
        :scroll-x="1400"
        :max-height="280"
        striped
      />
    </NCard>
  </NSpin>
</template>
