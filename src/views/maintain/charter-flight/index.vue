<script setup lang="ts">
defineOptions({ name: 'PageMaintainCharterFlight' });
</script>

<template>
  <div class="p-16px">
    <NCard :title="$t('route.maintain_charter_flight')">
      <NEmpty :description="$t('common.lookForward')" />
    </NCard>
  </div>
</template>
