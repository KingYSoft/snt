<script setup lang="ts">
import { computed, h } from 'vue';
import { useRouter } from 'vue-router';
import type { DataTableColumns } from 'naive-ui';
import { NButton, NDataTable, NCard, NForm, NFormItemGi, NGrid } from 'naive-ui';
import { $t } from '@/locales';

const props = defineProps<{ inputData: Record<string, any> }>();

const router = useRouter();

function displayText(value: unknown) {
  const text = String(value ?? '').trim();
  return text || '—';
}

function navigateToConsolidation(row: Record<string, any>) {
  const pk = String(row.jk_pk || row.pk || row.id || props.inputData.js_jx || '').trim();
  const reference = String(row.reference || '').trim();
  if (!pk) {
    window.$message?.warning($t('common.error'));
    return;
  }
  router.push({
    name: 'business_consolidation-edite',
    params: { pk },
    query: {
      id: row.id || pk,
      con_unique_consign_ref: reference
    }
  });
}

const consolidationColumns = computed<DataTableColumns<Record<string, any>>>(() => [
  {
    title: $t('page.business.shipment.section.reference'),
    key: 'reference',
    minWidth: 160,
    ellipsis: { tooltip: true },
    render(row) {
      const text = String(row.reference || '').trim();
      if (!text) return '—';
      return h(
        NButton,
        {
          text: true,
          type: 'primary',
          onClick: (event: MouseEvent) => {
            event.stopPropagation();
            navigateToConsolidation(row);
          }
        },
        { default: () => text }
      );
    }
  },
  {
    title: $t('page.business.shipment.section.firstLoad'),
    key: 'first_load',
    minWidth: 120,
    ellipsis: { tooltip: true }
  },
  {
    title: $t('page.business.shipment.section.lastDisc'),
    key: 'last_disc',
    minWidth: 120,
    ellipsis: { tooltip: true }
  },
  {
    title: $t('page.business.shipment.section.masterBill'),
    key: 'master_bill',
    minWidth: 140,
    ellipsis: { tooltip: true }
  }
]);

function consolidationRowKey(row: Record<string, any>) {
  return String(row.id || row.reference || row.master_bill || JSON.stringify(row));
}
</script>

<template>
  <div class="p-4">
    <NForm label-placement="left" label-width="130">
      <NCard :title="$t('page.business.shipment.section.additionalDetails')" size="small" class="mb-12px">
        <NGrid :cols="4" :x-gap="12">
          <NFormItemGi :label="$t('page.business.shipment.section.onBoardDate')">
            <span>{{ displayText(inputData.shp_on_board_date) }}</span>
          </NFormItemGi>
        </NGrid>
      </NCard>

      <NCard :title="$t('page.business.shipment.section.consolidation')" size="small" class="mb-12px">
        <NDataTable
          :columns="consolidationColumns"
          :data="inputData.consolidation_list || []"
          :bordered="true"
          size="small"
          :row-key="consolidationRowKey"
          :scroll-x="600"
          :min-height="0"
        />
      </NCard>

      <NCard :title="$t('page.business.shipment.section.voyageDetails')" size="small">
        <NGrid :cols="4" :x-gap="12">
          <NFormItemGi :label="$t('page.business.shipment.section.vessel')">
            <span>{{ displayText(inputData.shp_vessel || inputData.vessel) }}</span>
          </NFormItemGi>
          <NFormItemGi :label="$t('page.business.shipment.section.voyage')">
            <span>{{ displayText(inputData.shp_voyage || inputData.voyage) }}</span>
          </NFormItemGi>
          <NFormItemGi :label="$t('page.business.shipment.section.loadPort')">
            <span>{{ displayText(inputData.shp_load_port) }}</span>
          </NFormItemGi>
          <NFormItemGi :label="$t('page.business.shipment.section.dischargePort')">
            <span>{{ displayText(inputData.shp_discharge_port) }}</span>
          </NFormItemGi>
        </NGrid>
      </NCard>
    </NForm>
  </div>
</template>
