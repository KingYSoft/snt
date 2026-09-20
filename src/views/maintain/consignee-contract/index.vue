<script setup lang="ts">
defineOptions({ name: 'PageMaintainConsigneeContract' });
</script>

<template>
  <div class="p-16px">
    <NCard :title="$t('route.maintain_consignee_contract')">
      <NEmpty :description="$t('common.lookForward')" />
    </NCard>
  </div>
</template>
