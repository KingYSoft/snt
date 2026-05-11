import { h } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NButton, NDropdown } from 'naive-ui';
import { $t } from '@/locales';
import type { MatchTransactionRecord } from '@/service/api/business/match-transactions';

export type MatchTransactionActionKey = 'view' | 'print' | 'export';

/** Type-safe alias for i18n keys */
const t = (key: string) => $t(key as any);

function companyCell(row: MatchTransactionRecord) {
  return row.billingPartyName?.trim() || row.billingParty || '-';
}

function formatSettledAmount(amount: string | number | null | undefined) {
  const n = Number(amount);
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(n);
}

export function getMatchTransactionColumns(
  onMatchNumberClick: (row: MatchTransactionRecord) => void,
  onAction: (key: MatchTransactionActionKey, row: MatchTransactionRecord) => void
): DataTableColumns<MatchTransactionRecord> {
  const rowMenuOptions = [
    { label: t('page.settlement.matchTransactions.view'), key: 'view' },
    { label: t('page.settlement.matchTransactions.print'), key: 'print' },
    { type: 'divider' as const, key: 'divider' },
    { label: t('page.settlement.matchTransactions.exportRow'), key: 'export' }
  ];

  return [
    {
      type: 'selection' as const,
      fixed: 'left' as const
    },
    {
      key: 'index',
      title: '#',
      width: 60,
      align: 'center',
      render: (_row, index) => index + 1
    },
    {
      key: 'ledger',
      title: 'Ledger',
      width: 80,
      align: 'center',
      ellipsis: { tooltip: true }
    },
    {
      key: 'matchNumber',
      title: 'Transaction No.',
      width: 160,
      ellipsis: { tooltip: true },
      render: row =>
        h(
          'a',
          {
            class: 'cursor-pointer text-primary',
            onClick: (e: Event) => {
              e.stopPropagation();
              onMatchNumberClick(row);
            }
          },
          row.matchNumber || '-'
        )
    },
    {
      key: 'billingParty',
      title: 'Company',
      width: 240,
      ellipsis: { tooltip: true },
      render: row => companyCell(row)
    },
    {
      key: 'currency',
      title: 'Currency',
      width: 80,
      align: 'center',
      ellipsis: { tooltip: true }
    },
    {
      key: 'settledAmount',
      title: 'Amount',
      width: 130,
      align: 'right',
      render: row => h('span', {}, formatSettledAmount(row.settledAmount))
    },
    {
      key: 'paymentDate',
      title: 'Payment Date',
      width: 120,
      ellipsis: { tooltip: true },
      render: row => (row.paymentDate ? String(row.paymentDate).split('T')[0] : '-')
    },
    {
      key: 'description',
      title: 'Description',
      minWidth: 160,
      ellipsis: { tooltip: true }
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
              onAction?.(key as MatchTransactionActionKey, row);
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
