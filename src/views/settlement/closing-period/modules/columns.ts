import { h } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NButton } from 'naive-ui';
import { $t } from '@/locales';
import type { ClosingPeriodRecord } from '@/service/api/settlement/closing-period';

/** 业务单元显示：代码 - 英文/中文名称 */
export function resolveBusinessUnit(record: ClosingPeriodRecord): string {
  const code = String(record.branch_code ?? '').trim();
  const name =
    String(record.branch_name_en ?? '').trim() ||
    String(record.branch_name ?? '').trim() ||
    String(record.branch_name_cn ?? '').trim();
  if (code && name) return `${code} - ${name}`;
  return code || name || String(record.branch_pk ?? '').trim() || '-';
}

export function getClosingPeriodColumns(
  handleEdit: (row: ClosingPeriodRecord) => void
): DataTableColumns<ClosingPeriodRecord> {
  return [
    {
      key: 'index',
      title: '#',
      width: 60,
      align: 'center',
      render: (_row, index) => index + 1
    },
    {
      key: 'branch_code',
      title: $t('page.settlement.closingPeriod.table.businessUnit'),
      minWidth: 300,
      ellipsis: { tooltip: true },
      render: row => resolveBusinessUnit(row)
    },
    {
      key: 'close_period',
      title: $t('page.settlement.closingPeriod.table.accountingMonth'),
      width: 170,
      ellipsis: { tooltip: true },
      render: row => row.close_period || '-'
    },
    {
      key: 'closing_date',
      title: $t('page.settlement.closingPeriod.table.closingDate'),
      width: 160,
      ellipsis: { tooltip: true },
      render: row => row.closing_date || '-'
    },
    {
      key: 'actions',
      title: $t('common.action'),
      width: 110,
      align: 'center',
      fixed: 'right',
      render: row =>
        h(
          NButton,
          { text: true, type: 'primary', onClick: () => handleEdit(row) },
          { default: () => $t('common.edit') }
        )
    }
  ];
}
