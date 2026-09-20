<script setup lang="ts">
import { h, ref, watch, computed } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import {
  NDataTable,
  NButton,
  NSpace,
  NPagination,
  NInput,
  NSelect,
  NTag,
  NModal,
  NSpin,
  NTabs,
  NTabPane
} from 'naive-ui';
import {
  billingDraftPage,
  voidDraftInvoice,
  voidPostedInvoice,
  queryChargesByInvoice,
  generateInvoicePdf,
  type AccTransactionHeader,
  type BillingChargeLineItem
} from '@/service/api/business/billing';
import { getBillingTaxCodeLabel } from '@/constants/billingTaxCodeItems';
import { $t } from '@/locales';
import { resolveBackendFileUrl } from '@/utils/service';
import { formatInvoiceDate, getInvoiceHeaderStatus, getInvoiceHeaderStatusLabel } from './shipment-billing-map';

const props = defineProps<{ inputData: Record<string, any> }>();

interface InvoicePdfPreviewItem {
  invoice_no: string;
  url: string;
}

const invoiceList = ref<AccTransactionHeader[]>([]);
const invoiceLoading = ref(false);
const invoicePage = ref(1);
const invoicePageSize = ref(100);
const invoiceTotal = ref(0);
const invoiceSelected = ref<string[]>([]);
const invoiceSearchNo = ref('');
/** 默认 All：请求不传 chargeType */
const ledgerFilter = ref<'all' | 'AR' | 'AP'>('all');
const voiding = ref(false);
const printing = ref(false);

const chargeDetailVisible = ref(false);
const chargeDetailLoading = ref(false);
const chargeDetailInvoiceNo = ref('');
const chargeDetailRows = ref<BillingChargeLineItem[]>([]);

const pdfPreviewVisible = ref(false);
const pdfPreviewItems = ref<InvoicePdfPreviewItem[]>([]);
const pdfPreviewActive = ref('');

const ledgerFilterOptions = computed(() => [
  { label: $t('page.business.shipment.billing.all'), value: 'all' },
  { label: 'AR', value: 'AR' },
  { label: 'AP', value: 'AP' }
]);

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
    const { data } = await queryChargesByInvoice(no);
    chargeDetailRows.value = data?.charges ?? [];
  } catch {
    window.$message?.error($t('page.business.shipment.billing.loadChargesFailed'));
    chargeDetailRows.value = [];
  } finally {
    chargeDetailLoading.value = false;
  }
}

const invoiceColumns = computed<DataTableColumns<AccTransactionHeader>>(() => [
  { type: 'selection' },
  {
    title: $t('page.business.shipment.billing.jobInvoiceNo'),
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
    title: $t('page.business.shipment.billing.status'),
    key: 'status',
    width: 90,
    render: (row: AccTransactionHeader) => {
      const status = getInvoiceHeaderStatus(row);
      return h(NTag, { type: getInvoiceStatusType(status), size: 'small' }, { default: () => getInvoiceHeaderStatusLabel(row) });
    }
  },
  {
    title: $t('page.business.shipment.billing.account'),
    key: 'oh_fullname',
    width: 180,
    ellipsis: { tooltip: true },
    render: (row: AccTransactionHeader) => String(row.oh_fullname ?? '').trim()
  },
  { title: $t('page.business.shipment.billing.ledger'), key: 'ah_ledger', width: 100 },
  {
    title: $t('page.business.shipment.billing.postDate'),
    key: 'ah_postdate',
    width: 120,
    render: (row: AccTransactionHeader) => formatInvoiceDate(row.ah_postdate)
  },
  {
    title: $t('page.business.shipment.billing.invoiceDate'),
    key: 'ah_invoicedate',
    width: 120,
    render: (row: AccTransactionHeader) => formatInvoiceDate(row.ah_invoicedate)
  },
  {
    title: $t('page.business.shipment.billing.fullyPaidDate'),
    key: 'ah_fullypaiddate',
    width: 120,
    render: (row: AccTransactionHeader) => formatInvoiceDate(row.ah_fullypaiddate)
  },
  { title: $t('page.business.shipment.billing.currency'), key: 'ah_rx_nktransactioncurrency', width: 80 },
  { title: $t('page.business.shipment.billing.invoiceAmt'), key: 'ah_invoiceamount', width: 100 },
  { title: $t('page.business.shipment.billing.paymentStatus'), key: 'ah_matchstatus', width: 120 },
  { title: $t('page.business.shipment.billing.branch'), key: 'ah_systemcreatebranch', width: 80 },
  { title: $t('page.business.shipment.billing.terms'), key: 'ah_invoiceterm', width: 140, ellipsis: { tooltip: true } }
]);

const chargeDetailColumns = computed<DataTableColumns<BillingChargeLineItem>>(() => [
  { title: $t('page.business.shipment.billing.chargeCode'), key: 'charge_code', width: 110, ellipsis: { tooltip: true } },
  { title: $t('page.business.shipment.billing.description'), key: 'jr_desc', minWidth: 160, ellipsis: { tooltip: true } },
  { title: $t('page.business.shipment.billing.party'), key: 'party_code', width: 120, ellipsis: { tooltip: true } },
  { title: $t('page.business.shipment.billing.branch'), key: 'branch_code', width: 90 },
  { title: $t('page.business.shipment.billing.currency'), key: 'currency', width: 80 },
  { title: $t('page.business.shipment.billing.type'), key: 'jr_invoicetype', width: 80 },
  { title: $t('page.business.shipment.billing.amount'), key: 'amount', width: 100 },
  { title: $t('page.business.shipment.billing.homeAmt'), key: 'os_amount', width: 100 },
  { title: $t('page.business.shipment.billing.exchRate'), key: 'exchange_rate', width: 90 },
  {
    title: $t('page.business.shipment.billing.tax'),
    key: 'tax',
    width: 100,
    render: row => getBillingTaxCodeLabel(row.wht_rate || row.gst_rate)
  }
]);

const displayList = computed(() => {
  const q = invoiceSearchNo.value.trim().toLowerCase();
  if (!q) return invoiceList.value;
  return invoiceList.value.filter(row =>
    String(row.ah_transactionnum ?? '')
      .toLowerCase()
      .includes(q)
  );
});

const chargeDetailTitle = computed(() =>
  $t('page.business.shipment.billing.invoiceDetail', { no: chargeDetailInvoiceNo.value })
);

const activePdfUrl = computed(() => {
  const hit = pdfPreviewItems.value.find(item => item.invoice_no === pdfPreviewActive.value);
  return hit?.url || pdfPreviewItems.value[0]?.url || '';
});

function getSelectedItems() {
  const keySet = new Set(invoiceSelected.value.map(key => String(key).trim()).filter(Boolean));
  return invoiceList.value.filter(item => keySet.has(String(item.ah_pk ?? '').trim()));
}

async function loadInvoices() {
  if (!props.inputData.pk) return;
  try {
    invoiceLoading.value = true;
    const payload: Parameters<typeof billingDraftPage>[0] = {
      shpPk: props.inputData.pk,
      skipCount: (invoicePage.value - 1) * invoicePageSize.value,
      maxResultCount: invoicePageSize.value,
      sorting: 'Id DESC'
    };
    if (ledgerFilter.value !== 'all') payload.chargeType = ledgerFilter.value;
    const { data } = await billingDraftPage(payload);
    invoiceList.value = data?.items ?? [];
    invoiceTotal.value = data?.totalCount ?? 0;
  } catch {
    window.$message?.error($t('page.business.shipment.billing.loadFailed'));
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

function handleLedgerFilterChange(value: 'all' | 'AR' | 'AP' | null) {
  ledgerFilter.value = value || 'all';
  invoicePage.value = 1;
  invoiceSelected.value = [];
  loadInvoices();
}

async function handleVoid() {
  const selectedItems = getSelectedItems();
  if (!selectedItems.length) {
    window.$message?.warning($t('page.business.shipment.billing.selectRecords'));
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

    window.$message?.success($t('page.business.shipment.billing.operationCompleted'));
    invoiceSelected.value = [];
    await loadInvoices();
  } catch {
    window.$message?.error($t('page.business.shipment.billing.voidFailed'));
  } finally {
    voiding.value = false;
  }
}

async function handlePrint() {
  const selectedItems = getSelectedItems();
  if (!selectedItems.length) {
    window.$message?.warning($t('page.business.shipment.billing.selectRecords'));
    return;
  }

  const invoiceNos = [
    ...new Set(selectedItems.map(item => String(item.ah_transactionnum ?? '').trim()).filter(Boolean))
  ];
  if (!invoiceNos.length) {
    window.$message?.warning($t('page.business.shipment.billing.noInvoiceNo'));
    return;
  }

  try {
    printing.value = true;
    const { data } = await generateInvoicePdf({
      invoice_nos: invoiceNos,
      ...(ledgerFilter.value !== 'all' ? { ledger_type: ledgerFilter.value } : {})
    });
    const items = (data?.results ?? [])
      .map(item => {
        const invoice_no = String(item.invoice_no ?? '').trim();
        const url = resolveBackendFileUrl(String(item.pdf_path ?? ''));
        return invoice_no && url ? { invoice_no, url } : null;
      })
      .filter((item): item is InvoicePdfPreviewItem => Boolean(item));

    if (!items.length) {
      window.$message?.warning($t('page.business.shipment.billing.noPdfGenerated'));
      return;
    }

    pdfPreviewItems.value = items;
    pdfPreviewActive.value = items[0].invoice_no;
    pdfPreviewVisible.value = true;
  } catch {
    window.$message?.error($t('page.business.shipment.billing.printFailed'));
  } finally {
    printing.value = false;
  }
}

function closePdfPreview() {
  pdfPreviewVisible.value = false;
  pdfPreviewItems.value = [];
  pdfPreviewActive.value = '';
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
        :value="ledgerFilter"
        :options="ledgerFilterOptions"
        :fallback-option="false"
        style="width: 110px"
        size="small"
        @update:value="handleLedgerFilterChange"
      />
      <NInput
        v-model:value="invoiceSearchNo"
        :placeholder="$t('page.business.shipment.billing.searchInvoiceNo')"
        clearable
        style="width: 200px"
        @keyup.enter="handleSearch"
        @clear="handleSearchClear"
      />
      <NButton type="primary" size="small" @click="handleSearch">{{ $t('common.search') }}</NButton>
      <NButton size="small" :loading="invoiceLoading" @click="loadInvoices">{{ $t('common.refresh') }}</NButton>
      <NButton type="error" size="small" ghost :loading="voiding" @click="handleVoid">
        {{ $t('page.business.shipment.billing.void') }}
      </NButton>
      <NButton size="small" :loading="printing" @click="handlePrint">
        {{ $t('page.business.shipment.billing.print') }}
      </NButton>
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

    <NModal
      v-model:show="chargeDetailVisible"
      preset="card"
      :title="chargeDetailTitle"
      style="width: 960px"
      :bordered="false"
      size="huge"
    >
      <NSpin :show="chargeDetailLoading">
        <NDataTable
          :columns="chargeDetailColumns"
          :data="chargeDetailRows"
          :bordered="true"
          size="small"
          :row-key="(row: BillingChargeLineItem) => row.jr_pk || row.line_pk"
          :scroll-x="1100"
          :max-height="420"
          striped
        />
      </NSpin>
    </NModal>

    <NModal
      :show="pdfPreviewVisible"
      preset="card"
      :title="$t('page.business.shipment.billing.printPreview')"
      style="width: min(1200px, 94vw)"
      :bordered="false"
      :mask-closable="false"
      @update:show="v => !v && closePdfPreview()"
    >
      <template #header-extra>
        <NButton size="small" @click="closePdfPreview">{{ $t('common.close') }}</NButton>
      </template>

      <NTabs v-if="pdfPreviewItems.length > 1" v-model:value="pdfPreviewActive" type="line" class="mb-12px">
        <NTabPane
          v-for="item in pdfPreviewItems"
          :key="item.invoice_no"
          :name="item.invoice_no"
          :tab="item.invoice_no"
        />
      </NTabs>

      <iframe
        v-if="activePdfUrl"
        class="invoice-pdf-frame"
        :src="activePdfUrl"
        :title="$t('page.business.shipment.billing.invoice')"
      />
    </NModal>
  </div>
</template>

<style scoped>
.invoice-no-link {
  color: var(--primary-color);
  cursor: pointer;
  text-decoration: none;
}

.invoice-no-link:hover {
  text-decoration: underline;
}

.invoice-pdf-frame {
  width: 100%;
  height: min(72vh, 780px);
  border: none;
  background: #f5f5f5;
}
</style>
