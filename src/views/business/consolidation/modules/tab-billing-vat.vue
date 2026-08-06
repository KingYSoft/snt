<script setup lang="ts">
import { NCard, NEmpty } from 'naive-ui';

defineProps<{ inputData: Record<string, any> }>();
</script>

<template>
  <NCard size="small" title="VAT Invoice">
    <NEmpty description="No VAT invoice query available" />
  </NCard>
</template>
