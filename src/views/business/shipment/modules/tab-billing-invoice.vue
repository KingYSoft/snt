<script setup lang="ts">
import { ref, watch } from 'vue';
import { NDataTable, NButton, NSpace, NPagination, NInput } from 'naive-ui';
import { queryDraftPage, postCharge } from '@/service/api/business/shipment';

const props = defineProps<{ inputData: Record<string, any> }>();
const emit = defineEmits<{ (e: 'print'): void }>();

const invoiceList = ref<any[]>([]);
const invoiceLoading = ref(false);
const invoicePage = ref(1);
const invoicePageSize = ref(100);
const invoiceTotal = ref(0);
const invoiceSelected = ref<any[]>([]);
const invoiceSearchNo = ref('');

const invoiceColumns = [
  { type: 'selection' as const },
  { title: 'Job Invoice No.', key: 'ttl_temp_number', width: 140, ellipsis: { tooltip: true } },
  { title: 'Draft', key: 'draft', width: 80 },
  { title: 'Account', key: 'ttl_billing_party', width: 140, ellipsis: { tooltip: true } },
  { title: 'Ledger', key: 'ttl_line_type', width: 100 },
  { title: 'Post Date', key: 'ttl_post_date', width: 120 },
  { title: 'Invoice Date', key: 'ttl_reverse_date', width: 120 },
  { title: 'Fully Paid Date', key: 'ttl_tax_date', width: 120 },
  { title: 'Currency', key: 'ttl_ts_currency', width: 80 },
  { title: 'Invoice Amt', key: 'ttl_ts_amount', width: 100 },
  { title: 'Payment Status', key: 'payment_status', width: 120 },
  { title: 'Branch', key: 'branch_code', width: 80 },
  { title: 'Terms', key: 'ttl_desc', width: 140, ellipsis: { tooltip: true } }
];

async function loadInvoices() {
  if (!props.inputData.pk) return;
  try {
    invoiceLoading.value = true;
    const params = {
      shpPk: props.inputData.pk,
      SkipCount: (invoicePage.value - 1) * invoicePageSize.value,
      MaxResultCount: invoicePageSize.value,
      ...(invoiceSearchNo.value && { invoice_no: invoiceSearchNo.value })
    };
    const { data } = await queryDraftPage(params);
    if (data) {
      invoiceList.value = data.items ?? [];
      invoiceTotal.value = data.totalCount ?? 0;
    }
  } catch {
    /* ignore */
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

async function handlePost() {
  const pks = invoiceSelected.value.map((item: any) => item.pk).filter(Boolean);
  if (pks.length === 0) {
    window.$message?.warning('Please select at least one record.');
    return;
  }
  try {
    await postCharge({ pks });
    window.$message?.success('Post success');
    loadInvoices();
    invoiceSelected.value = [];
  } catch {
    window.$message?.error('Post failed');
  }
}

async function handleVoid() {
  const pks = invoiceSelected.value.map((item: any) => item.pk).filter(Boolean);
  if (pks.length === 0) {
    window.$message?.warning('Please select at least one record.');
    return;
  }
  try {
    await postCharge({ pks });
    window.$message?.success('Void success');
    loadInvoices();
    invoiceSelected.value = [];
  } catch {
    window.$message?.error('Void failed');
  }
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
      <NButton type="primary" size="small" :loading="invoiceLoading" @click="handlePost">Post</NButton>
      <NButton type="error" size="small" ghost :loading="invoiceLoading" @click="handleVoid">Void</NButton>
      <NButton size="small" @click="emit('print')">Print</NButton>
    </NSpace>
    <NDataTable
      v-model:checked-row-keys="invoiceSelected"
      :columns="invoiceColumns"
      :data="invoiceList"
      :bordered="true"
      size="small"
      :loading="invoiceLoading"
      :row-key="(row: any) => row.pk"
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
