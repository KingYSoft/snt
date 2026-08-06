<script setup lang="ts">
import { ref } from 'vue';
import { NTabs, NTabPane } from 'naive-ui';
import TabBillingChargeLines from './tab-billing-charge-lines.vue';
import TabBillingInvoice from './tab-billing-invoice.vue';
import TabBillingVat from './tab-billing-vat.vue';

defineProps<{ inputData: Record<string, any> }>();

const billingTab = ref<'charge' | 'invoice' | 'vat'>('charge');
</script>

<template>
  <div class="p-4">
    <NTabs v-model:value="billingTab" type="line" class="mb-12px">
      <NTabPane name="charge" tab="Charge Line" />
      <NTabPane name="invoice" tab="Invoice" />
      <NTabPane name="vat" tab="VAT Inv" />
    </NTabs>

    <TabBillingChargeLines v-if="billingTab === 'charge'" :input-data="inputData" />
    <TabBillingInvoice v-else-if="billingTab === 'invoice'" :input-data="inputData" />
    <TabBillingVat v-else :input-data="inputData" />
  </div>
</template>
