import { h } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NButton, NDropdown, NTag } from 'naive-ui';
import { useRouter } from 'vue-router';
import { $t } from '@/locales';
import type { SettlementTransactionRecord } from '@/service/api/business/settlement';

export type SettlementTransactionActionKey = 'edit' | 'print' | 'export';

export function formatTransactionMoney(amount: number | null | undefined, currency?: string) {
  const n = Number(amount);

  if (Number.isNaN(n)) {
    return '—';
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'CNY',
      minimumFractionDigits: 2
    }).format(n);
  } catch {
    return `${n.toFixed(2)} ${currency || ''}`.trim();
  }
}

export function formatTransactionExchangeRate(rate: number | null | undefined) {
  const n = Number(rate);

  if (Number.isNaN(n)) {
    return '—';
  }

  return n.toFixed(6);
}

export function getSettlementTransactionColumns(
  onAction: (key: SettlementTransactionActionKey, row: SettlementTransactionRecord) => void
): DataTableColumns<SettlementTransactionRecord> {
  const router = useRouter();
  const rowMenuOptions = [
    { label: $t('common.edit'), key: 'edit' },
    { label: $t('page.settlement.transactions.print'), key: 'print' },
    { type: 'divider', key: 'divider' },
    { label: $t('page.settlement.transactions.exportRow'), key: 'export' }
  ];

  return [
    {
      type: 'selection',
      fixed: 'left'
    },
    {
      key: 'job_invoice_number',
      title: $t('page.settlement.transactions.jobInvoiceNumber'),
      width: 140,
      ellipsis: { tooltip: true },
      render: row =>
        h(
          'a',
          {
            class: 'cursor-pointer text-primary',
            onClick: () =>
              router.push({
                name: 'settlement_writeoff-edit',
                query: { pk: row.pk }
              })
          },
          row.job_invoice_number || '-'
        )
    },
    {
      key: 'invoice_date',
      title: $t('page.settlement.transactions.invoiceDate'),
      minWidth: 110,
      ellipsis: { tooltip: true }
    },
    {
      key: 'ledger',
      title: $t('page.settlement.transactions.ledger'),
      align: 'center',
      minWidth: 72,
      ellipsis: { tooltip: true }
    },
    {
      key: 'tran_type',
      title: $t('page.settlement.transactions.type'),
      align: 'center',
      minWidth: 72,
      ellipsis: { tooltip: true }
    },

    {
      key: 'transaction_num',
      title: $t('page.settlement.transactions.transactionNum'),
      minWidth: 120,
      ellipsis: { tooltip: true }
    },
    {
      key: 'creditor_debtor',
      title: $t('page.settlement.transactions.creditorDebtor'),
      minWidth: 220,
      width: 220,
      ellipsis: { tooltip: true }
    },
    {
      key: 'creditor_debtor_full_name',
      title: $t('page.settlement.transactions.creditorDebtorFullName'),
      minWidth: 320,
      width: 320,
      ellipsis: { tooltip: true }
    },
    {
      key: 'invoice_description',
      title: $t('page.settlement.transactions.invoiceDescription'),
      minWidth: 160,
      ellipsis: { tooltip: true }
    },
    {
      key: 'post_date',
      title: $t('page.settlement.transactions.postDate'),
      minWidth: 110,
      ellipsis: { tooltip: true }
    },
    {
      key: 'due_date',
      title: $t('page.settlement.transactions.dueDate'),
      minWidth: 110,
      ellipsis: { tooltip: true }
    },
    {
      key: 'currency',
      title: $t('page.settlement.transactions.currency'),
      align: 'center',
      minWidth: 80,
      ellipsis: { tooltip: true }
    },
    {
      key: 'trans_amount',
      title: $t('page.settlement.transactions.transAmount'),
      align: 'right',
      minWidth: 120,
      ellipsis: { tooltip: true },
      render: row => h('span', { class: 'font-600' }, formatTransactionMoney(row.trans_amount, row.currency))
    },
    {
      key: 'exchange_rate',
      title: $t('page.settlement.transactions.exchangeRate'),
      align: 'right',
      minWidth: 110,
      ellipsis: { tooltip: true },
      render: row => formatTransactionExchangeRate(row.exchange_rate)
    },
    {
      key: 'local_amount',
      title: $t('page.settlement.transactions.localAmount'),
      align: 'right',
      minWidth: 120,
      ellipsis: { tooltip: true },
      render: row => h('span', { class: 'font-600' }, formatTransactionMoney(row.local_amount, row.currency))
    },
    {
      key: 'branch',
      title: $t('page.settlement.transactions.branch'),
      align: 'center',
      minWidth: 72,
      ellipsis: { tooltip: true }
    },
    {
      key: 'department',
      title: $t('page.settlement.transactions.department'),
      align: 'center',
      minWidth: 88,
      ellipsis: { tooltip: true }
    },
    {
      key: 'tax_amount',
      title: $t('page.settlement.transactions.taxAmount'),
      align: 'right',
      minWidth: 100,
      ellipsis: { tooltip: true },
      render: row => formatTransactionMoney(row.tax_amount, row.currency)
    },
    {
      key: 'outstanding_amount',
      title: $t('page.settlement.transactions.outstandingAmount'),
      align: 'right',
      minWidth: 130,
      ellipsis: { tooltip: true },
      render: row => h('span', { class: 'font-600' }, formatTransactionMoney(row.outstanding_amount, row.currency))
    },
    {
      key: 'fully_paid_date',
      title: $t('page.settlement.transactions.fullyPaidDate'),
      minWidth: 110,
      ellipsis: { tooltip: true }
    },
    {
      key: 'job_number',
      title: $t('page.settlement.transactions.jobNumber'),
      minWidth: 120,
      ellipsis: { tooltip: true }
    },
    {
      key: 'canceled',
      title: $t('page.settlement.transactions.canceled'),
      align: 'center',
      minWidth: 88,
      ellipsis: { tooltip: true },
      render: row =>
        h(
          NTag,
          {
            type: row?.canceled === 'Y' ? 'error' : 'success',
            size: 'small'
          },
          () => row?.canceled || 'N'
        )
    },
    {
      key: 'actions',
      title: '',
      width: 56,
      align: 'center',
      fixed: 'right',
      render(row) {
        if (!row) return null;
        return h(
          NDropdown,
          {
            options: rowMenuOptions,
            trigger: 'click',
            onSelect: (key: string) => {
              onAction?.(key as SettlementTransactionActionKey, row);
            }
          },
          {
            default: () =>
              h(
                NButton,
                {
                  quaternary: true,
                  circle: true,
                  size: 'small'
                },
                {
                  default: () => '⋯'
                }
              )
          }
        );
      }
    }
  ];
}
