import { h } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NPopconfirm, NTag } from 'naive-ui';
import { $t } from '@/locales';
import type { SysUser } from '@/service/api/system/user';

export function getUserColumns(
  handleEdit: (pk: string) => void,
  handleDelete: (row: SysUser) => void
): DataTableColumns<SysUser> {
  return [
    {
      key: 'index',
      title: '#',
      width: 56,
      align: 'center',
      render: (_, index) => index + 1
    },
    { key: 'login_name', title: $t('page.system.user.loginName'), minWidth: 140 },
    { key: 'full_name', title: $t('page.system.user.fullName'), minWidth: 140 },
    { key: 'email_address', title: $t('page.system.user.email'), minWidth: 180 },
    { key: 'mobile_phone', title: $t('page.system.user.mobilePhone'), minWidth: 140 },
    {
      key: 'can_login',
      title: $t('page.system.user.canLogin'),
      width: 110,
      align: 'center',
      render: row =>
        h(
          NTag,
          { size: 'small', type: row.can_login === 1 ? 'success' : 'error' },
          { default: () => (row.can_login === 1 ? $t('page.system.user.enabled') : $t('page.system.user.disabled')) }
        )
    },
    {
      key: 'is_active',
      title: $t('page.system.user.isActive'),
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
