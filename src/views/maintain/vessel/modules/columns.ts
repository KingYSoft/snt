import { h } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NTag, NPopconfirm } from 'naive-ui';
import { $t } from '@/locales';

export function getVesselColumns(
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
      key: 'vessel_name',
      title: $t('page.maintain.vessel.vesselName'),
      minWidth: 200
    },
    {
      key: 'shipping_provider',
      title: $t('page.maintain.vessel.shippingProvider'),
      width: 150
    },
    {
      key: 'lloyds_imo',
      title: $t('page.maintain.vessel.lloydsImo'),
      width: 150
    },
    {
      key: 'vessel_type',
      title: $t('page.maintain.vessel.vesselType'),
      width: 120
    },
    {
      key: 'call_sign',
      title: $t('page.maintain.vessel.callSign'),
      width: 120
    },
    {
      key: 'is_active',
      title: $t('page.maintain.vessel.isActive'),
      width: 100,
      align: 'center',
      render: row => {
        if (row.is_active === null) {
          return null;
        }

        const tagMap: Record<number, { type: NaiveUI.ThemeColor; label: string }> = {
          1: { type: 'success', label: $t('common.yesOrNo.yes') },
          0: { type: 'error', label: $t('common.yesOrNo.no') }
        };

        const { type, label } = tagMap[row.is_active];

        return h(NTag, { type }, { default: () => label });
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
