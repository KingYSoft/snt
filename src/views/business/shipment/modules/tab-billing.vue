<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */

import { ref, watch } from 'vue';
import { NTabs, NTabPane } from 'naive-ui';
import TabBillingChargeLines from './tab-billing-charge-lines.vue';
import TabBillingInvoice from './tab-billing-invoice.vue';

const props = defineProps<{
  inputData: Record<string, any>;
}>();
const emit = defineEmits<{ (e: 'print'): void }>();

const refreshBillingSummary = defineModel<boolean>('refreshBillingSummary', { default: false });

const billingTab = ref('charge');
const chargeLinesRef = ref<InstanceType<typeof TabBillingChargeLines> | null>(null);
const invoiceRef = ref<InstanceType<typeof TabBillingInvoice> | null>(null);

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
  () => refreshBillingSummary.value,
  value => {
    if (value) {
      chargeLinesRef.value?.loadAll();
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
      <TabBillingChargeLines
        ref="chargeLinesRef"
        :input-data="inputData"
        @update:ar-charges="handleUpdateArCharges"
        @update:ap-charges="handleUpdateApCharges"
      />
    </template>

    <template v-if="billingTab === 'invoice'">
      <TabBillingInvoice ref="invoiceRef" :input-data="inputData" @print="handlePrint" />
    </template>
  </div>
</template>
