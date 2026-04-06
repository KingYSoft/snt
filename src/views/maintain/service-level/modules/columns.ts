import { h } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NTag, NPopconfirm } from 'naive-ui';
import { $t } from '@/locales';

export function getServiceLevelColumns(
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
      title: $t('page.maintain.serviceLevel.code'),
      width: 150,
      align: 'center'
    },
    {
      key: 'desc',
      title: $t('page.maintain.serviceLevel.description'),
      minWidth: 200
    },
    {
      key: 'is_active',
      title: $t('page.maintain.serviceLevel.isActive'),
      width: 90,
      align: 'center',
      render(row) {
        const active = row.is_active == 1;
        return h(NTag, { type: active ? 'success' : 'error', size: 'small' }, () =>
          active ? $t('common.yesOrNo.yes') : $t('common.yesOrNo.no')
        );
      }
    },
    {
      key: 'actions',
      title: $t('common.action'),
      width: 130,
      align: 'center',
      fixed: 'right',
      render(row) {
        return h('div', { class: 'flex gap-8px justify-center' }, [
          h(
            'a',
            {
              class: 'text-primary cursor-pointer',
              onClick: () => handleEdit(row.id)
            },
            $t('common.edit')
          ),
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
