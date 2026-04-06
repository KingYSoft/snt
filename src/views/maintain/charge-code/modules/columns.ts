import { h } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NTag, NPopconfirm } from 'naive-ui';
import { $t } from '@/locales';

export function getChargeCodeColumns(
  handleEdit: (row: any) => void,
  handleDelete: (row: any) => void
): DataTableColumns<any> {
  return [
    { key: 'index', title: '#', width: 60, align: 'center', render: (_, index) => index + 1 },
    {
      key: 'code',
      title: $t('page.maintain.chargeCode.code'),
      width: 120,
      align: 'center'
    },
    {
      key: 'description',
      title: $t('page.maintain.chargeCode.description'),
      minWidth: 180
    },
    {
      key: 'language_description',
      title: $t('page.maintain.chargeCode.localLanguageDescription'),
      minWidth: 180
    },
    {
      key: 'is_active',
      title: $t('page.maintain.chargeCode.isActive'),
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
      key: 'type',
      title: $t('page.maintain.chargeCode.type'),
      width: 100,
      align: 'center'
    },
    {
      key: 'margin',
      title: $t('page.maintain.chargeCode.margin'),
      width: 100,
      align: 'center'
    },
    {
      key: 'tax',
      title: $t('page.maintain.chargeCode.tax'),
      width: 80,
      align: 'center'
    },
    {
      key: 'withholding',
      title: $t('page.maintain.chargeCode.withholding'),
      width: 110,
      align: 'center'
    },
    {
      key: 'calculator',
      title: $t('page.maintain.chargeCode.calculator'),
      width: 100,
      align: 'center'
    },
    {
      key: 'print_sequence',
      title: $t('page.maintain.chargeCode.printSequence'),
      width: 110,
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
