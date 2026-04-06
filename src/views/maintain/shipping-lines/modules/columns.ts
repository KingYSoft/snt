import { h } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NTag, NPopconfirm } from 'naive-ui';
import { $t } from '@/locales';

export function getShippingLinesColumns(
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
      key: 'scac_code',
      title: $t('page.maintain.shippingLines.code'),
      width: 150,
      align: 'center'
    },
    {
      key: 'carrier_name',
      title: $t('page.maintain.shippingLines.name'),
      minWidth: 180
    },
    {
      key: 'is_nvo',
      title: $t('page.maintain.shippingLines.isNvo'),
      width: 80,
      align: 'center',
      render(row) {
        const nvo = row.is_nvo === 'Y';
        return h(NTag, { type: nvo ? 'success' : 'error', size: 'small' }, () =>
          nvo ? $t('common.yesOrNo.yes') : $t('common.yesOrNo.no')
        );
      }
    },
    {
      key: 'ocean_carrier_messaging',
      title: $t('page.maintain.shippingLines.oceanCarrierMessaging'),
      width: 130,
      align: 'center',
      render(row) {
        const ocean = row.ocean_carrier_messaging === 'Y';
        return h(NTag, { type: ocean ? 'success' : 'error', size: 'small' }, () =>
          ocean ? $t('common.yesOrNo.yes') : $t('common.yesOrNo.no')
        );
      }
    },
    {
      key: 'global_sailing_schedule',
      title: $t('page.maintain.shippingLines.globalSailingSchedule'),
      width: 130,
      align: 'center',
      render(row) {
        const schedule = row.global_sailing_schedule === 'Y';
        return h(NTag, { type: schedule ? 'success' : 'error', size: 'small' }, () =>
          schedule ? $t('common.yesOrNo.yes') : $t('common.yesOrNo.no')
        );
      }
    },
    {
      key: 'container_automation',
      title: $t('page.maintain.shippingLines.containerAutomation'),
      width: 120,
      align: 'center',
      render(row) {
        const container = row.container_automation === 'Y';
        return h(NTag, { type: container ? 'success' : 'error', size: 'small' }, () =>
          container ? $t('common.yesOrNo.yes') : $t('common.yesOrNo.no')
        );
      }
    },
    {
      key: 'e_si',
      title: $t('page.maintain.shippingLines.eSi'),
      width: 70,
      align: 'center',
      render(row) {
        const esi = row.e_si === 'Y';
        return h(NTag, { type: esi ? 'success' : 'error', size: 'small' }, () =>
          esi ? $t('common.yesOrNo.yes') : $t('common.yesOrNo.no')
        );
      }
    },
    {
      key: 'e_vgm',
      title: $t('page.maintain.shippingLines.eVgm'),
      width: 70,
      align: 'center',
      render(row) {
        const evgm = row.e_vgm === 'Y';
        return h(NTag, { type: evgm ? 'success' : 'error', size: 'small' }, () =>
          evgm ? $t('common.yesOrNo.yes') : $t('common.yesOrNo.no')
        );
      }
    },
    {
      key: 'e_so',
      title: $t('page.maintain.shippingLines.eSo'),
      width: 70,
      align: 'center',
      render(row) {
        const eso = row.e_so === 'Y';
        return h(NTag, { type: eso ? 'success' : 'error', size: 'small' }, () =>
          eso ? $t('common.yesOrNo.yes') : $t('common.yesOrNo.no')
        );
      }
    },
    {
      key: 'e_manifest',
      title: $t('page.maintain.shippingLines.eManifest'),
      width: 90,
      align: 'center',
      render(row) {
        const emanifest = row.e_manifest === 'Y';
        return h(NTag, { type: emanifest ? 'success' : 'error', size: 'small' }, () =>
          emanifest ? $t('common.yesOrNo.yes') : $t('common.yesOrNo.no')
        );
      }
    },
    {
      key: 'is_active',
      title: $t('page.maintain.shippingLines.isActive'),
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
