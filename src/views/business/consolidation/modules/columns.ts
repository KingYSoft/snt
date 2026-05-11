import { h } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NButton, NDropdown, NTag } from 'naive-ui';
import { $t } from '@/locales';

export type ConsolidationActionKey = 'export';

function renderCancelledTag(value: unknown) {
  const normalized = String(value ?? '').toLowerCase();
  const cancelled = normalized === '1' || normalized === 'true' || normalized === 'y' || normalized === 'yes';

  return h(
    NTag,
    {
      size: 'small',
      type: cancelled ? 'error' : 'success',
      bordered: false
    },
    {
      default: () => (cancelled ? $t('common.yesOrNo.yes') : $t('common.yesOrNo.no'))
    }
  );
}

export function getConsolidationColumns<T>(
  handleAction?: (key: ConsolidationActionKey, row: T) => void,
  handleView?: (row: T) => void
) {
  const rowMenuOptions = [{ label: $t('page.business.shipment.menu.exportRow'), key: 'export' }];

  return [
    {
      type: 'selection' as const,
      fixed: 'left' as const
    },
    {
      title: $t('page.business.consolidation.table.consolidationNo'),
      key: 'jk_uniqueconsignref',
      minWidth: 160,
      ellipsis: { tooltip: true },
      render(row: T & Record<string, unknown>) {
        return h(
          NButton,
          {
            text: true,
            type: 'primary',
            onClick: (event: MouseEvent) => {
              event.stopPropagation();
              handleView?.(row);
            }
          },
          {
            default: () => String(row.jk_uniqueconsignref || '-')
          }
        );
      }
    },
    {
      title: $t('page.business.consolidation.table.masterBillNo'),
      key: 'jk_masterbillnum',
      minWidth: 160,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.consolidation.table.bookingReference'),
      key: 'jk_bookingreference',
      minWidth: 160,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.consolidation.table.consolStatus'),
      key: 'jk_consolstatus',
      minWidth: 140,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.consolidation.table.phase'),
      key: 'jk_phase',
      minWidth: 120,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.consolidation.table.transportMode'),
      key: 'jk_transportmode',
      minWidth: 120,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.consolidation.table.loadPort'),
      key: 'jk_rl_nkloadport',
      minWidth: 120,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.consolidation.table.dischargePort'),
      key: 'jk_rl_nkdischargeport',
      minWidth: 120,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.consolidation.table.shippedOnBoardDate'),
      key: 'jk_shippedonboarddate',
      minWidth: 160,
      ellipsis: { tooltip: true },
      render(row: T & Record<string, unknown>) {
        const date = row.jk_shippedonboarddate as string | null | undefined;
        if (!date) return '-';
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return '-';
        return dateObj.toISOString().split('T')[0];
      }
    },
    {
      title: $t('page.business.consolidation.table.consolChargeable'),
      key: 'jk_consolchargeable',
      minWidth: 140,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.consolidation.table.cancelled'),
      key: 'jk_iscancelled',
      width: 110,
      align: 'center' as const,
      render(row: T & Record<string, unknown>) {
        return renderCancelledTag(row.jk_iscancelled);
      }
    },
    {
      key: 'actions',
      title: $t('common.action'),
      width: 70,
      align: 'center' as const,
      fixed: 'right' as const,
      render(row: T) {
        return h(
          NDropdown,
          {
            options: rowMenuOptions,
            trigger: 'click',
            onSelect: (key: string) => {
              handleAction?.(key as ConsolidationActionKey, row);
            }
          },
          {
            default: () =>
              h(
                'span',
                {
                  class: 'cursor-pointer text-16px leading-none select-none',
                  onClick: (event: MouseEvent) => event.stopPropagation()
                },
                '⋯'
              )
          }
        );
      }
    }
  ] as DataTableColumns<T>;
}
