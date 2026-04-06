import { h } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NTag, NPopconfirm } from 'naive-ui';
import { $t } from '@/locales';

export function getCommoditiesColumns(
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
      title: $t('page.maintain.commodities.code'),
      width: 150,
      align: 'center'
    },
    {
      key: 'description',
      title: $t('page.maintain.commodities.description'),
      minWidth: 200
    },
    {
      key: 'is_forwarding',
      title: $t('page.maintain.commodities.isForwarding'),
      width: 100,
      align: 'center',
      render(row) {
        const forwarding = row.is_forwarding === 'Y';
        return h(NTag, { type: forwarding ? 'success' : 'error', size: 'small' }, () =>
          forwarding ? $t('common.yesOrNo.yes') : $t('common.yesOrNo.no')
        );
      }
    },
    {
      key: 'is_shipping',
      title: $t('page.maintain.commodities.isShipping'),
      width: 100,
      align: 'center',
      render(row) {
        const shipping = row.is_shipping === 'Y';
        return h(NTag, { type: shipping ? 'success' : 'error', size: 'small' }, () =>
          shipping ? $t('common.yesOrNo.yes') : $t('common.yesOrNo.no')
        );
      }
    },
    {
      key: 'is_active',
      title: $t('page.maintain.commodities.isActive'),
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
      key: 'is_hazardous',
      title: $t('page.maintain.commodities.isHazardous'),
      width: 100,
      align: 'center',
      render(row) {
        const hazardous = row.is_hazardous === 'Y';
        return h(NTag, { type: hazardous ? 'success' : 'error', size: 'small' }, () =>
          hazardous ? $t('common.yesOrNo.yes') : $t('common.yesOrNo.no')
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
