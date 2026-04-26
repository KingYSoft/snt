import { h } from "vue";
import type { DataTableColumns } from "naive-ui";
import { NTag } from "naive-ui";
import { useI18n } from "vue-i18n";
import type { WriteoffRecord } from "@/service/api/business/settlement";

export function getWriteoffColumns(
  handleViewDetail?: (row: WriteoffRecord) => void
): DataTableColumns<WriteoffRecord> {
  const { t } = useI18n();

  return [
    {
      key: "index",
      title: "#",
      width: 60,
      align: "center" as const,
      render: (_, index) => index + 1,
    },
    {
      key: "ah_transactionnum",
      title: () => t("page.settlement.writeoff.transactionNum"),
      width: 100,
      render: (row) => {
        return h(
          "a",
          {
            class: "cursor-pointer text-primary",
            onClick: (e: Event) => {
              e.stopPropagation();
              handleViewDetail?.(row);
            },
          },
          row.ah_transactionnum || "-"
        );
      },
    },
    {
      key: "companyName",
      title: () => t("page.settlement.writeoff.companyName"),
      width: 200,
      ellipsis: { tooltip: true },
    },
    {
      key: "ah_transactiontype",
      title: () => t("page.settlement.writeoff.transactionType"),
      width: 60,
      align: "center" as const,
    },
    {
      key: "ap_amount",
      title: () => t("page.settlement.writeoff.amount"),
      width: 130,
      align: "right" as const,
      render: (row) => {
        const amount = row.ap_amount ?? 0;
        return `${amount.toFixed(2)}`;
      },
    },
    {
      key: "ah_rx_nktransactioncurrency",
      title: () => t("page.settlement.writeoff.currency"),
      width: 90,
      align: "center" as const,
    },
    {
      key: "ap_matchdate",
      title: () => t("page.settlement.writeoff.writeoffDate"),
      width: 120,
      align: "center" as const,
      render: (row) => {
        if (!row.ap_matchdate) return "-";
        return row.ap_matchdate.split("T")[0];
      },
    },
    {
      key: "ah_matchstatus",
      title: () => t("page.settlement.writeoff.status"),
      width: 110,
      align: "center" as const,
      render: (row) => {
        const statusMap: Record<
          string,
          {
            type: "default" | "info" | "success" | "error" | "warning";
            text: string;
          }
        > = {
          MATCHED: { type: "success", text: "Matched" },
          UNMATCHED: { type: "error", text: "Unmatched" },
          PARTIAL: { type: "warning", text: "Partial" },
        };
        const status = statusMap[row.ah_matchstatus] || {
          type: "default" as const,
          text: row.ah_matchstatus || "-",
        };
        return h(NTag, { type: status.type, size: "small" }, () => status.text);
      },
    },
    {
      key: "ap_reason",
      title: () => t("page.settlement.writeoff.remark"),
      width: 80,
      ellipsis: {
        tooltip: true,
      },
    },
    {
      key: "ap_systemcreatetimeutc",
      title: () => t("page.settlement.writeoff.createdAt"),
      width: 180,
      align: "center" as const,
      render: (row) => {
        if (!row.ap_systemcreatetimeutc) return "-";
        return row.ap_systemcreatetimeutc.replace("T", " ").split(".")[0];
      },
      ellipsis: { tooltip: true },
    },
  ];
}
