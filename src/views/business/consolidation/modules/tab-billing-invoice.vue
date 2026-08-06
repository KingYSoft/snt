<script setup lang="ts">
import { computed, h, ref, watch } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NButton, NDataTable, NInput, NModal, NPagination, NSelect, NSpace, NSpin, NTag } from 'naive-ui';
import { getBillingTaxCodeLabel } from '@/constants/billingTaxCodeItems';
import {
  consolBillingChargesByInvoice,
  consolBillingDraftPage,
  type AccTransactionHeader,
  type BillingChargeLineItem
} from '@/service/api/business/consol-billing';
import { formatInvoiceDate, getInvoiceHeaderStatus } from '@/views/business/shipment/modules/shipment-billing-map';

const props = defineProps<{ inputData: Record<string, any> }>();

const invoiceList = ref<AccTransactionHeader[]>([]);
const invoiceLoading = ref(false);
const invoicePage = ref(1);
const invoicePageSize = ref(100);
const invoiceTotal = ref(0);
const invoiceSearchNo = ref('');
const invoiceChargeType = ref<'AR' | 'AP'>('AR');

const chargeDetailVisible = ref(false);
const chargeDetailLoading = ref(false);
const chargeDetailInvoiceNo = ref('');
const chargeDetailRows = ref<BillingChargeLineItem[]>([]);

const chargeTypeOptions = [
  { label: 'AR', value: 'AR' },
  { label: 'AP', value: 'AP' }
];

const jkPk = computed(() => String(props.inputData.jk_pk || props.inputData.pk || '').trim());

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

async function openChargeDetail(invoiceNo?: string | null) {
  const no = String(invoiceNo ?? '').trim();
  if (!no) return;

  chargeDetailInvoiceNo.value = no;
  chargeDetailVisible.value = true;
  chargeDetailLoading.value = true;
  chargeDetailRows.value = [];

  try {
    const { data } = await consolBillingChargesByInvoice(no);
    chargeDetailRows.value = data?.charges ?? [];
  } catch {
    window.$message?.error('Failed to load invoice charges.');
    chargeDetailRows.value = [];
  } finally {
    chargeDetailLoading.value = false;
  }
}

const invoiceColumns = computed<DataTableColumns<AccTransactionHeader>>(() => [
  {
    title: 'Job Invoice No.',
    key: 'ah_transactionnum',
    width: 140,
    ellipsis: { tooltip: true },
    render: (row: AccTransactionHeader) => {
      const no = String(row.ah_transactionnum ?? '').trim();
      if (!no) return '';
      return h(
        'a',
        {
          href: 'javascript:void(0)',
          class: 'invoice-no-link',
          onClick: (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            void openChargeDetail(no);
          }
        },
        no
      );
    }
  },
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
]);

const chargeDetailColumns: DataTableColumns<BillingChargeLineItem> = [
  { title: 'Charge Code', key: 'charge_code', width: 110, ellipsis: { tooltip: true } },
  { title: 'Description', key: 'jr_desc', minWidth: 160, ellipsis: { tooltip: true } },
  { title: 'Party', key: 'party_code', width: 120, ellipsis: { tooltip: true } },
  { title: 'Branch', key: 'branch_code', width: 90 },
  { title: 'Currency', key: 'currency', width: 80 },
  { title: 'Type', key: 'jr_invoicetype', width: 80 },
  { title: 'Amount', key: 'amount', width: 100 },
  { title: 'Home Amt', key: 'os_amount', width: 100 },
  { title: 'Exch Rate', key: 'exchange_rate', width: 90 },
  {
    title: 'Tax',
    key: 'tax',
    width: 100,
    render: row => getBillingTaxCodeLabel(row.wht_rate || row.gst_rate)
  }
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

const chargeDetailTitle = computed(() => `Invoice ${chargeDetailInvoiceNo.value}`);

async function loadInvoices() {
  if (!jkPk.value) return;
  try {
    invoiceLoading.value = true;
    const { data } = await consolBillingDraftPage({
      jkPk: jkPk.value,
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
  void loadInvoices();
}

function handleSearch() {
  invoicePage.value = 1;
  void loadInvoices();
}

function handleSearchClear() {
  invoiceSearchNo.value = '';
  invoicePage.value = 1;
  void loadInvoices();
}

function handleChargeTypeChange() {
  invoicePage.value = 1;
  void loadInvoices();
}

watch(
  jkPk,
  pk => {
    if (pk) void loadInvoices();
  },
  { immediate: true }
);
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
    </NSpace>
    <NDataTable
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

    <NModal
      v-model:show="chargeDetailVisible"
      preset="card"
      :title="chargeDetailTitle"
      style="width: min(960px, 92vw)"
      :bordered="false"
      :segmented="{ content: true }"
    >
      <NSpin :show="chargeDetailLoading">
        <NDataTable
          size="small"
          :bordered="true"
          :columns="chargeDetailColumns"
          :data="chargeDetailRows"
          :pagination="false"
          :scroll-x="1100"
          striped
        />
      </NSpin>
    </NModal>
  </div>
</template>

<style scoped>
.invoice-no-link {
  color: var(--primary-color);
  text-decoration: none;
  cursor: pointer;
}

.invoice-no-link:hover {
  text-decoration: underline;
}
</style>
