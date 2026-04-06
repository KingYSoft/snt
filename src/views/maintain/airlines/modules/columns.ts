import { h } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NTag, NPopconfirm } from 'naive-ui';
import { $t } from '@/locales';

export function getAirlineColumns(
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
      key: 'numeric_code',
      title: $t('page.maintain.airlines.airlineNumericCode'),
      width: 140,
      align: 'center'
    },
    {
      key: 'three_char',
      title: $t('page.maintain.airlines.threeLetterCode'),
      width: 130,
      align: 'center'
    },
    {
      key: 'two_character_code',
      title: $t('page.maintain.airlines.twoCharCode'),
      width: 110,
      align: 'center'
    },
    {
      key: 'airline_name1',
      title: $t('page.maintain.airlines.airlineName1'),
      minWidth: 180
    },
    {
      key: 'airline_city',
      title: $t('page.maintain.airlines.airlineCity'),
      width: 120,
      align: 'center'
    },
    {
      key: 'airline_country',
      title: $t('page.maintain.airlines.airlineCountryRegion'),
      width: 140,
      align: 'center'
    },
    {
      key: 'cass_controlled',
      title: $t('page.maintain.airlines.cassControlled'),
      width: 110,
      align: 'center',
      render(row) {
        const cass = row.cass_controlled === 'Y';
        return h(NTag, { type: cass ? 'success' : 'error', size: 'small' }, () =>
          cass ? $t('common.yesOrNo.yes') : $t('common.yesOrNo.no')
        );
      }
    },
    {
      key: 'is_active',
      title: $t('page.maintain.airlines.isActive'),
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
