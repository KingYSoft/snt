<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */

import { ref, watch } from 'vue';
import { NCard, NGrid, NGi, NTabs, NTabPane } from 'naive-ui';
import { getBillingSummary } from '@/service/api/business/billing';
import TabBillingChargeLines from './tab-billing-charge-lines.vue';
import TabBillingInvoice from './tab-billing-invoice.vue';

const props = defineProps<{
  inputData: Record<string, any>;
  saveBillingFn?: () => Promise<boolean | undefined>;
}>();
const emit = defineEmits<{ (e: 'print'): void }>();

const refreshBillingSummary = defineModel<boolean>('refreshBillingSummary', { default: false });

const billingTab = ref('charge');
const chargeLinesRef = ref<InstanceType<typeof TabBillingChargeLines> | null>(null);
const invoiceRef = ref<InstanceType<typeof TabBillingInvoice> | null>(null);

const summary = ref({ grossProfitMargin: 0, ar: 0, ap: 0, profits: 0, home_currency: '' as string | null });
const summaryLoading = ref(false);

async function loadSummary() {
  if (!props.inputData.pk) return;
  try {
    summaryLoading.value = true;
    const { data } = await getBillingSummary(props.inputData.pk);
    if (data) {
      summary.value = {
        grossProfitMargin: Number(data.grossProfitMargin ?? 0),
        ar: Number(data.ar ?? 0),
        ap: Number(data.ap ?? 0),
        profits: Number(data.profits ?? 0),
        home_currency: data.home_currency ?? null
      };
    }
  } catch {
    /* ignore */
  } finally {
    summaryLoading.value = false;
  }
}

function handlePrint() {
  emit('print');
}

function handleUpdateArCharges(value: any[]) {
  props.inputData.ar_charges = value;
}

function handleUpdateApCharges(value: any[]) {
  props.inputData.ap_charges = value;
}

watch(
  () => props.inputData.pk,
  pk => {
    if (pk) loadSummary();
  },
  { immediate: true }
);

watch(
  () => refreshBillingSummary.value,
  value => {
    if (value) {
      chargeLinesRef.value?.loadAll();
      loadSummary();
      invoiceRef.value?.loadInvoices();
      refreshBillingSummary.value = false;
    }
  }
);
</script>

<template>
  <div class="p-4">
    <NTabs v-model:value="billingTab" type="line" class="mb-12px">
      <NTabPane name="charge" tab="Charge Line" />
      <NTabPane name="invoice" tab="Invoice" />
    </NTabs>

    <template v-if="billingTab === 'charge'">
      <NGrid :cols="4" :x-gap="12" class="mb-16px">
        <NGi>
          <NCard size="small" class="text-center">
            <div class="text-12px text-gray-500 mb-8px">Gross Profit Margin</div>
            <div class="text-24px font-bold text-primary">{{ summary.grossProfitMargin.toFixed(2) }}%</div>
          </NCard>
        </NGi>
        <NGi>
          <NCard size="small" class="text-center">
            <div class="text-12px text-gray-500 mb-8px">AR</div>
            <div class="text-24px font-bold text-success">
              <span v-if="summary.home_currency" class="text-16px mr-4px">{{ summary.home_currency }}</span>
              {{ summary.ar.toFixed(2) }}
            </div>
          </NCard>
        </NGi>
        <NGi>
          <NCard size="small" class="text-center">
            <div class="text-12px text-gray-500 mb-8px">AP</div>
            <div class="text-24px font-bold text-error">
              <span v-if="summary.home_currency" class="text-16px mr-4px">{{ summary.home_currency }}</span>
              {{ summary.ap.toFixed(2) }}
            </div>
          </NCard>
        </NGi>
        <NGi>
          <NCard size="small" class="text-center">
            <div class="text-12px text-gray-500 mb-8px">Profits</div>
            <div class="text-24px font-bold text-info">{{ summary.profits.toFixed(2) }}</div>
          </NCard>
        </NGi>
      </NGrid>

      <TabBillingChargeLines
        ref="chargeLinesRef"
        :input-data="inputData"
        :save-billing-fn="saveBillingFn"
        @update:ar-charges="handleUpdateArCharges"
        @update:ap-charges="handleUpdateApCharges"
      />
    </template>

    <template v-if="billingTab === 'invoice'">
      <TabBillingInvoice ref="invoiceRef" :input-data="inputData" @print="handlePrint" />
    </template>
  </div>
</template>
