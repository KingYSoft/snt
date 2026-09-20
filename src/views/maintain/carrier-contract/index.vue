<script setup lang="ts">
defineOptions({ name: 'PageMaintainCarrierContract' });
</script>

<template>
  <div class="p-16px">
    <NCard :title="$t('route.maintain_carrier_contract')">
      <NEmpty :description="$t('common.lookForward')" />
    </NCard>
  </div>
</template>
