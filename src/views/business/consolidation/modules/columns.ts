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

function formatDateOnly(value: unknown) {
  if (!value) return '-';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return '-';
  return date.toISOString().split('T')[0];
}

export function getConsolidationColumns<T>(
  handleAction?: (key: ConsolidationActionKey, row: T) => void,
  handleView?: (row: T) => void
) {
  const rowMenuOptions = [{ label: $t('page.business.shipment.menu.exportRow'), key: 'export' }];

  // 列顺序对齐 first-cargo-front consolidation.vue tblHeaders；已有列 key 不变
  return [
    {
      type: 'selection' as const,
      fixed: 'left' as const
    },
    {
      title: $t('page.business.consolidation.table.transportMode'),
      key: 'jk_transportmode',
      minWidth: 120,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.consolidation.table.consolMode'),
      key: 'jk_consolmode',
      minWidth: 130,
      ellipsis: { tooltip: true }
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
      title: $t('page.business.consolidation.table.etd'),
      key: 'con_etd',
      minWidth: 100,
      render(row: T & Record<string, unknown>) {
        return formatDateOnly(row.con_etd);
      }
    },
    {
      title: $t('page.business.consolidation.table.eta'),
      key: 'con_eta',
      minWidth: 100,
      render(row: T & Record<string, unknown>) {
        return formatDateOnly(row.con_eta);
      }
    },
    {
      title: $t('page.business.consolidation.table.vessel'),
      key: 'con_vessel',
      minWidth: 100,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.consolidation.table.voyage'),
      key: 'con_voyage',
      minWidth: 80,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.consolidation.table.carrier'),
      key: 'con_carrier_name',
      minWidth: 120,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.consolidation.table.ctrType'),
      key: 'ctr_type',
      minWidth: 100,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.consolidation.table.ctrCount'),
      key: 'ctr_count',
      minWidth: 100
    },
    {
      title: $t('page.business.consolidation.table.shippedOnBoardDate'),
      key: 'jk_shippedonboarddate',
      minWidth: 140,
      render(row: T & Record<string, unknown>) {
        return formatDateOnly(row.jk_shippedonboarddate);
      }
    },
    {
      title: $t('page.business.consolidation.table.createUser'),
      key: 'jk_systemcreateuser',
      minWidth: 120,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.consolidation.table.modifyUser'),
      key: 'jk_systemlastedituser',
      minWidth: 120,
      ellipsis: { tooltip: true }
    },
    // snt 原有、front 列表无对应列，保留在末尾
    {
      title: $t('page.business.consolidation.table.phase'),
      key: 'jk_phase',
      minWidth: 120,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.consolidation.table.consolChargeable'),
      key: 'jk_consolchargeable',
      minWidth: 140,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.consolidation.table.company'),
      key: 'company_name',
      minWidth: 140,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.consolidation.table.sales'),
      key: 'sales_name',
      minWidth: 120,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.consolidation.table.ops'),
      key: 'operation_name',
      minWidth: 120,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.consolidation.table.customerService'),
      key: 'customer_service_name',
      minWidth: 120,
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
