<script setup lang="ts">
import { computed } from 'vue';
import { NCard, NSpace, NRadioGroup, NRadio, NInputNumber, NSelect } from 'naive-ui';
import { useI18n } from 'vue-i18n';

defineOptions({ name: 'ExchangeRateCalculator' });

const { t } = useI18n();

interface Props {
  currency: string;
  isForeignCurrency: boolean;
}

defineProps<Props>();

const exchangeRateOption = defineModel<'reference' | 'bill'>('exchangeRateOption');
const settledAmount = defineModel<number>('settledAmount');
const conversionOperation = defineModel<string>('conversionOperation', { default: '×' });
const referenceExRate = defineModel<number>('referenceExRate');

const calculatedConvertedAmount = computed(() => {
  return (settledAmount.value || 0) * (referenceExRate.value || 0);
});
</script>

<template>
  <NCard size="small" :bordered="true" :title="t('page.settlement.writeoff.create.billExRate')">
    <NSpace vertical :size="12">
      <NRadioGroup v-model="exchangeRateOption">
        <NSpace>
          <NRadio value="reference">{{ t('page.settlement.writeoff.create.writeOffAtReferenceExRate') }}</NRadio>
          <NRadio value="bill">{{ t('page.settlement.writeoff.create.billExRate') }}</NRadio>
        </NSpace>
      </NRadioGroup>
      <!-- 显示原币种金额 -->
      <div v-if="isForeignCurrency" class="text-sm text-gray">
        {{ t('page.settlement.writeoff.create.originalCurrencyAmount') }}: 0.00 CNY
      </div>
      <NSpace :size="16" align="center">
        <span>{{ currency }}</span>
        <NInputNumber v-model:value="settledAmount" :precision="2" :min="0" :show-button="false" class="w-120px" />
        <NSelect v-model:value="conversionOperation" :options="[{ label: '×', value: '×' }]" style="width: 60px" />
        <NInputNumber
          v-model:value="referenceExRate"
          :precision="6"
          :min="0"
          placeholder="1.000000"
          :show-button="false"
          class="w-120px"
        />
        <span>=</span>
        <span>{{ calculatedConvertedAmount.toFixed(2) }} {{ currency }}</span>
        <span class="ml-16px font-bold">
          {{ t('page.settlement.writeoff.create.total') }}: {{ calculatedConvertedAmount.toFixed(2) }} {{ currency }}
        </span>
      </NSpace>
    </NSpace>
  </NCard>
</template>
