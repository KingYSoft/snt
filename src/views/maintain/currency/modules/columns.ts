import { h } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NPopconfirm } from 'naive-ui';
import { $t } from '@/locales';

export function getCurrencyColumns(
  handleEdit: (row: any) => void,
  handleDelete: (row: any) => void
): DataTableColumns<any> {
  return [
    {
      key: 'index',
      title: '#',
      width: 60,
      align: 'center',
      render: (_, index) => index + 1
    },
    {
      key: 'code',
      title: $t('page.maintain.currency.code'),
      width: 120,
      align: 'center'
    },
    {
      key: 'symbol',
      title: $t('page.maintain.currency.symbol'),
      width: 100,
      align: 'center'
    },
    {
      key: 'desc',
      title: $t('page.maintain.currency.desc'),
      minWidth: 200
    },
    {
      key: 'actions',
      title: $t('common.action'),
      width: 130,
      align: 'center',
      fixed: 'right',
      render(row) {
        return h('div', { class: 'flex gap-8px justify-center' }, [
          h('a', { class: 'text-primary cursor-pointer', onClick: () => handleEdit(row.id) }, $t('common.edit')),
          h(
            NPopconfirm,
            { onPositiveClick: () => handleDelete(row) },
            {
              trigger: () => h('a', { class: 'text-error cursor-pointer' }, $t('common.delete')),
              default: () => $t('common.confirmDelete')
            }
          )
        ]);
      }
    }
  ];
}
