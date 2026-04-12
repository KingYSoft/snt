<script setup lang="ts">
import { computed } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NCard, NDataTable, NEmpty, NGrid, NGi } from 'naive-ui';
import { $t } from '@/locales';

const props = defineProps<{ inputData: Record<string, any> }>();

const summary = computed(() => ({
  grossProfitMargin: Number(props.inputData.billingSummary?.grossProfitMargin || 0),
  ar: Number(props.inputData.billingSummary?.ar || 0),
  ap: Number(props.inputData.billingSummary?.ap || 0),
  profits: Number(props.inputData.billingSummary?.profits || 0)
}));

const arList = computed<any[]>(() => props.inputData.ar_charges || props.inputData.arCharges || []);
const apList = computed<any[]>(() => props.inputData.ap_charges || props.inputData.apCharges || []);
const invoiceList = computed<any[]>(
  () => props.inputData.invoice_list || props.inputData.invoices || props.inputData.draft_list || []
);

const chargeColumns: DataTableColumns<any> = [
  { title: $t('page.business.consolidation.billing.status'), key: 'status', width: 90 },
  { title: $t('page.business.consolidation.billing.chargeCode'), key: 'chargeCode', minWidth: 120 },
  { title: $t('page.business.consolidation.billing.description'), key: 'description', minWidth: 160 },
  { title: $t('page.business.consolidation.billing.account'), key: 'account', minWidth: 140 },
  { title: $t('page.business.consolidation.billing.branch'), key: 'branch', minWidth: 100 },
  { title: $t('page.business.consolidation.billing.currency'), key: 'currency', width: 90 },
  { title: $t('page.business.consolidation.billing.unitPrice'), key: 'unitPrice', minWidth: 100 },
  { title: $t('page.business.consolidation.billing.qty'), key: 'qty', minWidth: 90 },
  { title: $t('page.business.consolidation.billing.amount'), key: 'amount', minWidth: 100 },
  { title: $t('page.business.consolidation.billing.taxCode'), key: 'taxCode', minWidth: 100 },
  { title: $t('page.business.consolidation.billing.taxAmount'), key: 'taxAmount', minWidth: 100 },
  { title: $t('page.business.consolidation.billing.estimatedCost'), key: 'estimatedCost', minWidth: 120 },
  { title: $t('page.business.consolidation.billing.exchangeRate'), key: 'exchangeRate', minWidth: 120 },
  { title: $t('page.business.consolidation.billing.homeAmount'), key: 'homeAmount', minWidth: 120 }
];

const invoiceColumns: DataTableColumns<any> = [
  { title: $t('page.business.consolidation.billing.jobInvoiceNo'), key: 'ttl_temp_number', minWidth: 160 },
  { title: $t('page.business.consolidation.billing.draft'), key: 'draft', width: 80 },
  { title: $t('page.business.consolidation.billing.account'), key: 'ttl_billing_party', minWidth: 160 },
  { title: $t('page.business.consolidation.billing.ledger'), key: 'ttl_line_type', minWidth: 100 },
  { title: $t('page.business.consolidation.billing.postDate'), key: 'ttl_post_date', minWidth: 120 },
  { title: $t('page.business.consolidation.billing.invoiceDate'), key: 'ttl_reverse_date', minWidth: 120 },
  { title: $t('page.business.consolidation.billing.fullyPaidDate'), key: 'ttl_tax_date', minWidth: 120 },
  { title: $t('page.business.consolidation.billing.currency'), key: 'ttl_ts_currency', width: 90 },
  { title: $t('page.business.consolidation.billing.invoiceAmt'), key: 'ttl_ts_amount', minWidth: 110 },
  { title: $t('page.business.consolidation.billing.paymentStatus'), key: 'payment_status', minWidth: 140 },
  { title: $t('page.business.consolidation.billing.branch'), key: 'branch_code', minWidth: 90 },
  { title: $t('page.business.consolidation.billing.terms'), key: 'ttl_desc', minWidth: 140 }
];

function toNumber(value: unknown) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function mapCharge(item: any, chargeType: 'AR' | 'AP') {
  if ('chargeCode' in item || 'status' in item) {
    return item;
  }

  const isAr = chargeType === 'AR';

  return {
    pk: item.pk,
    status:
      item.jch_is_locked === 1
        ? $t('page.business.consolidation.billing.locked')
        : $t('page.business.consolidation.billing.open'),
    chargeCode: item.jch_charge_code || item.Charge_Code || '',
    description: item.jch_charge_desc || item.Description || '',
    account: isAr ? item.jch_sell_account || item.Debtor : item.jch_cost_account || item.Creditor,
    branch: item.branch_code || item.Branch || '',
    currency: isAr ? item.jch_sell_currency || item.Currency : item.jch_cost_currency || item.Currency,
    unitPrice: isAr ? item.jch_sell_rated || item.Unit_Price : item.jch_cost_rated || item.Unit_Price,
    qty: item.jch_product_quantity || item.Qty,
    amount: isAr ? item.jch_ts_sell_amt || item.Amount : item.jch_ts_cost_amt || item.Amount,
    taxCode: isAr ? item.jch_a9_sell_vat_class || item.Tax_Code : item.jch_a9_cost_vat_class || item.Tax_Code,
    taxAmount: isAr ? item.jch_ts_sell_wht_amt || item.Tax_Amount : item.jch_ts_cost_wht_amt || item.Tax_Amount,
    estimatedCost: item.jch_estimated_cost || item.Estimated_Cost,
    exchangeRate: isAr
      ? item.jch_ts_sell_ex_rate || item.Exchange_Rate
      : item.jch_ts_cost_ex_rate || item.Exchange_Rate,
    homeAmount: isAr ? item.jch_home_sell_amt || item.Home_Amount : item.jch_home_cost_amt || item.Home_Amount
  };
}

function getChargeRowKey(row: any) {
  return row.pk ?? row.id ?? row.chargeCode ?? row.description ?? JSON.stringify(row);
}

function getInvoiceRowKey(row: any) {
  return row.pk ?? row.id ?? row.ttl_temp_number ?? JSON.stringify(row);
}

const normalizedArList = computed(() => arList.value.map((item: any) => mapCharge(item, 'AR')));
const normalizedApList = computed(() => apList.value.map((item: any) => mapCharge(item, 'AP')));
</script>

<template>
  <div class="flex-col-stretch gap-12px p-4">
    <NGrid :cols="4" :x-gap="12">
      <NGi>
        <NCard size="small" class="text-center">
          <div class="text-12px text-gray-500 mb-8px">
            {{ $t('page.business.consolidation.billing.grossProfitMargin') }}
          </div>
          <div class="text-24px font-bold text-primary">{{ toNumber(summary.grossProfitMargin).toFixed(2) }}%</div>
        </NCard>
      </NGi>
      <NGi>
        <NCard size="small" class="text-center">
          <div class="text-12px text-gray-500 mb-8px">{{ $t('page.business.consolidation.billing.ar') }}</div>
          <div class="text-24px font-bold text-success">{{ toNumber(summary.ar).toFixed(2) }}</div>
        </NCard>
      </NGi>
      <NGi>
        <NCard size="small" class="text-center">
          <div class="text-12px text-gray-500 mb-8px">{{ $t('page.business.consolidation.billing.ap') }}</div>
          <div class="text-24px font-bold text-error">{{ toNumber(summary.ap).toFixed(2) }}</div>
        </NCard>
      </NGi>
      <NGi>
        <NCard size="small" class="text-center">
          <div class="text-12px text-gray-500 mb-8px">{{ $t('page.business.consolidation.billing.profits') }}</div>
          <div class="text-24px font-bold text-info">{{ toNumber(summary.profits).toFixed(2) }}</div>
        </NCard>
      </NGi>
    </NGrid>

    <NCard :title="$t('page.business.consolidation.section.arCharges')" size="small">
      <NDataTable
        v-if="normalizedArList.length > 0"
        :columns="chargeColumns"
        :data="normalizedArList"
        :bordered="true"
        size="small"
        :pagination="false"
        :row-key="getChargeRowKey"
        :scroll-x="1600"
      />
      <NEmpty v-else />
    </NCard>

    <NCard :title="$t('page.business.consolidation.section.apCharges')" size="small">
      <NDataTable
        v-if="normalizedApList.length > 0"
        :columns="chargeColumns"
        :data="normalizedApList"
        :bordered="true"
        size="small"
        :pagination="false"
        :row-key="getChargeRowKey"
        :scroll-x="1600"
      />
      <NEmpty v-else />
    </NCard>

    <NCard :title="$t('page.business.consolidation.section.invoices')" size="small">
      <NDataTable
        v-if="invoiceList.length > 0"
        :columns="invoiceColumns"
        :data="invoiceList"
        :bordered="true"
        size="small"
        :pagination="false"
        :row-key="getInvoiceRowKey"
        :scroll-x="1600"
      />
      <NEmpty v-else />
    </NCard>
  </div>
</template>
