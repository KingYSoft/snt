<script setup lang="ts">
import { NCard, NEmpty } from 'naive-ui';

defineProps<{ inputData: Record<string, any> }>();
</script>

<template>
  <NCard size="small" :title="$t('page.business.consolidation.billing.vatEmpty')">
    <NEmpty :description="$t('page.business.consolidation.billing.vatEmptyDesc')" />
  </NCard>
</template>
