<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { getBillingDetail } from '@/service/api/business/billing';
import { useTabStore } from '@/store/modules/tab';
defineOptions({ name: 'PageSettlementBillingDetail' });

const tabStore = useTabStore();
const route = useRoute();
const loading = ref(false);
const detailData = ref<Record<string, any> | null>(null);

const id = route.query.id as string;

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
}

function formatDate(value: unknown) {
  if (!value) return '-';
  const s = String(value);
  if (s.includes('T')) return s.split('T')[0];
  return s;
}

function formatDateTime(value: unknown) {
  if (!value) return '-';
  const s = String(value);
  return s.replace('T', ' ').split('.')[0];
}

function formatMoney(value: unknown) {
  const n = Number(value);
  if (Number.isNaN(n)) return '-';
  return n.toFixed(2);
}

onMounted(() => {
  if (id) {
    loadBillingDetail();
  }
});

async function loadBillingDetail() {
  loading.value = true;
  try {
    const { data } = await getBillingDetail(id);
    if (data) {
      detailData.value = data;
      // Update tab label with shipment_no
      if (detailData.value && detailData?.value.ah_transactionnum) {
        tabStore.setTabLabel(`账单详情 - ${detailData.value.ah_transactionnum ?? ''}`);
      }
    }
  } catch {
    window.$message?.error('Failed to load billing detail');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="h-full overflow-auto p-16px">
    <NCard :title="`账单详情 - ${detailData?.ah_transactionnum ?? ''}`" :bordered="false">
      <NSkeleton v-if="loading" text :row="8" />
      <template v-else-if="detailData">
        <NDescriptions label-placement="left" :column="2" bordered class="mb-12px">
          <NDescriptionsItem label="Transaction No.">
            {{ formatValue(detailData.ah_transactionnum) }}
          </NDescriptionsItem>
          <NDescriptionsItem label="Ledger">
            {{ formatValue(detailData.ah_ledger) }}
          </NDescriptionsItem>
          <NDescriptionsItem label="Type">
            {{ formatValue(detailData.ah_transactiontype) }}
          </NDescriptionsItem>
          <NDescriptionsItem label="Transaction Category">
            {{ formatValue(detailData.ah_transactioncategory) }}
          </NDescriptionsItem>
          <NDescriptionsItem label="Currency">
            {{ formatValue(detailData.ah_rx_nktransactioncurrency) }}
          </NDescriptionsItem>
          <NDescriptionsItem label="Exchange Rate">
            {{ formatMoney(detailData.ah_exchangerate) }}
          </NDescriptionsItem>
          <NDescriptionsItem label="Invoice Amount">
            {{ formatMoney(detailData.ah_invoiceamount) }}
          </NDescriptionsItem>
          <NDescriptionsItem label="GST Amount">
            {{ formatMoney(detailData.ah_gstamount) }}
          </NDescriptionsItem>
          <NDescriptionsItem label="Withholding Tax">
            {{ formatMoney(detailData.ah_withholdingtax) }}
          </NDescriptionsItem>
          <NDescriptionsItem label="OS Total">
            {{ formatMoney(detailData.ah_ostotal) }}
          </NDescriptionsItem>
          <NDescriptionsItem label="Outstanding Amount">
            {{ formatMoney(detailData.ah_outstandingamount) }}
          </NDescriptionsItem>
          <NDescriptionsItem label="Local Total">
            {{ formatMoney(detailData.ah_localtotal) }}
          </NDescriptionsItem>
          <NDescriptionsItem label="Invoice Date">
            {{ formatDate(detailData.ah_invoicedate) }}
          </NDescriptionsItem>
          <NDescriptionsItem label="Due Date">
            {{ formatDate(detailData.ah_duedate) }}
          </NDescriptionsItem>
          <NDescriptionsItem label="Post Date">
            {{ formatDate(detailData.ah_postdate) }}
          </NDescriptionsItem>
          <NDescriptionsItem label="Fully Paid Date">
            {{ formatDate(detailData.ah_fullypaiddate) }}
          </NDescriptionsItem>
          <NDescriptionsItem label="Match Status">
            {{ formatValue(detailData.ah_matchstatus) }}
          </NDescriptionsItem>
          <NDescriptionsItem label="Job Number">
            {{ formatValue(detailData.ah_jobnumber) }}
          </NDescriptionsItem>
          <NDescriptionsItem label="Reference">
            {{ formatValue(detailData.ah_transactionreference) }}
          </NDescriptionsItem>
          <NDescriptionsItem label="Cheque/Reference">
            {{ formatValue(detailData.ah_chequeorreference) }}
          </NDescriptionsItem>
          <NDescriptionsItem label="Invoice Term">
            {{ formatValue(detailData.ah_invoiceterm) }}
          </NDescriptionsItem>
          <NDescriptionsItem label="Receipt Type">
            {{ formatValue(detailData.ah_receipttype) }}
          </NDescriptionsItem>
          <NDescriptionsItem label="Description" :span="2">
            {{ formatValue(detailData.ah_desc) }}
          </NDescriptionsItem>
          <NDescriptionsItem label="Created By">
            {{ formatValue(detailData.ah_systemcreateuser) }}
          </NDescriptionsItem>
          <NDescriptionsItem label="Created Time">
            {{ formatDateTime(detailData.ah_systemcreatetimeutc) }}
          </NDescriptionsItem>
          <NDescriptionsItem label="Last Edit By">
            {{ formatValue(detailData.ah_systemlastedituser) }}
          </NDescriptionsItem>
          <NDescriptionsItem label="Last Edit Time">
            {{ formatDateTime(detailData.ah_systemlastedittimeutc) }}
          </NDescriptionsItem>
        </NDescriptions>
      </template>
    </NCard>
  </div>
</template>
