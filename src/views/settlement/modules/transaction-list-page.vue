<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { DataTableRowKey, SelectOption } from 'naive-ui';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useNaivePaginatedTable } from '@/hooks/common/table';
import { sjcTransform } from '@/utils/maintain/transform';
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
const router = useRouter();

const showMoreFilters = ref(true);
const checkedRowKeys = ref<DataTableRowKey[]>([]);
/** 勾选行的完整数据：Naive 在远程分页下只对内存中的节点解析得到 row，翻页时用当前页 rows 补全 */
const selectedRowsByPk = ref(new Map<string, SettlementTransactionRecord>());

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

const today = new Date();
const defaultEnd = formatDate(today);
const defaultStart = formatDate(new Date('2026-01-01'));

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

// --- Pagination refs synced with useNaivePaginatedTable ---
const pageRef = ref(1);
const pageSizeRef = ref(20);

function buildParams(override?: Partial<SettlementTransactionQueryParams>): SettlementTransactionQueryParams {
  return {
    skipCount: (pageRef.value - 1) * pageSizeRef.value,
    maxResultCount: pageSizeRef.value,
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

// --- Table hook ---
const {
  data: rows,
  loading,
  columns,
  pagination,
  getDataByPage
} = useNaivePaginatedTable<any, SettlementTransactionRecord>({
  api: async () => {
    return queryFn(buildParams());
  },
  columns: () =>
    getSettlementTransactionColumns((key, row) => {
      handleRowAction(key, row);
    }) as any,
  transform: response =>
    sjcTransform(response, {
      page: pageRef.value,
      pageSize: pageSizeRef.value
    }),
  paginationProps: {
    pageSize: 20,
    pageSizes: [10, 20, 50, 100, 200]
  },
  onPaginationParamsChange: params => {
    pageRef.value = params.page ?? 1;
    pageSizeRef.value = params.pageSize ?? 20;
  }
});

/**
 * Naive UI：`@update:checked-row-keys` 第二个参数为与 keys 同序的完整行数据（见 naive-ui use-check doUpdateCheckedRowKeys）。
 * 远程分页时仅当前页及 tree 内节点能解析出 row，其余下标可能为空，需配合 watch(rows) 补缓存。
 */
function handleCheckedRowKeysUpdate(keys: DataTableRowKey[], rowsPayload?: object[]) {
  checkedRowKeys.value = keys;
  const keySet = new Set(keys.map(k => String(k)));
  const map = selectedRowsByPk.value;
  for (const pk of map.keys()) {
    if (!keySet.has(pk)) {
      map.delete(pk);
    }
  }
  if (rowsPayload?.length) {
    keys.forEach((key, i) => {
      const row = rowsPayload[i] as SettlementTransactionRecord | undefined;
      if (row != null && typeof row === 'object') {
        map.set(String(key), row);
      }
    });
  }
}

watch(rows, newRows => {
  const keySet = new Set(checkedRowKeys.value.map(k => String(k)));
  const map = selectedRowsByPk.value;
  for (const row of newRows) {
    const id = String(row.pk);
    if (keySet.has(id)) {
      map.set(id, row);
    }
  }
});

function handleSearch() {
  getDataByPage(1);
}

function handleReset() {
  Object.assign(filters, createDefaultFilters());
  checkedRowKeys.value = [];
  selectedRowsByPk.value = new Map();
  getDataByPage(1);
}

function toggleMoreFilters() {
  showMoreFilters.value = !showMoreFilters.value;
}

// --- CSV export ---
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

function handleExportSelected() {
  if (checkedRowKeys.value.length === 0) {
    window.$message?.warning(t('page.settlement.transactions.exportSelectFirst'));
    return;
  }
  const items = checkedRowKeys.value
    .map(k => selectedRowsByPk.value.get(String(k)))
    .filter((r): r is SettlementTransactionRecord => r != null);
  if (items.length === 0) {
    window.$message?.warning(t('page.settlement.transactions.exportSelectFirst'));
    return;
  }
  if (items.length < checkedRowKeys.value.length) {
    window.$message?.warning(
      t('page.settlement.transactions.exportPartialSkipped', {
        exported: items.length,
        selected: checkedRowKeys.value.length
      })
    );
  }
  const fileName = props.type === 'receivable' ? 'receivable_transactions.csv' : 'payable_transactions.csv';
  downloadCsv(items, fileName);
  window.$message?.success(t('page.settlement.transactions.exportSuccess'));
}

function handleCreate() {
  if (props.type === 'receivable') {
    router.push({ name: 'settlement_receivable-transactions-create' });
  } else {
    router.push({ name: 'settlement_payable-transactions-create' });
  }
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
            <NButton type="primary" :loading="loading" @click="handleSearch">
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
            <NButton @click="handleExportSelected">
              {{ t('page.settlement.transactions.export') }}
            </NButton>
          </NSpace>
        </NSpace>

        <NDataTable
          :checked-row-keys="checkedRowKeys"
          :columns="columns as any"
          :data="rows"
          :loading="loading"
          :pagination="pagination"
          :row-key="row => row.pk"
          :row-props="getRowProps"
          :scroll-x="2520"
          remote
          striped
          @update:checked-row-keys="handleCheckedRowKeysUpdate"
        />
      </NSpace>
    </NCard>
  </div>
</template>
