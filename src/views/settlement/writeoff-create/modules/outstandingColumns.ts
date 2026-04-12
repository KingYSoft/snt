import type { DataTableColumns } from 'naive-ui';
import type { OutstandingItem } from '@/service/api/business/settlement';
import { useI18n } from 'vue-i18n';

export function useOutstandingColumns() {
  const { t } = useI18n();

  const columns: DataTableColumns<OutstandingItem> = [
    { type: 'selection', multiple: true },
    {
      key: 'jobNo',
      title: t('page.settlement.writeoff.create.jobNo'),
      width: 140,
      ellipsis: { tooltip: true }
    },
    {
      key: 'taxInvoiceNo',
      title: t('page.settlement.writeoff.create.taxInvoiceNo'),
      width: 140,
      ellipsis: { tooltip: true }
    },
    {
      key: 'billNo',
      title: t('page.settlement.writeoff.create.billNo'),
      width: 120,
      ellipsis: { tooltip: true }
    },
    {
      key: 'billingDate',
      title: t('page.settlement.writeoff.create.billingDate'),
      width: 120
    },
    {
      key: 'fee',
      title: t('page.settlement.writeoff.create.fee'),
      width: 150,
      ellipsis: { tooltip: true }
    },
    {
      key: 'originalCurrency',
      title: t('page.settlement.writeoff.create.originalCurrency'),
      width: 80
    },
    {
      key: 'originalOutstandingAmount',
      title: t('page.settlement.writeoff.create.originalOutstandingAmount'),
      width: 120,
      align: 'right',
      render: row => row.originalOutstandingAmount.toFixed(2)
    },
    {
      key: 'settledAmountOriginalCurrency',
      title: t('page.settlement.writeoff.create.settledAmountOriginalCurrency'),
      width: 140,
      align: 'right',
      render: row => row.settledAmountOriginalCurrency.toFixed(2)
    },
    {
      key: 'symbol',
      title: t('page.settlement.writeoff.create.symbol'),
      width: 80
    },
    {
      key: 'exRate',
      title: t('page.settlement.writeoff.create.exRate'),
      width: 100,
      align: 'right',
      render: row => row.exRate || '-'
    },
    {
      key: 'settledAmountConverted',
      title: t('page.settlement.writeoff.create.settledAmountConverted'),
      width: 140,
      align: 'right',
      render: row => row.settledAmountConverted.toFixed(2)
    },
    {
      key: 'convertedCurrency',
      title: t('page.settlement.writeoff.create.convertedCY'),
      width: 80
    }
  ];

  return { columns };
}
