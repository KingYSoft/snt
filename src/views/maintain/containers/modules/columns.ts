import { h } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NTag, NPopconfirm } from 'naive-ui';
import { $t } from '@/locales';

export function getContainerTypeColumns(
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
      title: $t('page.maintain.containers.code'),
      width: 100,
      align: 'center'
    },
    {
      key: 'description',
      title: $t('page.maintain.containers.description'),
      minWidth: 150
    },
    {
      key: 'mode',
      title: $t('page.maintain.containers.mode'),
      width: 80,
      align: 'center'
    },
    {
      key: 'container_type',
      title: $t('page.maintain.containers.containerType'),
      width: 100,
      align: 'center'
    },
    {
      key: 'iata_class',
      title: $t('page.maintain.containers.iataClass'),
      width: 100,
      align: 'center'
    },
    {
      key: 'teu',
      title: $t('page.maintain.containers.teu'),
      width: 70,
      align: 'center'
    },
    {
      key: 'height',
      title: $t('page.maintain.containers.height'),
      width: 70,
      align: 'center'
    },
    {
      key: 'length',
      title: $t('page.maintain.containers.length'),
      width: 70,
      align: 'center'
    },
    {
      key: 'width',
      title: $t('page.maintain.containers.width'),
      width: 70,
      align: 'center'
    },
    {
      key: 'gross_weight',
      title: $t('page.maintain.containers.grossWeight'),
      width: 90,
      align: 'center'
    },
    {
      key: 'tare_weight',
      title: $t('page.maintain.containers.tareWeight'),
      width: 90,
      align: 'center'
    },
    {
      key: 'capacity_m3',
      title: $t('page.maintain.containers.capacityM3'),
      width: 90,
      align: 'center'
    },
    {
      key: 'iso',
      title: $t('page.maintain.containers.iso'),
      width: 70,
      align: 'center',
      render(row) {
        const iso = row.iso === 'Y';
        return h(NTag, { type: iso ? 'success' : 'error', size: 'small' }, () =>
          iso ? $t('common.yesOrNo.yes') : $t('common.yesOrNo.no')
        );
      }
    },
    {
      key: 'iso_type',
      title: $t('page.maintain.containers.isoType'),
      width: 100,
      align: 'center'
    },
    {
      key: 'iso_size',
      title: $t('page.maintain.containers.isoSize'),
      width: 100,
      align: 'center'
    },
    {
      key: 'iso_description',
      title: $t('page.maintain.containers.isoDescription'),
      minWidth: 150
    },
    {
      key: 'is_active',
      title: $t('page.maintain.containers.isActive'),
      width: 90,
      align: 'center',
      render(row) {
        const active = row.is_active.toString() === '1';
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
