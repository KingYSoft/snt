import { h } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NTag, NPopconfirm } from 'naive-ui';
import { $t } from '@/locales';

export function getPortCodeColumns(
  handleEdit: (row: any) => void,
  handleDelete: (row: any) => void
): DataTableColumns<any> {
  return [
    { key: 'index', title: '#', width: 60, align: 'center', render: (_, index) => index + 1 },
    {
      key: 'rl_code',
      title: $t('page.maintain.portCode.rlCode'),
      width: 120,
      align: 'center'
    },
    {
      key: 'rl_port_name',
      title: $t('page.maintain.portCode.rlPortName'),
      minWidth: 180
    },
    {
      key: 'rl_iata',
      title: $t('page.maintain.portCode.rlIata'),
      width: 100,
      align: 'center'
    },
    {
      key: 'rl_country_code',
      title: $t('page.maintain.portCode.rlCountryCode'),
      width: 120,
      align: 'center'
    },
    {
      key: 'rl_has_airport',
      title: $t('page.maintain.portCode.rlHasAirport'),
      width: 100,
      align: 'center',
      render(row) {
        const airport = row.rl_has_airport == 1;
        return h(NTag, { type: airport ? 'success' : 'error', size: 'small' }, () =>
          airport ? $t('common.yesOrNo.yes') : $t('common.yesOrNo.no')
        );
      }
    },
    {
      key: 'rl_has_seaport',
      title: $t('page.maintain.portCode.rlHasSeaport'),
      width: 100,
      align: 'center',
      render(row) {
        const seaport = row.rl_has_seaport == 1;
        return h(NTag, { type: seaport ? 'success' : 'error', size: 'small' }, () =>
          seaport ? $t('common.yesOrNo.yes') : $t('common.yesOrNo.no')
        );
      }
    },
    {
      key: 'rl_has_rail',
      title: $t('page.maintain.portCode.rlHasRail'),
      width: 90,
      align: 'center',
      render(row) {
        const rail = row.rl_has_rail == 1;
        return h(NTag, { type: rail ? 'success' : 'error', size: 'small' }, () =>
          rail ? $t('common.yesOrNo.yes') : $t('common.yesOrNo.no')
        );
      }
    },
    {
      key: 'rl_has_terminal',
      title: $t('page.maintain.portCode.rlHasTerminal'),
      width: 100,
      align: 'center',
      render(row) {
        const terminal = row.rl_has_terminal == 1;
        return h(NTag, { type: terminal ? 'success' : 'error', size: 'small' }, () =>
          terminal ? $t('common.yesOrNo.yes') : $t('common.yesOrNo.no')
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
          h('a', { class: 'text-primary cursor-pointer', onClick: () => handleEdit(row.id) }, $t('common.edit')),
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
