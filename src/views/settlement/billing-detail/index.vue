<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { $t } from '@/locales';
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
    window.$message?.error($t('page.settlement.billingDetail.loadFailed'));
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
          <NDescriptionsItem :label="$t('page.settlement.billingDetail.transactionNo')">
            {{ formatValue(detailData.ah_transactionnum) }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.settlement.billingDetail.ledger')">
            {{ formatValue(detailData.ah_ledger) }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.settlement.billingDetail.type')">
            {{ formatValue(detailData.ah_transactiontype) }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.settlement.billingDetail.transactionCategory')">
            {{ formatValue(detailData.ah_transactioncategory) }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.settlement.billingDetail.currency')">
            {{ formatValue(detailData.ah_rx_nktransactioncurrency) }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.settlement.billingDetail.exchangeRate')">
            {{ formatMoney(detailData.ah_exchangerate) }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.settlement.billingDetail.invoiceAmount')">
            {{ formatMoney(detailData.ah_invoiceamount) }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.settlement.billingDetail.gstAmount')">
            {{ formatMoney(detailData.ah_gstamount) }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.settlement.billingDetail.withholdingTax')">
            {{ formatMoney(detailData.ah_withholdingtax) }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.settlement.billingDetail.osTotal')">
            {{ formatMoney(detailData.ah_ostotal) }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.settlement.billingDetail.outstandingAmount')">
            {{ formatMoney(detailData.ah_outstandingamount) }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.settlement.billingDetail.localTotal')">
            {{ formatMoney(detailData.ah_localtotal) }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.settlement.billingDetail.invoiceDate')">
            {{ formatDate(detailData.ah_invoicedate) }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.settlement.billingDetail.dueDate')">
            {{ formatDate(detailData.ah_duedate) }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.settlement.billingDetail.postDate')">
            {{ formatDate(detailData.ah_postdate) }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.settlement.billingDetail.fullyPaidDate')">
            {{ formatDate(detailData.ah_fullypaiddate) }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.settlement.billingDetail.matchStatus')">
            {{ formatValue(detailData.ah_matchstatus) }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.settlement.billingDetail.jobNumber')">
            {{ formatValue(detailData.ah_jobnumber) }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.settlement.billingDetail.reference')">
            {{ formatValue(detailData.ah_transactionreference) }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.settlement.billingDetail.chequeReference')">
            {{ formatValue(detailData.ah_chequeorreference) }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.settlement.billingDetail.invoiceTerm')">
            {{ formatValue(detailData.ah_invoiceterm) }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.settlement.billingDetail.receiptType')">
            {{ formatValue(detailData.ah_receipttype) }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.settlement.billingDetail.description')" :span="2">
            {{ formatValue(detailData.ah_desc) }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.settlement.billingDetail.createdBy')">
            {{ formatValue(detailData.ah_systemcreateuser) }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.settlement.billingDetail.createdTime')">
            {{ formatDateTime(detailData.ah_systemcreatetimeutc) }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.settlement.billingDetail.lastEditBy')">
            {{ formatValue(detailData.ah_systemlastedituser) }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.settlement.billingDetail.lastEditTime')">
            {{ formatDateTime(detailData.ah_systemlastedittimeutc) }}
          </NDescriptionsItem>
        </NDescriptions>
      </template>
    </NCard>
  </div>
</template>
