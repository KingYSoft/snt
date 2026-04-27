<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { queryWriteoffDetail } from "@/service/api/business/settlement";
defineOptions({ name: "PageSettlementWriteoffDetail" });

const route = useRoute();
const loading = ref(false);
const detailData = ref<Record<string, any> | null>(null);
const matchLinks = ref<Array<any>>([]);

const apPk = route.query.apPk as string;

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "string" && value.includes("T"))
    return value.split("T")[0];
  return String(value);
}
const matchColumns = [
  { title: "Amount", key: "ap_amount", width: 120, align: "right" as const },
  { title: "GST", key: "ap_gstrealised", width: 100, align: "right" as const },
  {
    title: "Match Date",
    key: "ap_matchdate",
    width: 120,
    align: "center" as const,
    render: (row: any) =>
      row.ap_matchdate ? row.ap_matchdate.split("T")[0] : "-",
  },
  {
    title: "OS Amount",
    key: "ap_osamount",
    width: 120,
    align: "right" as const,
  },
  { title: "Reason", key: "ap_reason", width: 120 },
  { title: "Created By", key: "ap_systemcreateuser", width: 120 },
  {
    title: "Created Time",
    key: "ap_systemcreatetimeutc",
    width: 160,
    render: (row: any) =>
      row.ap_systemcreatetimeutc
        ? row.ap_systemcreatetimeutc.replace("T", " ").split(".")[0]
        : "-",
  },
];
onMounted(() => {
  if (apPk) {
    loadWriteoffDetail();
  }
});

async function loadWriteoffDetail() {
  loading.value = true;

  detailData.value = null;
  matchLinks.value = [];

  try {
    const { data } = await queryWriteoffDetail(apPk);
    if (data) {
      detailData.value = data.header;
      matchLinks.value = data.matchLink ? [data.matchLink] : [];
    }
  } catch {
    window.$message?.error("Failed to load detail");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="h-full overflow-auto p-16px">
    <NCard
      :title="`销账详情 - ${detailData?.ah_transactionnum ?? ''}`"
      :bordered="false"
    >
      <NSkeleton v-if="loading" text :row="8" />
      <template v-else-if="detailData">
        <NDescriptions
          label-placement="left"
          :column="2"
          bordered
          class="mb-12px"
        >
          <NDescriptionsItem label="Transaction No.">{{
            formatValue(detailData.ah_transactionnum)
          }}</NDescriptionsItem>
          <NDescriptionsItem label="Company">{{
            formatValue(detailData.companyName)
          }}</NDescriptionsItem>
          <NDescriptionsItem label="Type">{{
            formatValue(detailData.ah_transactiontype)
          }}</NDescriptionsItem>
          <NDescriptionsItem label="Currency">{{
            formatValue(detailData.ah_rx_nktransactioncurrency)
          }}</NDescriptionsItem>
          <NDescriptionsItem label="Invoice Amount">{{
            detailData.ah_invoiceamount?.toFixed(2) ?? "-"
          }}</NDescriptionsItem>
          <NDescriptionsItem label="Outstanding">{{
            detailData.ah_outstandingamount?.toFixed(2) ?? "-"
          }}</NDescriptionsItem>
          <NDescriptionsItem label="OS Total">{{
            detailData.ah_ostotal?.toFixed(2) ?? "-"
          }}</NDescriptionsItem>
          <NDescriptionsItem label="Match Status">{{
            formatValue(detailData.ah_matchstatus)
          }}</NDescriptionsItem>
          <NDescriptionsItem label="Ledger">{{
            formatValue(detailData.ah_ledger)
          }}</NDescriptionsItem>
          <NDescriptionsItem label="Fully Paid Date">{{
            formatValue(detailData.ah_fullypaiddate)
          }}</NDescriptionsItem>
          <NDescriptionsItem label="Description" :span="2">{{
            formatValue(detailData.ah_desc)
          }}</NDescriptionsItem>
        </NDescriptions>

        <NCard title="Match Links" size="small">
          <NDataTable
            v-if="matchLinks.length > 0"
            :columns="matchColumns"
            :data="matchLinks"
            :bordered="true"
            size="small"
            :pagination="false"
            :row-key="(row: any) => row.id ?? row.ap_pk"
          />
          <div v-else class="py-12px text-center text-gray-400">
            No match links
          </div>
        </NCard>
      </template>
    </NCard>
  </div>
</template>
