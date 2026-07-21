<script setup lang="ts">
import { h, ref, watch, computed } from 'vue';
import { NDataTable, NButton, NSpace, NPagination, NInput, NSelect, NTag } from 'naive-ui';
import {
  billingDraftPage,
  voidDraftInvoice,
  voidPostedInvoice,
  type AccTransactionHeader
} from '@/service/api/business/billing';
import { formatInvoiceDate, getInvoiceHeaderStatus } from './shipment-billing-map';

const props = defineProps<{ inputData: Record<string, any> }>();

const invoiceList = ref<AccTransactionHeader[]>([]);
const invoiceLoading = ref(false);
const invoicePage = ref(1);
const invoicePageSize = ref(100);
const invoiceTotal = ref(0);
const invoiceSelected = ref<string[]>([]);
const invoiceSearchNo = ref('');
const invoiceChargeType = ref<'AR' | 'AP'>('AR');
const voiding = ref(false);

const chargeTypeOptions = [
  { label: 'AR', value: 'AR' },
  { label: 'AP', value: 'AP' }
];

function getInvoiceStatusType(status: string): 'default' | 'success' | 'warning' | 'error' | 'info' {
  switch (status) {
    case 'Posted':
      return 'warning';
    case 'Voided':
    case 'Canceled':
      return 'info';
    default:
      return 'success';
  }
}

const invoiceColumns = [
  { type: 'selection' as const },
  { title: 'Job Invoice No.', key: 'ah_transactionnum', width: 140, ellipsis: { tooltip: true } },
  {
    title: 'Status',
    key: 'status',
    width: 90,
    render: (row: AccTransactionHeader) => {
      const status = getInvoiceHeaderStatus(row);
      return h(NTag, { type: getInvoiceStatusType(status), size: 'small' }, { default: () => status });
    }
  },
  { title: 'Account', key: 'oh_fullname', width: 140, ellipsis: { tooltip: true } },
  { title: 'Ledger', key: 'ah_ledger', width: 100 },
  {
    title: 'Post Date',
    key: 'ah_postdate',
    width: 120,
    render: (row: AccTransactionHeader) => formatInvoiceDate(row.ah_postdate)
  },
  {
    title: 'Invoice Date',
    key: 'ah_invoicedate',
    width: 120,
    render: (row: AccTransactionHeader) => formatInvoiceDate(row.ah_invoicedate)
  },
  {
    title: 'Fully Paid Date',
    key: 'ah_fullypaiddate',
    width: 120,
    render: (row: AccTransactionHeader) => formatInvoiceDate(row.ah_fullypaiddate)
  },
  { title: 'Currency', key: 'ah_rx_nktransactioncurrency', width: 80 },
  { title: 'Invoice Amt', key: 'ah_invoiceamount', width: 100 },
  { title: 'Payment Status', key: 'ah_matchstatus', width: 120 },
  { title: 'Branch', key: 'ah_systemcreatebranch', width: 80 },
  { title: 'Terms', key: 'ah_invoiceterm', width: 140, ellipsis: { tooltip: true } }
];

const displayList = computed(() => {
  const q = invoiceSearchNo.value.trim().toLowerCase();
  if (!q) return invoiceList.value;
  return invoiceList.value.filter(row =>
    String(row.ah_transactionnum ?? '')
      .toLowerCase()
      .includes(q)
  );
});

function getSelectedItems() {
  const keySet = new Set(invoiceSelected.value.map(key => String(key).trim()).filter(Boolean));
  return invoiceList.value.filter(item => keySet.has(String(item.ah_pk ?? '').trim()));
}

async function loadInvoices() {
  if (!props.inputData.pk) return;
  try {
    invoiceLoading.value = true;
    const { data } = await billingDraftPage({
      shpPk: props.inputData.pk,
      chargeType: invoiceChargeType.value,
      skipCount: (invoicePage.value - 1) * invoicePageSize.value,
      maxResultCount: invoicePageSize.value,
      sorting: 'Id DESC'
    });
    invoiceList.value = data?.items ?? [];
    invoiceTotal.value = data?.totalCount ?? 0;
  } catch {
    window.$message?.error('Failed to load invoice data.');
  } finally {
    invoiceLoading.value = false;
  }
}

function handlePageChange(page: number) {
  invoicePage.value = page;
  loadInvoices();
}

function handleSearch() {
  invoicePage.value = 1;
  loadInvoices();
}

function handleSearchClear() {
  invoiceSearchNo.value = '';
  invoicePage.value = 1;
  loadInvoices();
}

function handleChargeTypeChange() {
  invoicePage.value = 1;
  invoiceSelected.value = [];
  loadInvoices();
}

async function handleVoid() {
  const selectedItems = getSelectedItems();
  if (!selectedItems.length) {
    window.$message?.warning('Please select at least one record.');
    return;
  }

  const draftItems = selectedItems.filter(item => !item.ah_postdate && item.ah_iscancelled === 0);
  const postedItems = selectedItems.filter(item => item.ah_postdate && item.ah_iscancelled === 0);

  try {
    voiding.value = true;

    if (draftItems.length) {
      const ahPks = draftItems.map(item => String(item.ah_pk ?? '').trim()).filter(Boolean);
      if (ahPks.length) await voidDraftInvoice({ ahPks });
    }

    if (postedItems.length) {
      const invoiceNos = postedItems.map(item => String(item.ah_transactionnum ?? '').trim()).filter(Boolean);
      if (invoiceNos.length) await voidPostedInvoice(invoiceNos);
    }

    window.$message?.success('Operation completed.');
    invoiceSelected.value = [];
    await loadInvoices();
  } catch {
    window.$message?.error('Void failed');
  } finally {
    voiding.value = false;
  }
}

function handlePrint() {
  window.$message?.info('Print API is not available in billing swagger yet.');
}

watch(
  () => props.inputData.pk,
  pk => {
    if (pk) loadInvoices();
  },
  { immediate: true }
);

defineExpose({ loadInvoices });
</script>

<template>
  <div>
    <NSpace class="mb-12px" align="center">
      <NSelect
        v-model:value="invoiceChargeType"
        :options="chargeTypeOptions"
        style="width: 88px"
        size="small"
        @update:value="handleChargeTypeChange"
      />
      <NInput
        v-model:value="invoiceSearchNo"
        placeholder="Search Invoice No."
        clearable
        style="width: 200px"
        @keyup.enter="handleSearch"
        @clear="handleSearchClear"
      />
      <NButton type="primary" size="small" @click="handleSearch">Search</NButton>
      <NButton size="small" :loading="invoiceLoading" @click="loadInvoices">Refresh</NButton>
      <NButton type="error" size="small" ghost :loading="voiding" @click="handleVoid">Void</NButton>
      <NButton size="small" @click="handlePrint">Print</NButton>
    </NSpace>
    <NDataTable
      v-model:checked-row-keys="invoiceSelected"
      :columns="invoiceColumns"
      :data="displayList"
      :bordered="true"
      size="small"
      :loading="invoiceLoading"
      :row-key="(row: AccTransactionHeader) => row.ah_pk"
      :scroll-x="1500"
      striped
    />
    <div class="mt-12px flex justify-end">
      <NPagination
        v-model:page="invoicePage"
        :page-size="invoicePageSize"
        :item-count="invoiceTotal"
        @update:page="handlePageChange"
      />
    </div>
  </div>
</template>
