<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */
import { h, watch } from 'vue';
import { NDataTable, NButton, NInput, NDatePicker, NCard, NFormItemGi, NGrid } from 'naive-ui';
import { $t } from '@/locales';

const props = defineProps<{ inputData: Record<string, any> }>();

// Initialize notify_party1 if needed
watch(
  () => props.inputData,
  newVal => {
    if (newVal) {
      if (!newVal.notify_party1) {
        newVal.notify_party1 = {
          add_address_name: '',
          add_address1: '',
          add_address2: '',
          add_address3: ''
        };
      }
      if (!newVal.vgm_unit) {
        newVal.vgm_unit = 'KG';
      }
    }
  },
  { immediate: true, deep: true }
);

// --- Consolidation table ---
const consolidationColumns = [
  {
    title: '',
    key: 'actions',
    width: 60,
    align: 'center' as const,
    render(_: any, index: number) {
      return h(
        NButton,
        {
          text: true,
          type: 'error',
          size: 'small',
          onClick: () => deleteConsolidationLine(index)
        },
        { default: () => 'Del' }
      );
    }
  },
  {
    title: 'Reference',
    key: 'reference',
    width: 140,
    render(row: any) {
      return h(NInput, {
        value: row.reference,
        size: 'small',
        'onUpdate:value': (v: string) => {
          row.reference = v;
        }
      });
    }
  },
  {
    title: '1st Load',
    key: 'first_load',
    width: 140,
    render(row: any) {
      return h(NInput, {
        value: row.first_load,
        size: 'small',
        'onUpdate:value': (v: string) => {
          row.first_load = v;
        }
      });
    }
  },
  {
    title: 'Last Disc',
    key: 'last_disc',
    width: 140,
    render(row: any) {
      return h(NInput, {
        value: row.last_disc,
        size: 'small',
        'onUpdate:value': (v: string) => {
          row.last_disc = v;
        }
      });
    }
  },
  {
    title: 'Master Bill',
    key: 'master_bill',
    width: 140,
    render(row: any) {
      return h(NInput, {
        value: row.master_bill,
        size: 'small',
        'onUpdate:value': (v: string) => {
          row.master_bill = v;
        }
      });
    }
  }
];

function addConsolidationLine() {
  if (!props.inputData.consolidation_list) {
    props.inputData.consolidation_list = [];
  }
  props.inputData.consolidation_list.push({
    reference: '',
    first_load: '',
    last_disc: '',
    master_bill: ''
  });
}

function deleteConsolidationLine(index: number) {
  props.inputData.consolidation_list?.splice(index, 1);
}
</script>

<!-- eslint-disable vue/no-mutating-props -->
<template>
  <div class="p-4">
    <NForm label-placement="left" label-width="120">
      <NCard :title="$t('page.business.shipment.section.additionalDetails')" size="small" class="mb-12px">
        <NGrid :cols="4" :x-gap="12">
          <NFormItemGi label="On Board Date">
            <NDatePicker
              :formatted-value="inputData.shp_on_board_date"
              type="date"
              value-format="yyyy-MM-dd"
              style="width: 100%"
              @update:formatted-value="(v: string) => (inputData.shp_on_board_date = v)"
            />
          </NFormItemGi>
        </NGrid>
      </NCard>

      <!-- Consolidation Details -->
      <NCard size="small" class="mb-12px">
        <template #header>
          {{ $t('page.business.shipment.section.consolidation') }}
        </template>
        <template #header-extra>
          <NButton type="primary" size="small" @click="addConsolidationLine">
            {{ $t('common.add') }}
          </NButton>
        </template>
        <NDataTable
          :columns="consolidationColumns"
          :data="inputData.consolidation_list || []"
          :bordered="true"
          size="small"
          :row-key="(row: any) => String(row.id ?? Math.random())"
          :scroll-x="600"
          :min-height="0"
        />
      </NCard>

      <!-- Voyage Details -->
      <NCard :title="$t('page.business.shipment.section.voyageDetails')" size="small">
        <NGrid :cols="4" :x-gap="12">
          <NFormItemGi label="Vessel">
            <NInput
              :value="inputData.shp_vessel || inputData.vessel"
              @update:value="
                (v: string) => {
                  inputData.shp_vessel = v;
                  inputData.vessel = v;
                }
              "
            />
          </NFormItemGi>
          <NFormItemGi label="Voyage">
            <NInput
              :value="inputData.shp_voyage || inputData.voyage"
              @update:value="
                (v: string) => {
                  inputData.shp_voyage = v;
                  inputData.voyage = v;
                }
              "
            />
          </NFormItemGi>
          <NFormItemGi label="Load Port">
            <NInput :value="inputData.shp_load_port" @update:value="(v: string) => (inputData.shp_load_port = v)" />
          </NFormItemGi>
          <NFormItemGi label="Discharge Port">
            <NInput
              :value="inputData.shp_discharge_port"
              @update:value="(v: string) => (inputData.shp_discharge_port = v)"
            />
          </NFormItemGi>
        </NGrid>
      </NCard>
    </NForm>
  </div>
</template>
