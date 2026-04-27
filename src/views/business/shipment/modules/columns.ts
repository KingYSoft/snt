import { h } from "vue";
import type { DataTableColumns } from "naive-ui";
import { NDropdown } from "naive-ui";
import { $t } from "@/locales";
import type { ShipmentListItem } from "@/service/api/business/shipment";

export type ShipmentActionKey =
  | "edit"
  | "merge"
  | "split"
  | "copy"
  | "deactivate"
  | "reopen"
  | "export"
  | "batchprint";

export function getShipmentColumns(
  _handleEdit: (row: ShipmentListItem) => void,
  _handleDelete: (row: ShipmentListItem) => void,
  handleAction?: (key: ShipmentActionKey, row: ShipmentListItem) => void,
  handleNavigateToEdit?: (row: ShipmentListItem) => void,
): DataTableColumns<ShipmentListItem> {
  const rowMenuOptions = [
    { label: $t("common.edit"), key: "edit" },
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

  return [
    { type: "selection" as const },
    {
      title: $t("page.business.shipment.table.shipmentNo"),
      key: "js_uniqueconsignref",
      align: "left",
      width: 150,
      ellipsis: { tooltip: true },
      render: (row: ShipmentListItem) => {
        return h(
          "a",
          {
            class: "cursor-pointer text-primary",
            onClick: (e: Event) => {
              e.stopPropagation();
              handleNavigateToEdit?.(row);
            },
          },
          row.js_uniqueconsignref,
        );
      },
    },
    {
      title: $t("page.business.shipment.table.housebill"),
      key: "js_housebill",
      align: "left",
      width: 140,
      ellipsis: { tooltip: true },
    },
    {
      title: $t("page.business.shipment.table.destination"),
      key: "js_rl_nkdestination",
      align: "left",
      width: 100,
    },
    {
      title: $t("page.business.shipment.table.origin"),
      key: "js_rl_nkorigin",
      align: "left",
      minWidth: 100,
    },
    {
      title: $t("page.business.shipment.table.goodsDescription"),
      key: "js_goodsdescription",
      align: "left",
      width: 140,
      ellipsis: { tooltip: true },
    },
    {
      title: $t("page.business.shipment.table.status"),
      key: "js_shipmentstatus",
      align: "left",
      minWidth: 80,
    },
    {
      title: $t("page.business.shipment.table.etd"),
      key: "js_e_dep",
      align: "left",
      minWidth: 100,
      render: (row: ShipmentListItem) => {
        if (!row.js_e_dep) return "-";
        const date = new Date(row.js_e_dep);
        return date.toISOString().split("T")[0];
      },
    },
    {
      title: $t("page.business.shipment.table.eta"),
      key: "js_e_arv",
      align: "left",
      minWidth: 100,
      render: (row: ShipmentListItem) => {
        if (!row.js_e_arv) return "-";
        const date = new Date(row.js_e_arv);
        return date.toISOString().split("T")[0];
      },
    },
    {
      title: $t("page.business.shipment.table.grossWeight"),
      key: "js_actualweight",
      align: "left",
      minWidth: 140,
      render: (row: ShipmentListItem) => {
        return row.js_actualweight
          ? `${row.js_actualweight} ${row.js_unitofweight || "KG"}`
          : "-";
      },
    },
    {
      title: $t("page.business.shipment.table.cbm"),
      key: "js_actualvolume",
      align: "left",
      minWidth: 100,
      render: (row: ShipmentListItem) => {
        return row.js_actualvolume
          ? `${row.js_actualvolume} ${row.js_unitofvolume || "M3"}`
          : "-";
      },
    },
    {
      title: $t("page.business.shipment.table.ctns"),
      key: "js_outerpacks",
      align: "left",
      minWidth: 100,
    },
    {
      key: "actions",
      title: $t("common.action"),
      width: 70,
      align: "center",
      fixed: "right" as const,
      render(row: ShipmentListItem) {
        return h(
          NDropdown,
          {
            options: rowMenuOptions,
            trigger: "click",
            onSelect: (key: string) => {
              if (handleAction) {
                handleAction(key as ShipmentActionKey, row);
              }
            },
          },
          {
            default: () =>
              h(
                "span",
                { class: "cursor-pointer text-16px leading-none select-none" },
                "⋯",
              ),
          },
        );
      },
    },
  ];
}
