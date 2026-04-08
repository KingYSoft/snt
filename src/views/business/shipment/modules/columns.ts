import { h } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NDropdown } from 'naive-ui';
import { $t } from '@/locales';

export type ShipmentActionKey = 'edit' | 'merge' | 'split' | 'copy' | 'deactivate' | 'reopen' | 'export' | 'batchprint';

export function getShipmentColumns<T>(
  _handleEdit: (row: T) => void,
  _handleDelete: (row: T) => void,
  handleAction?: (key: ShipmentActionKey, row: T) => void
) {
  const rowMenuOptions = [
    { label: $t('common.edit'), key: 'edit' },
    { label: $t('page.business.shipment.menu.merge'), key: 'merge' },
    { label: $t('page.business.shipment.menu.split'), key: 'split' },
    { label: $t('page.business.shipment.menu.copy'), key: 'copy' },
    { type: 'divider', key: 'd1' },
    { label: $t('page.business.shipment.menu.deactivate'), key: 'deactivate' },
    { label: $t('page.business.shipment.menu.reopen'), key: 'reopen' },
    { type: 'divider', key: 'd2' },
    { label: $t('page.business.shipment.menu.exportRow'), key: 'export' },
    { label: $t('page.business.shipment.menu.batchPrint'), key: 'batchprint' }
  ];

  return [
    { type: 'selection' as const },
    {
      title: $t('page.business.shipment.table.shipmentNo'),
      key: 'shp_consign_no',
      align: 'start',
      minWidth: 150
    },
    {
      title: $t('page.business.shipment.table.shipperName'),
      key: 'shipper_name',
      align: 'start',
      minWidth: 140,
      maxWidth: 200,
      ellipsis: true
    },
    {
      title: $t('page.business.shipment.table.consignee'),
      key: 'consignee_name',
      align: 'start',
      minWidth: 140,
      maxWidth: 200,
      ellipsis: true
    },
    {
      title: $t('page.business.shipment.table.destination'),
      key: 'shp_destination',
      align: 'start',
      minWidth: 100
    },
    {
      title: $t('page.business.shipment.table.origin'),
      key: 'shp_origin',
      align: 'start',
      minWidth: 100
    },
    {
      title: $t('page.business.shipment.table.goodsDescription'),
      key: 'shp_goods_description',
      align: 'start',
      minWidth: 140,
      ellipsis: true
    },
    {
      title: $t('page.business.shipment.table.crd'),
      key: 'shp_cargo_ready',
      align: 'start',
      minWidth: 100
    },
    {
      title: $t('page.business.shipment.table.eta'),
      key: 'shp_eta',
      align: 'start',
      minWidth: 100
    },
    {
      title: $t('page.business.shipment.table.etd'),
      key: 'shp_etd',
      align: 'start',
      minWidth: 100
    },
    {
      title: $t('page.business.shipment.table.grossWeight'),
      key: 'shp_actual_weight',
      align: 'start',
      minWidth: 140
    },
    {
      title: $t('page.business.shipment.table.cbm'),
      key: 'shp_actual_volume',
      align: 'start',
      minWidth: 100
    },
    {
      title: $t('page.business.shipment.table.ctns'),
      key: 'shp_total_package_count',
      align: 'start',
      minWidth: 100
    },
    {
      key: 'actions',
      title: $t('common.action'),
      width: 70,
      align: 'center',
      fixed: 'right' as const,
      render(row: T) {
        return h(
          NDropdown,
          {
            options: rowMenuOptions,
            trigger: 'click',
            onSelect: (key: string) => {
              if (handleAction) {
                handleAction(key as ShipmentActionKey, row);
              }
            }
          },
          {
            default: () => h('span', { class: 'cursor-pointer text-16px leading-none select-none' }, '⋯')
          }
        );
      }
    }
  ] as DataTableColumns<T>;
}
