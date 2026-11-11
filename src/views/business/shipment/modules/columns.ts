import { h } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NDropdown } from 'naive-ui';
import { $t } from '@/locales';
import type { ShipmentListItem } from '@/service/api/business/shipment';

export type ShipmentActionKey = 'edit' | 'merge' | 'split' | 'copy' | 'deactivate' | 'reopen' | 'export' | 'batchprint';

function formatDateOnly(value: unknown) {
  if (!value) return '-';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return '-';
  return date.toISOString().split('T')[0];
}

export function getShipmentColumns(
  _handleEdit: (row: ShipmentListItem) => void,
  _handleDelete: (row: ShipmentListItem) => void,
  handleAction?: (key: ShipmentActionKey, row: ShipmentListItem) => void,
  handleNavigateToEdit?: (row: ShipmentListItem) => void
): DataTableColumns<ShipmentListItem> {
  const rowMenuOptions = [
    { label: $t('common.edit'), key: 'edit' }
    // { label: $t("page.business.shipment.menu.merge"), key: "merge" },
    // { label: $t("page.business.shipment.menu.split"), key: "split" },
    // { label: $t("page.business.shipment.menu.copy"), key: "copy" },
    // { type: "divider", key: "d1" },
    // { label: $t("page.business.shipment.menu.deactivate"), key: "deactivate" },
    // { label: $t("page.business.shipment.menu.reopen"), key: "reopen" },
    // { type: "divider", key: "d2" },
    // { label: $t("page.business.shipment.menu.exportRow"), key: "export" },
    // { label: $t("page.business.shipment.menu.batchPrint"), key: "batchprint" },
  ];

  // 列顺序对齐 first-cargo-front shipment.vue tblHeaders；已有列 key 不变
  return [
    { type: 'selection' as const },
    {
      title: $t('page.business.shipment.table.transportMode'),
      key: 'js_transportmode',
      align: 'left',
      minWidth: 100,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.shipment.table.containerMode'),
      key: 'js_packingmode',
      align: 'left',
      minWidth: 120,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.shipment.table.status'),
      key: 'js_shipmentstatus',
      align: 'left',
      minWidth: 80
    },
    {
      title: $t('page.business.shipment.table.shipmentNo'),
      key: 'js_uniqueconsignref',
      align: 'left',
      width: 150,
      ellipsis: { tooltip: true },
      render: (row: ShipmentListItem) => {
        return h(
          'a',
          {
            class: 'cursor-pointer text-primary',
            onClick: (e: Event) => {
              e.stopPropagation();
              handleNavigateToEdit?.(row);
            }
          },
          row.js_uniqueconsignref
        );
      }
    },
    {
      title: $t('page.business.shipment.table.consolNo'),
      key: 'js_consolreference',
      align: 'left',
      minWidth: 120,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.shipment.table.housebill'),
      key: 'js_housebill',
      align: 'left',
      width: 140,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.shipment.table.masterBill'),
      key: 'con_master_bill_num',
      align: 'left',
      minWidth: 120,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.shipment.table.shipperName'),
      key: 'shipper_name',
      align: 'left',
      minWidth: 140,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.shipment.table.consignee'),
      key: 'consignee_name',
      align: 'left',
      minWidth: 140,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.shipment.table.origin'),
      key: 'js_rl_nkorigin',
      align: 'left',
      minWidth: 100
    },
    {
      title: $t('page.business.shipment.table.destination'),
      key: 'js_rl_nkdestination',
      align: 'left',
      width: 100
    },
    {
      title: $t('page.business.shipment.table.crd'),
      key: 'shp_cargo_ready',
      align: 'left',
      minWidth: 120,
      render: (row: ShipmentListItem) => formatDateOnly(row.shp_cargo_ready)
    },
    {
      title: $t('page.business.shipment.table.etd'),
      key: 'js_e_dep',
      align: 'left',
      minWidth: 100,
      render: (row: ShipmentListItem) => formatDateOnly(row.js_e_dep)
    },
    {
      title: $t('page.business.shipment.table.eta'),
      key: 'js_e_arv',
      align: 'left',
      minWidth: 100,
      render: (row: ShipmentListItem) => formatDateOnly(row.js_e_arv)
    },
    {
      title: $t('page.business.shipment.table.onBoardDate'),
      key: 'js_shippedonboarddate',
      align: 'left',
      minWidth: 120,
      render: (row: ShipmentListItem) => formatDateOnly(row.js_shippedonboarddate)
    },
    {
      title: $t('page.business.shipment.table.grossWeight'),
      key: 'js_actualweight',
      align: 'left',
      minWidth: 140,
      render: (row: ShipmentListItem) => {
        return row.js_actualweight ? `${row.js_actualweight} ${row.js_unitofweight || 'KG'}` : '-';
      }
    },
    {
      title: $t('page.business.shipment.table.cbm'),
      key: 'js_actualvolume',
      align: 'left',
      minWidth: 100,
      render: (row: ShipmentListItem) => {
        return row.js_actualvolume ? `${row.js_actualvolume} ${row.js_unitofvolume || 'M3'}` : '-';
      }
    },
    {
      title: $t('page.business.shipment.table.chargeableWeight'),
      key: 'js_actualchargeable',
      align: 'left',
      minWidth: 140
    },
    {
      title: $t('page.business.shipment.table.ctns'),
      key: 'js_outerpacks',
      align: 'left',
      minWidth: 100
    },
    {
      title: $t('page.business.shipment.table.unit'),
      key: 'js_f3_nkpacktype',
      align: 'left',
      minWidth: 80,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.shipment.table.freightTerm'),
      key: 'shp_freight_terms',
      align: 'left',
      minWidth: 120,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.shipment.table.inco'),
      key: 'js_inco',
      align: 'left',
      minWidth: 80,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.shipment.table.deliveryMode'),
      key: 'shp_delivery_mode',
      align: 'left',
      minWidth: 120,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.shipment.table.releaseType'),
      key: 'js_releasetype',
      align: 'left',
      minWidth: 120,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.shipment.table.ctrType'),
      key: 'pac_container_type',
      align: 'left',
      minWidth: 90,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.shipment.table.ctrCount'),
      key: 'pac_container_count',
      align: 'left',
      minWidth: 90
    },
    {
      title: $t('page.business.shipment.table.ctrNo'),
      key: 'pac_container_num',
      align: 'left',
      minWidth: 120,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.shipment.table.carrier'),
      key: 'carrier_name',
      align: 'left',
      minWidth: 140,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.shipment.table.vessel'),
      key: 'con_vessel',
      align: 'left',
      minWidth: 100,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.shipment.table.voyage'),
      key: 'con_voyage',
      align: 'left',
      minWidth: 90,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.shipment.table.createUser'),
      key: 'js_systemcreateuser',
      align: 'left',
      minWidth: 100,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.shipment.table.modifyUser'),
      key: 'js_systemlastedituser',
      align: 'left',
      minWidth: 100,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.shipment.table.salesRep'),
      key: 'shp_job_rep_sales_name',
      align: 'left',
      minWidth: 100,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.shipment.table.company'),
      key: 'company_name',
      align: 'left',
      minWidth: 120,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.shipment.table.ops'),
      key: 'operation_name',
      align: 'left',
      minWidth: 100,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.shipment.table.customerService'),
      key: 'customer_service_name',
      align: 'left',
      minWidth: 100,
      ellipsis: { tooltip: true }
    },
    {
      title: $t('page.business.shipment.table.goodsDescription'),
      key: 'js_goodsdescription',
      align: 'left',
      width: 140,
      ellipsis: { tooltip: true }
    },
    {
      key: 'actions',
      title: $t('common.action'),
      width: 70,
      align: 'center',
      fixed: 'right' as const,
      render(row: ShipmentListItem) {
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
  ];
}
