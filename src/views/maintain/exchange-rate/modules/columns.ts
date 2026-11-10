import type { DataTableColumns } from 'naive-ui';
import { $t } from '@/locales';
import type { ExchangeRateRecord } from '@/service/api/maintain/exchange-rate';

function formatRate(value: string) {
  if (!value) return '-';
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  }).format(n);
}

export function getExchangeRateColumns(_locale?: string): DataTableColumns<ExchangeRateRecord> {
  return [
    {
      key: 'index',
      title: '#',
      width: 60,
      align: 'center',
      render: (_row, index) => index + 1
    },
    {
      key: 'exrate_period',
      title: $t('page.maintain.exchangeRate.period'),
      width: 140,
      ellipsis: { tooltip: true }
    },
    {
      key: 'exrate_start',
      title: $t('page.maintain.exchangeRate.startDate'),
      width: 140
    },
    {
      key: 'exrate_end',
      title: $t('page.maintain.exchangeRate.expiryDate'),
      width: 140
    },
    {
      key: 'exrate_from',
      title: $t('page.maintain.exchangeRate.fromCurrency'),
      minWidth: 160,
      ellipsis: { tooltip: true }
    },
    {
      key: 'exrate_to',
      title: $t('page.maintain.exchangeRate.toCurrency'),
      minWidth: 160,
      ellipsis: { tooltip: true }
    },
    {
      key: 'exrate_sell_rate',
      title: $t('page.maintain.exchangeRate.rate'),
      width: 140,
      align: 'right',
      render: row => formatRate(row.exrate_sell_rate)
    }
  ];
}
