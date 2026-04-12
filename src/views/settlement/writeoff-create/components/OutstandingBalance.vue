<script setup lang="ts">
import { computed } from 'vue';
import { NSpace, NSpin } from 'naive-ui';
import type { OutstandingBalance } from '@/service/api/business/settlement';
import { useI18n } from 'vue-i18n';

defineOptions({ name: 'OutstandingBalance' });

const { t } = useI18n();

interface Props {
  balance: OutstandingBalance | null;
  loading: boolean;
}

const props = defineProps<Props>();

const hasBaseCurrencyAmount = computed(() => {
  return props.balance?.baseCurrencyAmount !== undefined && props.balance?.exchangeRate;
});
</script>

<template>
  <NSpace v-if="loading" vertical>
    <NSpin :size="16" />
  </NSpace>
  <NSpace v-else-if="balance" vertical>
    <div class="text-16px font-semibold">{{ balance.companyName }}</div>
    <div class="text-20px font-bold text-primary">{{ balance.balance.toFixed(2) }} {{ balance.currency }}</div>
    <div v-if="hasBaseCurrencyAmount" class="text-12px text-gray">
      {{ t('page.settlement.writeoff.create.baseCurrencyAmount') }}:
      {{ (balance.baseCurrencyAmount || 0).toFixed(2) }} CNY ({{ t('page.settlement.writeoff.create.exchangeRate') }}:
      {{ balance.exchangeRate }})
    </div>
  </NSpace>
  <div v-else class="text-gray">{{ t('page.settlement.writeoff.create.pleaseSelectCompany') }}</div>
</template>
