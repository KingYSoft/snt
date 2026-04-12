import { h } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NPopconfirm } from 'naive-ui';
import { $t } from '@/locales';

function getOfficeAddress(row: any) {
  if (row?.ofc_address) {
    return row.ofc_address;
  }

  if (Array.isArray(row?.addresses) && row.addresses.length > 0) {
    return row.addresses.find((item: any) => item?.address_type === 'OFC') || row.addresses[0];
  }

  return null;
}

function getDisplayName(row: any) {
  return row?.org_full_name || row?.company_name || getOfficeAddress(row)?.company_name || '';
}

function getDisplayAddress(row: any) {
  if (row?.address) {
    return row.address;
  }

  const officeAddress = getOfficeAddress(row);
  const parts = [row?.address1, row?.address2, row?.address3].filter(Boolean);

  if (parts.length > 0) {
    return parts.join(' ');
  }

  return [officeAddress?.address1, officeAddress?.address2, officeAddress?.address3].filter(Boolean).join(' ');
}

function getFieldValue(row: any, field: string) {
  if (row?.[field]) {
    return row[field];
  }

  return getOfficeAddress(row)?.[field] || '';
}

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
      minWidth: 200,
      render(row) {
        return getDisplayName(row);
      }
    },
    {
      key: 'address',
      title: $t('page.maintain.organization.address'),
      minWidth: 250,
      render(row) {
        return getDisplayAddress(row);
      }
    },
    {
      key: 'port_code',
      title: 'UNLOCO',
      minWidth: 140,
      render(row) {
        return getFieldValue(row, 'port_code');
      }
    },
    {
      key: 'city',
      title: $t('page.maintain.organization.city'),
      minWidth: 140,
      render(row) {
        return getFieldValue(row, 'city');
      }
    },
    {
      key: 'state',
      title: $t('page.maintain.organization.state'),
      minWidth: 140,
      render(row) {
        return getFieldValue(row, 'state');
      }
    },
    {
      key: 'country_code',
      title: $t('page.maintain.organization.country'),
      minWidth: 140,
      render(row) {
        return getFieldValue(row, 'country_code');
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
