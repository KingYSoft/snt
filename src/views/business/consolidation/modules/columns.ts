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
      title: $t('page.business.consolidation.table.consolidationNo'),
      key: 'con_unique_consign_ref',
      minWidth: 160,
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
            default: () => String(row.con_unique_consign_ref || '-')
          }
        );
      }
    },
    {
      title: $t('page.business.consolidation.table.masterBillNo'),
      key: 'con_master_bill_num',
      minWidth: 160
    },
    {
      title: $t('page.business.consolidation.table.bookingReference'),
      key: 'con_booking_reference',
      minWidth: 160
    },
    {
      title: $t('page.business.consolidation.table.consolStatus'),
      key: 'con_consol_status',
      minWidth: 140
    },
    {
      title: $t('page.business.consolidation.table.phase'),
      key: 'con_phase',
      minWidth: 120
    },
    {
      title: $t('page.business.consolidation.table.transportMode'),
      key: 'con_transport_mode',
      minWidth: 120
    },
    {
      title: $t('page.business.consolidation.table.loadPort'),
      key: 'con_load_port',
      minWidth: 120
    },
    {
      title: $t('page.business.consolidation.table.dischargePort'),
      key: 'con_discharge_port',
      minWidth: 120
    },
    {
      title: $t('page.business.consolidation.table.shippedOnBoardDate'),
      key: 'con_shipped_on_board_date',
      minWidth: 160
    },
    {
      title: $t('page.business.consolidation.table.consolChargeable'),
      key: 'con_consol_chargeable',
      minWidth: 140
    },
    {
      title: $t('page.business.consolidation.table.cancelled'),
      key: 'con_is_cancelled',
      width: 110,
      align: 'center' as const,
      render(row: T & Record<string, unknown>) {
        return renderCancelledTag(row.con_is_cancelled);
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
