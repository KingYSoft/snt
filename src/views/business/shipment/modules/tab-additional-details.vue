<script setup lang="ts">
import { computed } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NDataTable, NCard, NForm, NFormItemGi, NGrid } from 'naive-ui';
import { $t } from '@/locales';

const props = defineProps<{ inputData: Record<string, any> }>();

function displayText(value: unknown) {
  const text = String(value ?? '').trim();
  return text || '—';
}

const consolidationColumns = computed<DataTableColumns<Record<string, any>>>(() => [
  { title: 'Reference', key: 'reference', minWidth: 160, ellipsis: { tooltip: true } },
  { title: '1st Load', key: 'first_load', minWidth: 120, ellipsis: { tooltip: true } },
  { title: 'Last Disc', key: 'last_disc', minWidth: 120, ellipsis: { tooltip: true } },
  { title: 'Master Bill', key: 'master_bill', minWidth: 140, ellipsis: { tooltip: true } }
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
          <NFormItemGi label="On Board Date:">
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
          <NFormItemGi label="Vessel:">
            <span>{{ displayText(inputData.shp_vessel || inputData.vessel) }}</span>
          </NFormItemGi>
          <NFormItemGi label="Voyage:">
            <span>{{ displayText(inputData.shp_voyage || inputData.voyage) }}</span>
          </NFormItemGi>
          <NFormItemGi label="Load Port:">
            <span>{{ displayText(inputData.shp_load_port) }}</span>
          </NFormItemGi>
          <NFormItemGi label="Discharge Port:">
            <span>{{ displayText(inputData.shp_discharge_port) }}</span>
          </NFormItemGi>
        </NGrid>
      </NCard>
    </NForm>
  </div>
</template>
