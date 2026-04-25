<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import type { DataTableRowKey, PaginationProps, SelectOption } from 'naive-ui';
import { useI18n } from 'vue-i18n';
import type { SettlementTransactionQueryParams, SettlementTransactionRecord } from '@/service/api/business/settlement';
import { queryPayableTransactions, queryReceivableTransactions } from '@/service/api/business/settlement';
import { getSettlementTransactionColumns, type SettlementTransactionActionKey } from './transaction-columns';

type TransactionPageType = 'receivable' | 'payable';

interface Props {
  type: TransactionPageType;
}

interface TransactionFilterState {
  field1: {
    key: string;
    start: string;
    end: string;
  };
  field2: {
    key: string;
    value: string;
  };
  ledger: string;
  tranType: string;
  branch: string;
  department: string;
  canceled: string;
}

const props = defineProps<Props>();

const { t } = useI18n();

const loading = ref(false);
const showMoreFilters = ref(true);
const rows = ref<SettlementTransactionRecord[]>([]);
const checkedRowKeys = ref<DataTableRowKey[]>([]);

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

const today = new Date();
const defaultEnd = formatDate(today);
const defaultStartDate = new Date(today);
defaultStartDate.setDate(defaultStartDate.getDate() - 1000);
const defaultStart = formatDate(defaultStartDate);

function createDefaultFilters(): TransactionFilterState {
  return {
    field1: {
      key: 'ah_invoicedate',
      start: defaultStart,
      end: defaultEnd
    },
    field2: {
      key: 'creditor_debtor',
      value: ''
    },
    ledger: '',
    tranType: '',
    branch: '',
    department: '',
    canceled: ''
  };
}

const filters = reactive<TransactionFilterState>(createDefaultFilters());

const title = computed(() =>
  t(props.type === 'receivable' ? 'route.settlement_receivable-transactions' : 'route.settlement_payable-transactions')
);

const field1Options = computed<SelectOption[]>(() => [
  {
    label: t('page.settlement.transactions.invoiceDate'),
    value: 'ah_invoicedate'
  }
]);

const field2Options = computed<SelectOption[]>(() => [
  {
    label: t('page.settlement.transactions.creditorDebtor'),
    value: 'creditor_debtor'
  },
  {
    label: t('page.settlement.transactions.creditorDebtorFullName'),
    value: 'creditor_debtor_full_name'
  },
  {
    label: t('page.settlement.transactions.jobNumber'),
    value: 'job_number'
  },
  {
    label: t('page.settlement.transactions.transactionNum'),
    value: 'transaction_num'
  },
  {
    label: t('page.settlement.transactions.jobInvoiceNumber'),
    value: 'job_invoice_number'
  }
]);

const queryFn = props.type === 'receivable' ? queryReceivableTransactions : queryPayableTransactions;

const pagination = reactive({
  page: 1,
  pageSize: 200,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [20, 50, 100, 200, 500, 2000],
  showQuickJumper: true,
  'onUpdate:page': (page: number) => {
    pagination.page = page;
    void getData();
  },
  'onUpdate:pageSize': (pageSize: number) => {
    pagination.pageSize = pageSize;
    pagination.page = 1;
    void getData();
  }
}) as PaginationProps;

const columns = computed(() =>
  getSettlementTransactionColumns((key, row) => {
    handleRowAction(key, row);
  })
);

function buildParams(override?: Partial<SettlementTransactionQueryParams>): SettlementTransactionQueryParams {
  return {
    skipCount: ((pagination.page as number) - 1) * (pagination.pageSize as number),
    maxResultCount: pagination.pageSize as number,
    dateStart: filters.field1.start || undefined,
    dateEnd: filters.field1.end || undefined,
    keywordField: filters.field2.key,
    keywordValue: filters.field2.value,
    ledger: filters.ledger,
    tranType: filters.tranType,
    branch: filters.branch,
    department: filters.department,
    canceled: filters.canceled,
    ...override
  };
}

async function getData() {
  loading.value = true;

  try {
    const res = await queryFn(buildParams());

    if (res) {
      rows.value = res.data?.items;
      pagination.itemCount = res.data.totalCount;
    }
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.page = 1;
  void getData();
}

function handleReset() {
  Object.assign(filters, createDefaultFilters());
  checkedRowKeys.value = [];
  pagination.page = 1;
  void getData();
}

function toggleMoreFilters() {
  showMoreFilters.value = !showMoreFilters.value;
}

function csvCell(value: unknown) {
  if (value === null || value === undefined) {
    return '';
  }

  const s = String(value);

  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }

  return s;
}

function buildCsv(items: SettlementTransactionRecord[]) {
  const header = [
    t('page.settlement.transactions.invoiceDate'),
    t('page.settlement.transactions.ledger'),
    t('page.settlement.transactions.type'),
    t('page.settlement.transactions.jobInvoiceNumber'),
    t('page.settlement.transactions.transactionNum'),
    t('page.settlement.transactions.creditorDebtor'),
    t('page.settlement.transactions.creditorDebtorFullName'),
    t('page.settlement.transactions.invoiceDescription'),
    t('page.settlement.transactions.postDate'),
    t('page.settlement.transactions.dueDate'),
    t('page.settlement.transactions.currency'),
    t('page.settlement.transactions.transAmount'),
    t('page.settlement.transactions.exchangeRate'),
    t('page.settlement.transactions.localAmount'),
    t('page.settlement.transactions.branch'),
    t('page.settlement.transactions.department'),
    t('page.settlement.transactions.taxAmount'),
    t('page.settlement.transactions.outstandingAmount'),
    t('page.settlement.transactions.fullyPaidDate'),
    t('page.settlement.transactions.jobNumber'),
    t('page.settlement.transactions.canceled')
  ].join(',');

  const lines = items.map(item =>
    [
      csvCell(item.invoice_date),
      csvCell(item.ledger),
      csvCell(item.tran_type),
      csvCell(item.job_invoice_number),
      csvCell(item.transaction_num),
      csvCell(item.creditor_debtor),
      csvCell(item.creditor_debtor_full_name),
      csvCell(item.invoice_description),
      csvCell(item.post_date),
      csvCell(item.due_date),
      csvCell(item.currency),
      csvCell(item.trans_amount),
      csvCell(item.exchange_rate),
      csvCell(item.local_amount),
      csvCell(item.branch),
      csvCell(item.department),
      csvCell(item.tax_amount),
      csvCell(item.outstanding_amount),
      csvCell(item.fully_paid_date),
      csvCell(item.job_number),
      csvCell(item.canceled)
    ].join(',')
  );

  return `${header}\n${lines.join('\n')}`;
}

function downloadCsv(items: SettlementTransactionRecord[], fileName: string) {
  const csv = buildCsv(items);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.append(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

async function handleExportAll() {
  try {
    const res = await queryFn(buildParams({ skipCount: 0, maxResultCount: 100000 }));
    const items = res?.data?.items || [];
    const fileName = props.type === 'receivable' ? 'receivable_transactions.csv' : 'payable_transactions.csv';

    downloadCsv(items, fileName);
    window.$message?.success(t('page.settlement.transactions.exportSuccess'));
  } catch {
    window.$message?.error(t('page.settlement.transactions.exportFailed'));
  }
}

function handleCreate() {
  window.$message?.info(t('page.settlement.transactions.createDeveloping'));
}

function handleRowAction(key: SettlementTransactionActionKey, row: SettlementTransactionRecord) {
  if (key === 'export') {
    downloadCsv(
      [row],
      `${props.type === 'receivable' ? 'receivable' : 'payable'}_${row.transaction_num || row.id}.csv`
    );
    window.$message?.success(
      t('page.settlement.transactions.exportRowSuccess', {
        no: row.transaction_num
      })
    );
    return;
  }

  if (key === 'print') {
    window.$message?.info(
      t('page.settlement.transactions.printDeveloping', {
        no: row.transaction_num
      })
    );
    return;
  }

  window.$message?.info(
    t('page.settlement.transactions.editDeveloping', {
      no: row.transaction_num
    })
  );
}

function isInteractiveTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    Boolean(target.closest('button, a, input, textarea, [role="button"], .n-checkbox, .n-base-selection'))
  );
}

function getRowProps(row: SettlementTransactionRecord) {
  return {
    style: 'cursor: pointer;',
    onDblclick: (event: MouseEvent) => {
      if (isInteractiveTarget(event.target)) {
        return;
      }

      handleRowAction('edit', row);
    }
  };
}

onMounted(() => {
  void getData();
});
</script>

<template>
  <div class="h-full flex-col-stretch gap-16px overflow-hidden">
    <NCard :title="title" :bordered="false" class="flex-shrink-0">
      <NGrid :cols="24" :x-gap="12" :y-gap="12">
        <NGi :span="8">
          <div class="flex items-center gap-8px">
            <NSelect v-model:value="filters.field1.key" :options="field1Options" class="w-120px shrink-0" />
            <NDatePicker
              v-model:formatted-value="filters.field1.start"
              type="date"
              value-format="yyyy-MM-dd"
              clearable
              class="min-w-0 flex-1"
            />
            <span class="text-14px text-#999">-</span>
            <NDatePicker
              v-model:formatted-value="filters.field1.end"
              type="date"
              value-format="yyyy-MM-dd"
              clearable
              class="min-w-0 flex-1"
            />
          </div>
        </NGi>

        <NGi :span="10">
          <div class="flex items-center gap-8px">
            <NSelect v-model:value="filters.field2.key" :options="field2Options" class="w-180px shrink-0" />
            <NInput
              v-model:value="filters.field2.value"
              :placeholder="t('page.settlement.transactions.keywordPlaceholder')"
              clearable
              class="min-w-0 flex-1"
              @keyup.enter="handleSearch"
            />
          </div>
        </NGi>

        <NGi :span="6">
          <NSpace justify="end" class="w-full">
            <NButton type="primary" @click="handleSearch">
              {{ t('common.search') }}
            </NButton>
            <NButton @click="handleReset">
              {{ t('common.reset') }}
            </NButton>
            <NButton quaternary @click="toggleMoreFilters">
              {{
                t(
                  showMoreFilters
                    ? 'page.settlement.transactions.hideMoreFilters'
                    : 'page.settlement.transactions.moreFilters'
                )
              }}
            </NButton>
          </NSpace>
        </NGi>

        <NGi v-if="showMoreFilters" :span="4">
          <NInput v-model:value="filters.ledger" :placeholder="t('page.settlement.transactions.ledger')" clearable />
        </NGi>
        <NGi v-if="showMoreFilters" :span="4">
          <NInput v-model:value="filters.tranType" :placeholder="t('page.settlement.transactions.type')" clearable />
        </NGi>
        <NGi v-if="showMoreFilters" :span="4">
          <NInput v-model:value="filters.branch" :placeholder="t('page.settlement.transactions.branch')" clearable />
        </NGi>
        <NGi v-if="showMoreFilters" :span="4">
          <NInput
            v-model:value="filters.department"
            :placeholder="t('page.settlement.transactions.department')"
            clearable
          />
        </NGi>
        <NGi v-if="showMoreFilters" :span="4">
          <NInput
            v-model:value="filters.canceled"
            :placeholder="t('page.settlement.transactions.canceled')"
            clearable
          />
        </NGi>
      </NGrid>
    </NCard>

    <NCard :bordered="false" class="flex-1-hidden overflow-auto">
      <NSpace vertical :size="12">
        <NSpace justify="space-between">
          <NSpace>
            <NButton type="primary" @click="handleCreate">
              {{ t('common.add') }}
            </NButton>
            <NButton @click="handleExportAll">
              {{ t('page.settlement.transactions.export') }}
            </NButton>
          </NSpace>
        </NSpace>

        <NDataTable
          v-model:checked-row-keys="checkedRowKeys"
          :columns="columns"
          :data="rows"
          :loading="loading"
          :pagination="pagination"
          :row-key="row => row.pk"
          :row-props="getRowProps"
          :scroll-x="2520"
          remote
          striped
        />
      </NSpace>
    </NCard>
  </div>
</template>
