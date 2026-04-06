import { h } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NTag, NPopconfirm } from 'naive-ui';
import { $t } from '@/locales';

export function getBankColumns(
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
      title: $t('page.maintain.bank.code'),
      width: 120,
      align: 'center'
    },
    {
      key: 'description',
      title: $t('page.maintain.bank.description'),
      minWidth: 150
    },
    {
      key: 'bank_name',
      title: $t('page.maintain.bank.bankName'),
      minWidth: 180
    },
    {
      key: 'account_num',
      title: $t('page.maintain.bank.accountNumber'),
      width: 150,
      align: 'center'
    },
    {
      key: 'currency',
      title: $t('page.maintain.bank.currency'),
      width: 90,
      align: 'center'
    },
    {
      key: 'account_type',
      title: $t('page.maintain.bank.accountType'),
      width: 110,
      align: 'center'
    },
    {
      key: 'bank_abbreviation',
      title: $t('page.maintain.bank.abbreviation'),
      width: 110,
      align: 'center'
    },
    {
      key: 'account_eft',
      title: $t('page.maintain.bank.accountEft'),
      width: 120,
      align: 'center'
    },
    {
      key: 'gl_account',
      title: $t('page.maintain.bank.glAccount'),
      width: 120,
      align: 'center'
    },
    {
      key: 'bank_address',
      title: $t('page.maintain.bank.bankAddress'),
      minWidth: 150
    },
    {
      key: 'branch',
      title: $t('page.maintain.bank.branch'),
      width: 100,
      align: 'center'
    },
    {
      key: 'company',
      title: $t('page.maintain.bank.company'),
      width: 120,
      align: 'center'
    },
    {
      key: 'is_active',
      title: $t('page.maintain.bank.isActive'),
      width: 90,
      align: 'center',
      render(row) {
        const active = row.is_active === '1';
        return h(NTag, { type: active ? 'success' : 'error', size: 'small' }, () =>
          active ? $t('common.yesOrNo.yes') : $t('common.yesOrNo.no')
        );
      }
    },
    {
      key: 'swift',
      title: $t('page.maintain.bank.swiftCode'),
      width: 120,
      align: 'center'
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
