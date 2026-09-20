<script setup lang="ts">
import { computed, h, ref, watch } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NButton, NDataTable, NInput, NModal, NPagination, NSelect, NSpace, NSpin, NTag } from 'naive-ui';
import { getBillingTaxCodeLabel } from '@/constants/billingTaxCodeItems';
import { formatBillingAmount } from '@/utils/billing/billingDecimal';
import {
  consolBillingChargesByInvoice,
  consolBillingDraftPage,
  type AccTransactionHeader,
  type BillingChargeLineItem
} from '@/service/api/business/consol-billing';
import { $t } from '@/locales';
import { formatInvoiceDate, getInvoiceHeaderStatus, getInvoiceHeaderStatusLabel } from '@/views/business/shipment/modules/shipment-billing-map';

const props = defineProps<{ inputData: Record<string, any> }>();

const invoiceList = ref<AccTransactionHeader[]>([]);
const invoiceLoading = ref(false);
const invoicePage = ref(1);
const invoicePageSize = ref(100);
const invoiceTotal = ref(0);
const invoiceSearchNo = ref('');
const invoiceChargeType = ref<'AP'>('AP');

const chargeDetailVisible = ref(false);
const chargeDetailLoading = ref(false);
const chargeDetailInvoiceNo = ref('');
interface ChargeDetailRow extends BillingChargeLineItem {
  tax_amount?: number | string;
}

const chargeDetailRows = ref<ChargeDetailRow[]>([]);

const chargeTypeOptions = [{ label: 'AP', value: 'AP' }];

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

function renderText(value: unknown) {
  return h('span', null, value == null || value === '' ? '' : String(value));
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
    const lines = data?.lines ?? [];
    const lineByPk = new Map(lines.map(line => [String(line.al_pk ?? ''), line]));
    chargeDetailRows.value = (data?.charges ?? []).map((charge, index) => {
      const line = (charge.line_pk && lineByPk.get(String(charge.line_pk))) || lines[index];
      return {
        ...charge,
        tax_amount: line?.al_gstvat
      };
    });
  } catch {
    window.$message?.error($t('page.business.consolidation.billing.loadChargesFailed'));
    chargeDetailRows.value = [];
  } finally {
    chargeDetailLoading.value = false;
  }
}

/** AP headers aligned with first-cargo SHIP_CONS_AP_INVOICE_LIST_COLUMNS */
const invoiceColumns = computed<DataTableColumns<AccTransactionHeader>>(() => [
  {
    title: $t('page.business.consolidation.billing.status'),
    key: 'status',
    width: 96,
    render: (row: AccTransactionHeader) => {
      const status = getInvoiceHeaderStatus(row);
      return h(NTag, { type: getInvoiceStatusType(status), size: 'small' }, { default: () => getInvoiceHeaderStatusLabel(row) });
    }
  },
  {
    title: $t('page.business.consolidation.billing.supplierInvNo'),
    key: 'ah_transactionnum',
    width: 200,
    ellipsis: { tooltip: true },
    render: (row: AccTransactionHeader) => {
      const no = String(row.ah_transactionnum ?? '').trim();
      if (!no) return '';
      return h(
        NButton,
        {
          text: true,
          type: 'primary',
          size: 'small',
          style: { padding: 0, height: 'auto' },
          onClick: (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            void openChargeDetail(no);
          }
        },
        { default: () => no }
      );
    }
  },
  {
    title: $t('page.business.consolidation.billing.taxInvNo'),
    key: 'tax_inv_no',
    width: 120,
    render: () => ''
  },
  {
    title: $t('page.business.consolidation.billing.creditor'),
    key: 'oh_fullname',
    width: 120,
    ellipsis: { tooltip: true }
  },
  {
    title: $t('page.business.consolidation.billing.invoiceDate'),
    key: 'ah_invoicedate',
    width: 110,
    render: (row: AccTransactionHeader) => formatInvoiceDate(row.ah_invoicedate)
  },
  {
    title: $t('page.business.consolidation.billing.postDate'),
    key: 'ah_postdate',
    width: 110,
    render: (row: AccTransactionHeader) => formatInvoiceDate(row.ah_postdate)
  },
  {
    title: $t('page.business.consolidation.billing.dueDate'),
    key: 'ah_duedate',
    width: 110,
    render: (row: AccTransactionHeader) => formatInvoiceDate(row.ah_duedate)
  },
  {
    title: $t('page.business.consolidation.billing.fullyPaidDate'),
    key: 'ah_fullypaiddate',
    width: 130,
    render: (row: AccTransactionHeader) => formatInvoiceDate(row.ah_fullypaiddate)
  },
  { title: $t('page.business.consolidation.billing.currency'), key: 'ah_rx_nktransactioncurrency', width: 90 },
  {
    title: $t('page.business.consolidation.billing.invoiceAmtTaxIncl'),
    key: 'amount_tax_incl',
    width: 200,
    minWidth: 200,
    align: 'right',
    render: (row: AccTransactionHeader) => renderText(formatBillingAmount(row.amount_tax_incl))
  },
  {
    title: $t('page.business.consolidation.billing.invoiceAmtTaxExcl'),
    key: 'amount_tax_excl',
    width: 200,
    minWidth: 200,
    align: 'right',
    render: (row: AccTransactionHeader) => renderText(formatBillingAmount(row.amount_tax_excl))
  },
  {
    title: $t('page.business.consolidation.billing.taxAmount'),
    key: 'ah_gstamount',
    width: 110,
    align: 'right',
    render: (row: AccTransactionHeader) => renderText(formatBillingAmount(row.ah_gstamount))
  },
  {
    title: $t('page.business.consolidation.billing.transNo'),
    key: 'ah_consolidatedinvoiceref',
    width: 140,
    ellipsis: { tooltip: true }
  },
  {
    title: $t('page.business.consolidation.billing.modifyBy'),
    key: 'ah_systemlastedituser',
    width: 100,
    ellipsis: { tooltip: true }
  },
  {
    title: $t('page.business.consolidation.billing.lastModifyTime'),
    key: 'ah_systemlastedittimeutc',
    width: 150,
    render: (row: AccTransactionHeader) => formatInvoiceDate(row.ah_systemlastedittimeutc)
  },
  {
    title: $t('page.business.consolidation.billing.department'),
    key: 'dept_code',
    width: 110,
    ellipsis: { tooltip: true }
  }
]);

/** Detail modal: Charges[] + Lines[].al_gstvat for Tax Amount */
const chargeDetailColumns = computed<DataTableColumns<ChargeDetailRow>>(() => [
  { title: $t('page.business.consolidation.billing.chargeCode'), key: 'charge_code', width: 110, ellipsis: { tooltip: true } },
  { title: $t('page.business.consolidation.billing.description'), key: 'jr_desc', width: 200, ellipsis: { tooltip: true } },
  { title: $t('page.business.consolidation.billing.branch'), key: 'branch_code', width: 80 },
  { title: $t('page.business.consolidation.billing.creditor'), key: 'party_code', width: 120, ellipsis: { tooltip: true } },
  { title: $t('page.business.consolidation.billing.currency'), key: 'currency', width: 90 },
  {
    title: $t('page.business.consolidation.billing.unitPrice'),
    key: 'unit_price',
    width: 100,
    render: row => renderText(formatBillingAmount(row.unit_price))
  },
  { title: $t('page.business.consolidation.billing.unit'), key: 'unit', width: 90 },
  { title: $t('page.business.consolidation.billing.qty'), key: 'qty', width: 70 },
  {
    title: $t('page.business.consolidation.billing.amount'),
    key: 'amount',
    width: 100,
    render: row => renderText(formatBillingAmount(row.amount))
  },
  {
    title: $t('page.business.consolidation.billing.taxCode'),
    key: 'tax',
    width: 120,
    render: row => getBillingTaxCodeLabel(row.gst_rate || row.wht_rate || row.vat_class)
  },
  {
    title: $t('page.business.consolidation.billing.taxAmount'),
    key: 'tax_amount',
    width: 110,
    render: row => renderText(formatBillingAmount(row.tax_amount))
  },
  {
    title: $t('page.business.consolidation.billing.exchangeRate'),
    key: 'exchange_rate',
    width: 120
  },
  {
    title: $t('page.business.consolidation.billing.homeAmount'),
    key: 'os_amount',
    width: 120,
    render: row => renderText(formatBillingAmount(row.os_amount))
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
  $t('page.business.consolidation.billing.invoiceDetail', { no: chargeDetailInvoiceNo.value })
);

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
    window.$message?.error($t('page.business.consolidation.billing.loadFailed'));
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
        disabled
      />
      <NInput
        v-model:value="invoiceSearchNo"
        :placeholder="$t('page.business.consolidation.billing.searchInvoiceNo')"
        clearable
        style="width: 200px"
        @keyup.enter="handleSearch"
        @clear="handleSearchClear"
      />
      <NButton type="primary" size="small" @click="handleSearch">{{ $t('common.search') }}</NButton>
      <NButton size="small" :loading="invoiceLoading" @click="loadInvoices">{{ $t('common.refresh') }}</NButton>
    </NSpace>
    <NDataTable
      :columns="invoiceColumns"
      :data="displayList"
      :bordered="true"
      size="small"
      :loading="invoiceLoading"
      :row-key="(row: AccTransactionHeader) => row.ah_pk"
      :scroll-x="2100"
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
      style="width: min(1100px, 94vw)"
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
          :scroll-x="1700"
          :max-height="420"
          striped
        />
      </NSpin>
    </NModal>
  </div>
</template>
