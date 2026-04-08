import { h } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NTag, NPopconfirm } from 'naive-ui';
import { $t } from '@/locales';

export function getOrganizationColumns(
  handleEdit: (row: any) => void,
  handleDelete: (row: any) => void,
  handleView: (row: any) => void
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
      key: 'org_code',
      title: $t('page.maintain.organization.code'),
      width: 150,
      align: 'center'
    },
    {
      key: 'company_name',
      title: $t('page.maintain.organization.name'),
      minWidth: 200
    },
    {
      key: 'address',
      title: $t('page.maintain.organization.address'),
      minWidth: 250
    },
    {
      key: 'port_code',
      title: 'UNLOCO',
      minWidth: 140
    },
    {
      key: 'city',
      title: $t('page.maintain.organization.city'),
      minWidth: 140
    },
    {
      key: 'state',
      title: $t('page.maintain.organization.state'),
      minWidth: 140
    },
    {
      key: 'country_code',
      title: $t('page.maintain.organization.country'),
      minWidth: 140
    },
    {
      key: 'Branch',
      title: 'Branch',
      minWidth: 140
    },
    {
      key: 'is_active',
      title: $t('page.maintain.organization.isActive'),
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
      width: 160,
      align: 'center',
      fixed: 'right',
      render(row) {
        return h('div', { class: 'flex gap-8px justify-center' }, [
          h(
            'a',
            {
              class: 'text-primary cursor-pointer',
              onClick: () => handleView(row)
            },
            $t('common.view')
          ),
          h(
            'a',
            {
              class: 'text-primary cursor-pointer',
              onClick: () => handleEdit(row)
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
