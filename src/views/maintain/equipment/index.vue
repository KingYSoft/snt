<script setup lang="ts">
defineOptions({ name: 'PageMaintainEquipment' });
</script>

<template>
  <div class="p-16px">
    <NCard :title="$t('route.maintain_equipment')">
      <NEmpty :description="$t('common.lookForward')" />
    </NCard>
  </div>
</template>
