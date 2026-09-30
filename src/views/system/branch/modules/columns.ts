import { h } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NPopconfirm, NTag } from 'naive-ui';
import { $t } from '@/locales';
import type { SysBranch } from '@/service/api/system/branch';

export function getBranchColumns(
  handleEdit: (pk: string) => void,
  handleDelete: (row: SysBranch) => void
): DataTableColumns<SysBranch> {
  return [
    {
      key: 'index',
      title: '#',
      width: 56,
      align: 'center',
      render: (_, index) => index + 1
    },
    { key: 'code', title: $t('page.system.branch.code'), width: 110 },
    { key: 'branch_name', title: $t('page.system.branch.branchName'), minWidth: 180, ellipsis: { tooltip: true } },
    { key: 'company_code', title: $t('page.system.branch.company'), width: 120 },
    { key: 'city', title: $t('page.system.branch.city'), minWidth: 120, ellipsis: { tooltip: true } },
    { key: 'country_code', title: $t('page.system.branch.countryCode'), width: 110 },
    { key: 'phone', title: $t('page.system.branch.phone'), minWidth: 140 },
    {
      key: 'is_active',
      title: $t('page.system.branch.isActive'),
      width: 90,
      align: 'center',
      render: row =>
        h(
          NTag,
          { size: 'small', type: row.is_active === 1 ? 'success' : 'error' },
          { default: () => (row.is_active === 1 ? $t('common.yesOrNo.yes') : $t('common.yesOrNo.no')) }
        )
    },
    {
      key: 'actions',
      title: $t('common.action'),
      width: 130,
      align: 'center',
      fixed: 'right',
      render(row) {
        return h('div', { class: 'flex-center gap-8px' }, [
          h(
            'a',
            { class: 'text-primary cursor-pointer', onClick: () => handleEdit(String(row.pk ?? '')) },
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
