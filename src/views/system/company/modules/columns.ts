import { h } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NPopconfirm, NTag } from 'naive-ui';
import { $t } from '@/locales';
import type { SysCompany } from '@/service/api/system/company';

export function getCompanyColumns(
  handleEdit: (pk: string) => void,
  handleDelete: (row: SysCompany) => void
): DataTableColumns<SysCompany> {
  return [
    {
      key: 'index',
      title: '#',
      width: 56,
      align: 'center',
      render: (_, index) => index + 1
    },
    { key: 'code', title: $t('page.system.company.code'), width: 120 },
    { key: 'name', title: $t('page.system.company.name'), minWidth: 180, ellipsis: { tooltip: true } },
    { key: 'business_reg_no', title: $t('page.system.company.businessRegNo'), minWidth: 140 },
    { key: 'city', title: $t('page.system.company.city'), minWidth: 120 },
    { key: 'country_code', title: $t('page.system.company.countryCode'), width: 110 },
    { key: 'phone', title: $t('page.system.company.phone'), minWidth: 120 },
    { key: 'home_currency', title: $t('page.system.company.homeCurrency'), width: 110 },
    {
      key: 'is_active',
      title: $t('page.system.company.isActive'),
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
