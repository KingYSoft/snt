import { h } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NTag } from 'naive-ui';
import { $t } from '@/locales';
import type { SysGroup } from '@/service/api/system/group';

export function getGroupColumns(handleEdit: (pk: string) => void): DataTableColumns<SysGroup> {
  return [
    {
      key: 'index',
      title: '#',
      width: 56,
      align: 'center',
      render: (_, index) => index + 1
    },
    { key: 'code', title: $t('page.system.group.code'), minWidth: 140 },
    {
      key: 'desc',
      title: $t('page.system.group.description'),
      minWidth: 220,
      render: row => row.desc || row.description || ''
    },
    {
      key: 'is_admin',
      title: $t('page.system.group.admin'),
      width: 110,
      align: 'center',
      render: row =>
        h(
          NTag,
          { size: 'small', type: row.is_admin === 'Y' ? 'success' : 'default' },
          { default: () => (row.is_admin === 'Y' ? $t('common.yesOrNo.yes') : $t('common.yesOrNo.no')) }
        )
    },
    {
      key: 'is_active',
      title: $t('page.system.group.status'),
      width: 110,
      align: 'center',
      render: row =>
        h(
          NTag,
          { size: 'small', type: row.is_active === 1 ? 'success' : 'error' },
          {
            default: () => (row.is_active === 1 ? $t('page.system.group.active') : $t('page.system.group.inactive'))
          }
        )
    },
    {
      key: 'actions',
      title: $t('common.action'),
      width: 100,
      align: 'center',
      fixed: 'right',
      render(row) {
        return h(
          'a',
          { class: 'text-primary cursor-pointer', onClick: () => handleEdit(String(row.pk ?? '')) },
          $t('common.edit')
        );
      }
    }
  ];
}
