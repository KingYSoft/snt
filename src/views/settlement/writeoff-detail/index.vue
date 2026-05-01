<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  NButton, NCard, NDataTable, NDivider, NGrid, NGi,
  NInput, NRadio, NRadioGroup, NSpace,
} from 'naive-ui';
import { matchTransactionsQueryLines } from '@/service/api/business/match-transactions';

defineOptions({ name: 'PageSettlementWriteoffDetail' });

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const te = (key: string) => t(`page.settlement.matchTransactions.editor.${key}`);

const pk = String(route.query.pk ?? '');
const loading = ref(true);

const formatNum = (n: any, digits = 2) => {
  const x = Number(n);
  if (Number.isNaN(x)) return '—';
  return new Intl.NumberFormat(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(x);
};

// ==================== Data ====================
const header = ref<Record<string, any> | null>(null);
const matchLink = ref<Record<string, any> | null>(null);
const lineItems = ref<any[]>([]);

onMounted(async () => {
  if (!pk) { loading.value = false; return; }
  try {
    const res: any = await matchTransactionsQueryLines({ apPk: pk });
    const data = res?.data ?? res;
    header.value = data?.header ?? null;
    matchLink.value = data?.matchLink ?? null;
    lineItems.value = Array.isArray(data?.transactionLines) ? data.transactionLines : [];
  } catch (error) {
    console.error(error);
    window.$message?.error('Failed to load detail.');
  } finally { loading.value = false; }
});

// ==================== Summary ====================
const summaryRows = computed(() => {
  const map = new Map<string, any>();
  for (const row of lineItems.value as any[]) {
    const currency = String(row.currency ?? '');
    const exRate = Number(row.ex_rate ?? 1);
    if (Number.isNaN(exRate)) continue;
    const key = `${currency}__${exRate}`;
    const cur = map.get(key) ?? { key, currency, exRate: Number.isFinite(exRate) ? exRate : 1, osAmount: 0, settledAmount: 0, homeAmount: 0 };
    cur.osAmount += Number(row.outstanding) || 0;
    cur.settledAmount += Number(row.settlement_amount_original) || 0;
    cur.homeAmount += Number(row.settlement_amount_home) || 0;
    map.set(key, cur);
  }
  return Array.from(map.values());
});

const summaryTotalHomeAmount = computed(() =>
  summaryRows.value.reduce((acc: number, r: any) => acc + (Number(r.homeAmount) || 0), 0),
);

const lineLedgerDisplay = computed(() => {
  const u = String(header.value?.ah_ledger ?? 'AR').trim().toUpperCase();
  return u === 'AP' ? 'AP' : 'AR';
});

// ==================== Line table ====================
const lineColumns = [
  { key: 'index', title: '#', width: 50, align: 'center' as const, render: (_: any, i: number) => i + 1 },
  { key: 'ledger', title: 'Ledger', width: 80, align: 'center' as const },
  { key: 'job_no', title: 'Job No.', width: 120, ellipsis: { tooltip: true } },
  { key: 'tax_invoice_no', title: 'Tax Invoice No.', width: 140, ellipsis: { tooltip: true } },
  { key: 'invoice_number', title: 'Invoice Number', width: 140, ellipsis: { tooltip: true } },
  { key: 'billing_date', title: 'Billing Date', width: 120 },
  { key: 'charge_desc', title: 'Charge Desc.', width: 140, ellipsis: { tooltip: true } },
  { key: 'outstanding', title: 'Outstanding', width: 120, align: 'right' as const, render: (r: any) => formatNum(r.outstanding) },
  { key: 'settlement_amount_original', title: 'Settled (Original)', width: 200, align: 'right' as const, render: (r: any) => formatNum(r.settlement_amount_original) },
  { key: 'currency', title: 'Currency', width: 80, align: 'center' as const },
  { key: 'ex_rate', title: 'Ex. Rate', width: 100, align: 'right' as const, render: (r: any) => formatNum(r.ex_rate, 6) },
  { key: 'settlement_amount_home', title: 'Settled (Home)', width: 180, align: 'right' as const, render: (r: any) => formatNum(r.settlement_amount_home) },
];

function handleBack() { router.push({ name: 'settlement_writeoff' }); }
function handleEdit() { router.push({ name: 'settlement_writeoff-edit', query: { pk } }); }
</script>

<template>
  <div class="h-full overflow-auto p-16px">
    <NCard :title="header?.ah_transactionnum ?? pk" :bordered="false">
      <template #header-extra>
        <NSpace>
          <NButton type="primary" @click="handleEdit">{{ t('common.edit') }}</NButton>
          <NButton @click="handleBack">{{ te('back') }}</NButton>
        </NSpace>
      </template>

      <NSkeleton v-if="loading" text :row="10" />
      <template v-else-if="header">
        <!-- Form section (same 3-column layout) -->
        <NGrid :cols="24" :x-gap="12" :y-gap="12" class="mb-12px">
          <!-- Company + Description -->
          <NGi :span="6">
            <NSpace vertical>
              <NInput :value="header.companyName" readonly>
                <template #prefix>{{ te('settleCompany') }}:</template>
              </NInput>
              <NInput :value="header.ah_desc" readonly type="textarea" :rows="6">
                <template #prefix>{{ te('description') }}:</template>
              </NInput>
            </NSpace>
          </NGi>

          <!-- Bank / Match Record -->
          <NGi :span="12">
            <NCard size="small" :bordered="true">
              <template #header>{{ te('bankTransactionRecord') }}</template>
              <NGrid :cols="2" :x-gap="12" :y-gap="8">
                <NGi>
                  <NInput :value="header.ah_rx_nktransactioncurrency" readonly size="small">
                    <template #prefix>{{ te('currency') }}:</template>
                  </NInput>
                </NGi>
                <NGi>
                  <NInput :value="matchLink?.ap_matchdate ? matchLink.ap_matchdate.split('T')[0] : '-'" readonly size="small">
                    <template #prefix>{{ te('settleDate') }}:</template>
                  </NInput>
                </NGi>
                <NGi>
                  <NInput :value="matchLink?.ap_matchgroupnum ?? '-'" readonly size="small">
                    <template #prefix>Match Group:</template>
                  </NInput>
                </NGi>
                <NGi>
                  <NInput :value="matchLink?.ap_reason || '-'" readonly size="small">
                    <template #prefix>Reason:</template>
                  </NInput>
                </NGi>
                <NGi>
                  <NInput :value="formatNum(matchLink?.ap_amount)" readonly size="small">
                    <template #prefix>{{ te('settleAmount') }}:</template>
                  </NInput>
                </NGi>
                <NGi>
                  <NInput :value="formatNum(header.ah_outstandingamount)" readonly size="small">
                    <template #prefix>{{ te('balance') }}:</template>
                  </NInput>
                </NGi>
              </NGrid>
            </NCard>
          </NGi>

          <!-- Exchange Rate Summary -->
          <NGi :span="6">
            <NCard size="small" :bordered="true">
              <NRadioGroup value="system" disabled size="small">
                <NRadio value="system" size="small">{{ te('systemExRate') }}</NRadio>
              </NRadioGroup>
              <div class="mt-8px">
                <table class="w-full text-12px">
                  <thead>
                    <tr>
                      <th class="text-right pa-4px">{{ te('osAmount') }}</th>
                      <th class="text-right pa-4px">{{ te('settledAmount') }}</th>
                      <th class="text-right pa-4px">{{ te('exRate') }}</th>
                      <th class="text-right pa-4px">{{ te('homeAmount') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="r in summaryRows" :key="r.key">
                      <td class="text-right pa-4px">{{ formatNum(r.osAmount) }}</td>
                      <td class="text-right pa-4px">{{ formatNum(r.settledAmount) }}</td>
                      <td class="text-right pa-4px">{{ r.currency }} {{ formatNum(r.exRate, 6) }}</td>
                      <td class="text-right pa-4px">{{ formatNum(r.homeAmount) }}</td>
                    </tr>
                    <tr class="font-bold">
                      <td class="text-right pa-4px" colspan="3">{{ te('total') }}</td>
                      <td class="text-right pa-4px">{{ formatNum(summaryTotalHomeAmount) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </NCard>
          </NGi>
        </NGrid>

        <NDivider style="margin: 8px 0" />

        <NSpace align="center" class="mb-8px">
          <NRadioGroup :value="lineLedgerDisplay" disabled size="small">
            <NRadio value="AR" size="small">AR</NRadio>
            <NRadio value="AP" size="small">AP</NRadio>
          </NRadioGroup>
        </NSpace>

        <NDivider style="margin: 8px 0" />

        <NDataTable :columns="lineColumns" :data="lineItems" :bordered="false" striped :pagination="false" size="small" :scroll-x="1700" />
      </template>
    </NCard>
  </div>
</template>

<style scoped>
table { border-collapse: collapse; }
</style>
